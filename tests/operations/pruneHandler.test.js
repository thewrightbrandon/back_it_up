const { pruneSnapshot, pruneSnapshotByTimestamp } = require('../../src/operations/pruneHandler');
const { pool } = require('../../config/databaseConfig');

jest.mock('../../config/databaseConfig');

describe('pruneSnapshot', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should prune a snapshot when it exists', async () => {

        const mockSnapshotId = 1;
        const mockSnapshotResult = { rows: [{ id: mockSnapshotId }] };

        pool.query.mockResolvedValueOnce(mockSnapshotResult);
        pool.query.mockResolvedValueOnce({});

        await pruneSnapshot(mockSnapshotId);

        expect(pool.query).toHaveBeenNthCalledWith(
            1,
            `
                SELECT * FROM snapshots WHERE id = $1
            `.trim(),
            [mockSnapshotId]
        );

        expect(pool.query).toHaveBeenNthCalledWith(
            2,
            `
                DELETE FROM snapshots WHERE id = $1
            `.trim(),
            [mockSnapshotId]
        );
    });

    it('should not prune a snapshot when it does not exist', async () => {

        const mockSnapshotId = 99999999999;
        const mockSnapshotResult = { rows: [] };

        pool.query.mockResolvedValue(mockSnapshotResult);

        await pruneSnapshot(mockSnapshotId);

        expect(pool.query).toHaveBeenNthCalledWith(
            1,
            `
                SELECT * FROM snapshots WHERE id = $1
            `.trim(),
            [mockSnapshotId]
        );

        expect(pool.query).not.toHaveBeenCalledWith(
            `
                DELETE FROM snapshots WHERE id = $1
            `.trim(),
            [mockSnapshotId]
        );
    });

    it('should handle errors during snapshot pruning', async () => {

        const mockSnapshotId = 1;
        const mockError = new Error('Database error');

        pool.query.mockRejectedValue(mockError);

        await expect(pruneSnapshot(mockSnapshotId)).rejects.toThrow('Database error');

        expect(pool.query).toHaveBeenNthCalledWith(
            1,
            `
                SELECT * FROM snapshots WHERE id = $1
            `.trim(),
            [mockSnapshotId]
        );
    });
});

describe('pruneSnapshotByTimestamp', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should prune snapshots older than the specified timestamp', async () => {

        const mockTimestamp = '2023-10-01 12:00:00';

        pool.query.mockResolvedValue({});

        await pruneSnapshotByTimestamp(mockTimestamp);

        expect(pool.query).toHaveBeenCalledWith(
            `
                DELETE FROM snapshots WHERE timestamp < $1
            `.trim(),
            [mockTimestamp]
        );
    });

    it('should handle errors during pruning by timestamp', async () => {

        const mockTimestamp = '2023-10-01 12:00:00';
        const mockError = new Error('Database error');

        pool.query.mockRejectedValue(mockError);

        await expect(pruneSnapshotByTimestamp(mockTimestamp)).rejects.toThrow('Database error');

        expect(pool.query).toHaveBeenCalledWith(
            `
                DELETE FROM snapshots WHERE timestamp < $1
            `.trim(),
            [mockTimestamp]
        );
    });
});