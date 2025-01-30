const path = require('path');
const { hashFile, getFilesInDirectory, readFileContent } = require('../utils/fileSystem')
const { pool } = require('../../config/databaseConfig');

// OPERATION: INCREMENTAL SNAPSHOT
const takeIncrementalSnapshot = async (directoryPath) => {

    try {
        // query database for most recent snapshot
        const latestSnapshotQuery = `SELECT id, timestamp FROM snapshots ORDER BY timestamp DESC LIMIT 1`;
        const latestSnapshotResult = await pool.query(latestSnapshotQuery);

        let previousSnapshotId;
        // check if snapshot exists in database
        if (latestSnapshotResult.rows.length) {
            previousSnapshotId = latestSnapshotResult.rows[0].id;
        }

        // fetch files from the specified directory
        const currentFiles = getFilesInDirectory(directoryPath);

        // fetch the files from the previous snapshot if one exists
        let previousFiles = [];

        if (previousSnapshotId) {
            const previousFilesQuery = `SELECT filename, content_hash FROM files WHERE snapshot_id = $1`;
            const previousFilesResult = await pool.query(previousFilesQuery, [previousSnapshotId]);
            // these files will serve as a comparison to the files in the current state of the specified directory
            previousFiles = previousFilesResult.rows;
        }

        // files will need to be compared from previous state and current state to make informed incremental changes
        const newFiles = [];
        const modifiedFiles = [];

        // loop through files in current state of specified directory
        for (const currentFilePath of currentFiles) {
            // calculate file hash
            const currentFileHash = await hashFile(currentFilePath);
            // takes a file path as an argument and returns the last item of the path to retrieve filename
            const currentFileName = path.basename(currentFilePath);

            // check if the current filename matches any previous filenames
            const previousFile = previousFiles.find((file) => {
                return file.filename === currentFileName
            });

            // if previousFile returns false, the current file is handled as a new file to the current directory
            if (!previousFile) {
                newFiles.push({ filePath: currentFilePath, fileHash: currentFileHash });
            // of previousFile returns true, check the content hash to confirm if there were any changes made to the file
            } else if (previousFile.content_hash !== currentFileHash) {
                // if the content hash has changed, the file has been modified
                modifiedFiles.push({ filePath: currentFilePath, fileHash: currentFileHash });
            }
        }

        // store new snapshot in database, round CURRENT_TIMESTAMP to the second to remove milliseconds
        const snapshotQuery = `INSERT INTO snapshots (timestamp) VALUES (DATE_TRUNC('second', CURRENT_TIMESTAMP)) RETURNING id`;
        const snapshotResult = await pool.query(snapshotQuery);
        // assign snapshotId variable to insert into files table to associate snapshots with files
        const snapshotId = snapshotResult.rows[0].id;

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
            } catch (error) {
                console.error(`Error processing modified file: ${modifiedFile.filePath}`, error);
            }
        }

        // wait for all database changes to be applied
        await Promise.all(filePromises);

        console.log(`Incremental snapshot successfully created with ID: ${snapshotId}`);
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