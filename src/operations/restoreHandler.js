const fs = require('fs');
const path = require('path');
const { createRestoreDirectoryIfNoneExist } = require('../utils/fileSystem')
const { pool } = require('../../config/databaseConfig');

const restoreSnapshot = async (snapshotId, outputDirectory) => {

    try {

        const fileQuery = `
            SELECT filename, content FROM files WHERE snapshot_id = $1
        `;
        const result = await pool.query(fileQuery, [snapshotId]);

        if (!result.rows.length) {
            console.log(`No snapshot found with ID: ${snapshotId}`);
            return;
        }

        createRestoreDirectoryIfNoneExist(outputDirectory);

        for (const file of result.rows) {
            const filePath = path.join(outputDirectory, file.filename);
            fs.writeFileSync(filePath, file.content);
        }

        console.log(`Snapshot ${snapshotId} restored to ${outputDirectory}`);

    } catch (error) {
        console.error('Error restoring snapshot:', error.message);
        throw error;
    }
};

module.exports = { restoreSnapshot };