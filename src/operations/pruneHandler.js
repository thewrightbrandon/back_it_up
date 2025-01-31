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

        console.log(`Snapshot ${snapshotId} and its associated files have been pruned.`);
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

        console.log(`Snapshots older than ${timestamp} have been pruned.`);
    } catch (error) {
        console.error('Error pruning snapshots by timestamp:', error.message);
        throw error;
    }
};

module.exports = { pruneSnapshot, pruneSnapshotByTimestamp };