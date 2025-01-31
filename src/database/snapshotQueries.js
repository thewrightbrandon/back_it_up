const { pool } = require('../../config/databaseConfig');

const getRecordedFiles = async () => {

    try {

        const allFilesQuery = `SELECT filename, content_hash, relative_path FROM files`;
        const allFilesResult = await pool.query(allFilesQuery);

        return new Map(allFilesResult.rows.map((file) =>
            [`${file.relative_path}/${file.filename}`, file.content_hash]
        ));

    } catch (error) {
        console.error('Error fetching recorded files from database:', error.message);
        throw error;
    }
};

const createSnapshot = async () => {

    try {

        const snapshotQuery = `
            INSERT INTO snapshots (timestamp) 
            VALUES (DATE_TRUNC('second', CURRENT_TIMESTAMP)) 
            RETURNING id
        `;

        const snapshotResult = await pool.query(snapshotQuery);
        return snapshotResult.rows[0].id;

    } catch (error) {
        console.error('Error creating snapshot in database:', error.message);
        throw error;
    }
};

const insertOrUpdateFiles = async (files, snapshotId) => {

    try {

        const filePromises = [];

        for (const file of files) {
            const fileQuery = `
                INSERT INTO files (filename, content_hash, snapshot_id, content, relative_path)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (filename, snapshot_id, relative_path) 
                DO UPDATE SET 
                    content_hash = EXCLUDED.content_hash, 
                    content = EXCLUDED.content
            `;
            filePromises.push(pool.query(fileQuery, [file.fileName, file.fileHash, snapshotId, file.content, file.relativePath]));
        }

        await Promise.all(filePromises);
    } catch (error) {
        console.error('Error inserting or updating files in database:', error.message);
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

        return result.rows;
    } catch (error) {
        console.error('Error listing snapshots from database:', error.message);
        throw error;
    }
};

module.exports = { getRecordedFiles, createSnapshot, insertOrUpdateFiles, listSnapshots };