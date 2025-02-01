const fs = require('fs');
const path = require('path');
const { createRestoreDirectoryIfNoneExist } = require('../utils/fileSystem')
const { pool } = require('../../config/databaseConfig');

const restoreSnapshot = async (snapshotId, outputDirectory) => {

    try {

        const fileQuery = `
            SELECT f.filename, f.relative_path, fc.content
            FROM files f
                     JOIN file_contents fc ON f.content_id = fc.id
                        WHERE f.snapshot_id = $1
        `;
        const result = await pool.query(fileQuery, [snapshotId]);

        if (!result.rows.length) {
            console.log(`No files found got snapshot ID: ${snapshotId}`);
            return;
        }

        createRestoreDirectoryIfNoneExist(outputDirectory);

        for (const file of result.rows) {
            const fileOutputPath = path.join(outputDirectory, file.relative_path, file.filename);
            const parentDirectory = path.dirname(fileOutputPath);

            if (!fs.existsSync(parentDirectory)) {
                fs.mkdirSync(parentDirectory, { recursive: true });
            }

            fs.writeFileSync(fileOutputPath, file.content);
        }

        console.log(`Snapshot ${snapshotId} restored to ${outputDirectory}`);

    } catch (error) {
        console.error('Error restoring snapshot:', error.message);
        throw error;
    }
};

module.exports = { restoreSnapshot };