const pool = require('../../config/databaseConfig');

// OPERATION: PRUNE
const pruneSnapshot = async (snapshotId) => {

    try {
        // check if snapshot exists in the snapshots database
        const snapshotQuery = `
            SELECT * FROM snapshots WHERE id = $1
        `;
        const snapshotResult = await pool.query(snapshotQuery, [snapshotId]);

        if (!snapshotResult.rows.length) {
            console.log(`No snapshot found with ID: ${snapshotId}`);
            return;
        }

        // delete the snapshot record
        const snapshotDeleteQuery = `DELETE FROM snapshots WHERE id = $1`;
        await pool.query(snapshotDeleteQuery, [snapshotId]);

        console.log(`Snapshot ${snapshotId} and its associated files have been pruned.`);

    } catch (error) {
        console.error('Error pruning snapshot:', error.message);
        throw error;
    }
};

// prune snapshots older than provided timestamp
const pruneSnapshotByTimestamp = async (timestamp) => {

    try {

        // delete  snapshots older than the provided timestamp
        const deleteSnapshotsQuery = `
            DELETE FROM snapshots WHERE timestamp < $1
        `;
        await pool.query(deleteSnapshotsQuery, [timestamp]);

        console.log(`Snapshots older than ${timestamp} have been pruned.`);

    } catch (error) {
        console.error('Error pruning snapshots by timestamp:', error.message);
        throw error;
    }
};


module.exports = { pruneSnapshot, pruneSnapshotByTimestamp };
