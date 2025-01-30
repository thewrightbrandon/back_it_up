const { hashFile, getFilesInDirectory, getFileStats, readFileContent } = require('../utils/fileSystem')
const { pool } = require('../../config/databaseConfig');

// OPERATION: SNAPSHOT
const takeSnapshot = async (directoryPath) => {

    try {
        const snapshotQuery = `INSERT INTO snapshots (timestamp) VALUES (CURRENT_TIMESTAMP::timestamp(0)) RETURNING id`;
        // executes single sql query, uses a connection from the pool and returns results
        const snapshotResult = await pool.query(snapshotQuery);
        // assign snapshotId variable to insert into files table to associate snapshots with files
        let snapshotId = snapshotResult.rows[0].id;

        // gets file from specified directory
        const files = getFilesInDirectory(directoryPath);
        const filePromises = [];

        for (const file of files) {

            try {
                // get file stats for each file and make sure we are dealing with just a file
                const stat = getFileStats(file);
                if (stat.isFile()) {
                    // calculate file hash
                    const fileHash = hashFile(file);
                    // read file content as Buffer
                    const fileContent = readFileContent(file);

                    const fileQuery = `INSERT INTO files (filename, content_hash, snapshot_id, content)
                                    VALUES ($1, $2, $3, $4)
                    `;

                    filePromises.push(pool.query(fileQuery, [file, fileHash, snapshotId, fileContent]));
                }

            } catch (error) {
                console.error(`Error processing file: ${file}`, error);
            }
        }

        // wait for all file insertions
        await Promise.all(filePromises);

        console.log('Snapshot successfully created with ID:', snapshotId);

    } catch (error) {
        console.error('Error during snapshot creation:', error.message);
        throw error;
    }
};

// OPERATION: LIST
const listSnapshots = async () => {

    try {
        // will list snapshots by most recent
        const query = `SELECT id, timestamp FROM snapshots ORDER BY timestamp DESC`;
        const result = await pool.query(query);

        // stop process if table is empty
        if (!result.rows.length) {
            console.log('No snapshots found.');
            return;
        }

        // stdout
        console.log('SNAPSHOT  |  TIMESTAMP');
        for (const snapshot of result.rows) {
            console.log(`${snapshot.id}  |  ${snapshot.timestamp}`);
        }

    } catch (error) {
        console.error('Error listing snapshots:', error.message);
        throw error;
    }
};

module.exports = { takeSnapshot, listSnapshots };