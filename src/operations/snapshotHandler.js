const path = require('path');
const { hashFile, getFilesInDirectory, readFileContent } = require('../utils/fileSystem')
const { pool } = require('../../config/databaseConfig');

// OPERATION: INCREMENTAL SNAPSHOT
const takeIncrementalSnapshot = async (directoryPath) => {

    try {

        console.log("Preparing file snapshot...");
        // fetch all files from the database
        const allFilesQuery = `SELECT filename, content_hash FROM files`;
        const allFilesResult = await pool.query(allFilesQuery);
        console.log(`Files found in the database: ${allFilesResult.rows.length}`);
        const recordedFiles = new Map(allFilesResult.rows.map((file) => {
            return [file.filename, file.content_hash]
        }));

        // fetch current files from the specified directory
        const currentFiles = await getFilesInDirectory(directoryPath);
        console.log(`Files found in specified directory: ${currentFiles.length}`);

        // files will need to be compared from previous state and current state to make informed incremental changes
        const newFiles = [];
        const modifiedFiles = [];

        // compare current directory files against all files recorded in database
        for (const filePath of currentFiles) {
            // takes a file path as an argument and returns the last item of the path to retrieve filename
            const fileName = path.basename(filePath);
            // calculate file hash
            const fileHash = await hashFile(filePath);

            // if the database does not contain a file with the same fileName, file is considered new
            // has() check if key exists in the Map, fileName
            if (!recordedFiles.has(fileName)) {
                newFiles.push({ filePath, fileHash });
            // if the database contains a file with the same fileName but with a different hash, file is considered to need updating
            // get() grabs the value that corresponds with the key, fileHash
            } else if (recordedFiles.get(fileName) !== fileHash) {
                modifiedFiles.push({ filePath, fileHash });
            }
        }

        // store new snapshot in database, round CURRENT_TIMESTAMP to the second to remove milliseconds
        const snapshotQuery = `INSERT INTO snapshots (timestamp) VALUES (DATE_TRUNC('second', CURRENT_TIMESTAMP)) RETURNING id`;
        const snapshotResult = await pool.query(snapshotQuery);
        // assign snapshotId variable to insert into files table to associate snapshots with files
        const snapshotId = snapshotResult.rows[0].id;
        console.log(`Snapshot created with an ID of: ${snapshotId}`);

        // insert new and modified files into the database and remove the files that are considered to be deleted
        const filePromises = [];

        // insertion of new files
        for (const newFile of newFiles) {

            try {
                // read file content as Buffer
                const fileContent = await readFileContent(newFile.filePath);
                const fileQuery = `
                    INSERT INTO files (filename, content_hash, snapshot_id, content) 
                    VALUES ($1, $2, $3, $4)
                `;
                filePromises.push(pool.query(fileQuery, [path.basename(newFile.filePath), newFile.fileHash, snapshotId, fileContent]));
                // log when a new file is inserted into the database
                console.log(`Inserted new file into database: ${path.basename(newFile.filePath)}`);
            } catch (error) {
                console.error(`Error processing new file: ${newFile.filePath}`, error);
            }
        }

        // insertion OR updating of modified files
        for (const modifiedFile of modifiedFiles) {

            try {
                const modifiedFileContent = await readFileContent(modifiedFile.filePath);
                // ON CONFLICT if there is a file with the same filename + snapshot_id that already exists, the file is not inserted into the database but updated instead
                // DO UPDATE SET tells the database to update the existing row's content_hash + content columns
                const fileQuery = `
                    INSERT INTO files (filename, content_hash, snapshot_id, content)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (filename, snapshot_id) 
                    DO UPDATE SET content_hash = EXCLUDED.content_hash, content = EXCLUDED.content
                `;
                filePromises.push(pool.query(fileQuery, [path.basename(modifiedFile.filePath), modifiedFile.fileHash, snapshotId, modifiedFileContent]));
                // Log when a file is updated
                console.log(`Updated file in database: ${path.basename(modifiedFile.filePath)}`);
            } catch (error) {
                console.error(`Error processing modified file: ${modifiedFile.filePath}`, error);
            }
        }

        // wait for all database changes to be applied
        await Promise.all(filePromises);

        console.log(`Snapshot successfully created with ID: ${snapshotId}`);
    } catch (error) {
        console.error('Error creating incremental snapshot:', error.message);
        throw error;
    }
};

// OPERATION: LIST
const listSnapshots = async () => {
    try {
        // Use TO_CHAR to format the timestamp
        const query = `
            SELECT id, TO_CHAR(timestamp, 'YYYY-MM-DD HH:MM:SS') AS formatted_timestamp
            FROM snapshots
            ORDER BY timestamp DESC
        `;
        const result = await pool.query(query);

        // stop process if table is empty
        if (!result.rows.length) {
            console.log('No snapshots found.');
            return;
        }

        console.log('SNAPSHOT | TIMESTAMP');
        for (const snapshot of result.rows) {
            console.log(`${snapshot.id} | ${snapshot.formatted_timestamp}`);
        }

    } catch (error) {
        console.error('Error listing snapshots:', error.message);
        throw error;
    }
};

module.exports = { takeIncrementalSnapshot, listSnapshots };