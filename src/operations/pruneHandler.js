const { pool } = require('../../config/databaseConfig');

const pruneSnapshot = async (snapshotId) => {

    try {

        const numericSnapshotId = parseInt(snapshotId, 10);
        if (isNaN(numericSnapshotId)) {
            console.error(`Invalid snapshot ID - "${snapshotId}." Use command 'list' to view valid numeric IDs.`);
            return;
        }

        const snapshotQuery = `
            SELECT * FROM snapshots WHERE id = $1
        `.trim();
        const snapshotResult = await pool.query(snapshotQuery, [snapshotId]);

        if (!snapshotResult.rows.length) {
            console.log(`No snapshot found with ID: ${snapshotId}`);
            return;
        }

        const snapshotDeleteQuery = `
            DELETE FROM snapshots WHERE id = $1
        `.trim();
        await pool.query(snapshotDeleteQuery, [snapshotId]);

        const pruneFilesQuery = `
            DELETE FROM files WHERE snapshot_id = $1
        `.trim();
        await pool.query(pruneFilesQuery, [snapshotId]);

        const pruneFileContentsQuery = `
            DELETE FROM file_contents
            WHERE id IN (
                SELECT fc.id FROM file_contents fc
                LEFT JOIN files f ON fc.id = f.content_id
                WHERE f.content_id IS NULL
            )
        `.trim();
        await pool.query(pruneFileContentsQuery);

        console.log(`Snapshot ${snapshotId} has been pruned.`);
    } catch (error) {
        console.error('Error pruning snapshot:', error.message);
        throw error;
    }
};

const pruneSnapshotByTimestamp = async (timestamp) => {

    try {

        const deleteSnapshotsQuery = `
            DELETE FROM snapshots WHERE timestamp < $1
        `.trim();
        await pool.query(deleteSnapshotsQuery, [timestamp]);

        const pruneFilesQuery = `
            DELETE FROM files WHERE snapshot_id NOT IN (SELECT id FROM snapshots)
        `.trim();
        await pool.query(pruneFilesQuery);

        const pruneFileContentsQuery = `
            DELETE FROM file_contents
            WHERE id IN (
                SELECT fc.id FROM file_contents fc
                LEFT JOIN files f ON fc.id = f.content_id
                WHERE f.content_id IS NULL
            )
        `.trim();
        await pool.query(pruneFileContentsQuery);

        console.log(`Snapshots older than ${timestamp} have been pruned.`);
    } catch (error) {
        console.error('Error pruning snapshots by timestamp:', error.message);
        throw error;
    }
};

module.exports = { pruneSnapshot, pruneSnapshotByTimestamp };