const { pool } = require('../../config/databaseConfig');

const getRecordedFiles = async () => {

    try {

        const allFilesQuery = `
            SELECT f.filename, fc.content_hash, f.relative_path
                FROM files f
                     JOIN file_contents fc ON f.content_id = fc.id
        `;
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
            let contentId;

            const existingContentQuery = `
                SELECT id FROM file_contents WHERE content_hash = $1
            `;
            const existingContentResult = await pool.query(existingContentQuery, [file.fileHash]);

            if (existingContentResult.rows.length > 0) {
                contentId = existingContentResult.rows[0].id;
            } else {
                if (file.content) {
                    const insertContentQuery = `
                        INSERT INTO file_contents (content_hash, content)
                            VALUES ($1, $2)
                                ON CONFLICT (content_hash) DO NOTHING
                                    RETURNING id
                    `;
                    const contentResult = await pool.query(insertContentQuery, [file.fileHash, file.content]);

                    if (contentResult.rows.length > 0) {
                        contentId = contentResult.rows[0].id;
                    } else {
                        contentId = existingContentResult.rows[0].id;
                    }
                } else {
                    contentId = existingContentResult.rows[0].id;
                }
            }

            const fileQuery = `
                INSERT INTO files (filename, content_id, snapshot_id, relative_path)
                    VALUES ($1, $2, $3, $4)
                        ON CONFLICT (filename, snapshot_id, relative_path)
                            DO UPDATE SET content_id = EXCLUDED.content_id
            `;
            filePromises.push(pool.query(fileQuery, [file.fileName, contentId, snapshotId, file.relativePath]));
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