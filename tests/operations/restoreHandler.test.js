const fs = require('fs');
const path = require('path');
const { restoreSnapshot } = require('../../src/operations/restoreHandler');
const { createRestoreDirectoryIfNoneExist } = require('../../src/utils/fileSystem');
const { pool } = require('../../config/databaseConfig');

jest.mock('fs');
jest.mock('path');
jest.mock('../../src/utils/fileSystem');
jest.mock('../../config/databaseConfig');

describe('restoreSnapshot', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should restore a snapshot successfully', async () => {

        const mockSnapshotId = 1;
        const mockOutputDirectory = '/mock/output';
        const mockFiles = [
            {
                filename: 'file1.txt',
                relative_path: 'folder1',
                content: 'file1 content',
            },
            {
                filename: 'file2.txt',
                relative_path: 'folder2',
                content: 'file2 content',
            },
        ];

        pool.query.mockResolvedValue({ rows: mockFiles });
        createRestoreDirectoryIfNoneExist.mockImplementation(() => {});
        fs.existsSync.mockReturnValue(false);
        fs.mkdirSync.mockImplementation(() => {});
        fs.writeFileSync.mockImplementation(() => {});

        await restoreSnapshot(mockSnapshotId, mockOutputDirectory);

        expect(pool.query).toHaveBeenCalledWith(expect.any(String), [mockSnapshotId]);
        expect(createRestoreDirectoryIfNoneExist).toHaveBeenCalledWith(mockOutputDirectory);

        mockFiles.forEach((file) => {
            const fileOutputPath = path.join(mockOutputDirectory, file.relative_path, file.filename);
            const parentDirectory = path.dirname(fileOutputPath);

            expect(fs.existsSync).toHaveBeenCalledWith(parentDirectory);
            expect(fs.mkdirSync).toHaveBeenCalledWith(parentDirectory, { recursive: true });
            expect(fs.writeFileSync).toHaveBeenCalledWith(fileOutputPath, file.content);
        });

        console.log(`Snapshot ${mockSnapshotId} restored to ${mockOutputDirectory}`);
    });

    it('should handle a non-existent snapshot', async () => {

        const mockSnapshotId = 999;
        const mockOutputDirectory = '/mock/output';

        pool.query.mockResolvedValue({ rows: [] });

        await restoreSnapshot(mockSnapshotId, mockOutputDirectory);

        expect(pool.query).toHaveBeenCalledWith(expect.any(String), [mockSnapshotId]);
        expect(createRestoreDirectoryIfNoneExist).not.toHaveBeenCalled();
        expect(fs.existsSync).not.toHaveBeenCalled();
        expect(fs.mkdirSync).not.toHaveBeenCalled();
        expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should handle errors during snapshot restoration', async () => {

        const mockSnapshotId = 1;
        const mockOutputDirectory = '/mock/output';
        const mockError = new Error('Database error');

        pool.query.mockRejectedValue(mockError);

        await expect(restoreSnapshot(mockSnapshotId, mockOutputDirectory)).rejects.toThrow(
            'Database error'
        );

        expect(pool.query).toHaveBeenCalledWith(expect.any(String), [mockSnapshotId]);
        expect(createRestoreDirectoryIfNoneExist).not.toHaveBeenCalled();
        expect(fs.existsSync).not.toHaveBeenCalled();
        expect(fs.mkdirSync).not.toHaveBeenCalled();
        expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
});