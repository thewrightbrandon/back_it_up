const path = require('path');
const { hashFile, getFilesInDirectory, readFileContent } = require('../utils/fileSystem')
const { pool } = require('../../config/databaseConfig');

const takeIncrementalSnapshot = async (directoryPath) => {

    try {

        console.log("Preparing file snapshot...");

        const allFilesQuery = `SELECT filename, content_hash FROM files`;
        const allFilesResult = await pool.query(allFilesQuery);
        console.log(`Files found in the database: ${allFilesResult.rows.length}`);

        const recordedFiles = new Map(allFilesResult.rows.map((file) => {
            return [file.filename, file.content_hash]
        }));

        const currentFiles = await getFilesInDirectory(directoryPath);
        console.log(`Files found in specified directory: ${currentFiles.length}`);

        const newFiles = [];
        const modifiedFiles = [];

        for (const filePath of currentFiles) {
            const fileName = path.basename(filePath);
            const fileHash = await hashFile(filePath);

            if (!recordedFiles.has(fileName)) {
                newFiles.push({ filePath, fileHash });
            } else if (recordedFiles.get(fileName) !== fileHash) {
                modifiedFiles.push({ filePath, fileHash });
            }
        }

        const snapshotQuery = `INSERT INTO snapshots (timestamp) VALUES (DATE_TRUNC('second', CURRENT_TIMESTAMP)) RETURNING id`;
        const snapshotResult = await pool.query(snapshotQuery);
        const snapshotId = snapshotResult.rows[0].id;

        const filePromises = [];

        for (const newFile of newFiles) {

            try {

                const fileContent = await readFileContent(newFile.filePath);
                const fileQuery = `
                    INSERT INTO files (filename, content_hash, snapshot_id, content) 
                    VALUES ($1, $2, $3, $4)
                `;

                filePromises.push(pool.query(fileQuery, [path.basename(newFile.filePath), newFile.fileHash, snapshotId, fileContent]));
                console.log(`Inserted new file into database: ${path.basename(newFile.filePath)}`);

            } catch (error) {
                console.error(`Error processing new file: ${newFile.filePath}`, error);
            }
        }

        for (const modifiedFile of modifiedFiles) {

            try {

                const modifiedFileContent = await readFileContent(modifiedFile.filePath);
                // insert new file if content hashes are different
                const fileQuery = `
                    INSERT INTO files (filename, content_hash, snapshot_id, content)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (filename, snapshot_id) 
                    DO UPDATE SET 
                      content_hash = EXCLUDED.content_hash, 
                      content = EXCLUDED.content
                `;

                filePromises.push(pool.query(fileQuery, [path.basename(modifiedFile.filePath), modifiedFile.fileHash, snapshotId, modifiedFileContent]));
                console.log(`Updated file in database: ${path.basename(modifiedFile.filePath)}`);

            } catch (error) {
                console.error(`Error processing modified file: ${modifiedFile.filePath}`, error);
            }
        }

        await Promise.all(filePromises);
        console.log(`Snapshot successfully created with ID: ${snapshotId}`);

    } catch (error) {
        console.error('Error creating incremental snapshot:', error.message);
        throw error;
    }
};

const listSnapshots = async () => {

    try {

        const query = `
            SELECT id, TO_CHAR(timestamp, 'YYYY-MM-DD HH:MM:SS') AS formatted_timestamp
            FROM snapshots
            ORDER BY timestamp DESC
        `;

        const result = await pool.query(query);

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