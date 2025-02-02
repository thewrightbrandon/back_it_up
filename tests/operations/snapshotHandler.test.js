const { takeIncrementalSnapshot, displaySnapshots } = require('../../src/operations/snapshotHandler');
const { readFileContent, directoryExists } = require('../../src/utils/fileSystem');
const { compareFiles } = require('../../src/utils/fileComparison');
const { getRecordedFiles, createSnapshot, insertOrUpdateFiles, listSnapshots } = require('../../src/database/snapshotQueries');

jest.mock('../../src/utils/fileSystem');
jest.mock('../../src/utils/fileComparison');
jest.mock('../../src/database/snapshotQueries');

describe('takeIncrementalSnapshot', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a snapshot when new or modified files are detected', async () => {
        const mockDirectoryPath = '/mock/directory';
        const mockRecordedFiles = new Map([
            ['/mock/directory/file1.txt', 'oldHash'],
        ]);
        const mockNewFiles = [
            { filePath: '/mock/directory/file2.txt', fileName: 'file2.txt', fileHash: 'newHash', relativePath: '' },
        ];
        const mockModifiedFiles = [
            { filePath: '/mock/directory/file1.txt', fileName: 'file1.txt', fileHash: 'updatedHash', relativePath: '' },
        ];
        const mockAllFiles = [...mockNewFiles, ...mockModifiedFiles];
        const mockSnapshotId = 1;

        directoryExists.mockReturnValue(true);
        getRecordedFiles.mockResolvedValue(mockRecordedFiles);
        compareFiles.mockResolvedValue({ allFiles: mockAllFiles, newFiles: mockNewFiles, modifiedFiles: mockModifiedFiles });
        createSnapshot.mockResolvedValue(mockSnapshotId);
        readFileContent.mockImplementation((filePath) => {
            const file = mockAllFiles.find(f => f.filePath === filePath);
            return file ? file.content : null;
        });
        insertOrUpdateFiles.mockResolvedValue();

        await takeIncrementalSnapshot(mockDirectoryPath);

        expect(directoryExists).toHaveBeenCalledWith(mockDirectoryPath);
        expect(getRecordedFiles).toHaveBeenCalled();
        expect(compareFiles).toHaveBeenCalledWith(mockDirectoryPath, mockRecordedFiles);
        expect(createSnapshot).toHaveBeenCalled();
        expect(readFileContent).toHaveBeenCalledTimes(2);
        expect(insertOrUpdateFiles).toHaveBeenCalledWith(mockAllFiles, mockSnapshotId);
    });

    it('should not create a snapshot if no new or modified files are detected', async () => {
        const mockDirectoryPath = '/mock/directory';
        const mockRecordedFiles = new Map([
            ['/mock/directory/file1.txt', 'oldHash'],
        ]);
        const mockAllFiles = [
            { filePath: '/mock/directory/file1.txt', fileName: 'file1.txt', fileHash: 'oldHash', relativePath: '' },
        ];

        getRecordedFiles.mockResolvedValue(mockRecordedFiles);
        compareFiles.mockResolvedValue({ allFiles: mockAllFiles, newFiles: [], modifiedFiles: [] });

        await takeIncrementalSnapshot(mockDirectoryPath);

        expect(getRecordedFiles).toHaveBeenCalled();
        expect(compareFiles).toHaveBeenCalledWith(mockDirectoryPath, mockRecordedFiles);
        expect(createSnapshot).not.toHaveBeenCalled();
        expect(insertOrUpdateFiles).not.toHaveBeenCalled();
    });

    it('should handle errors when reading file content and only insert valid files', async () => {
        const mockDirectoryPath = '/mock/directory';
        const mockRecordedFiles = new Map([
            ['/mock/directory/file1.txt', 'oldHash'],
        ]);
        const mockNewFiles = [
            { filePath: '/mock/directory/file2.txt', fileName: 'file2.txt', fileHash: 'newHash', relativePath: '' },
            { filePath: '/mock/directory/file3.txt', fileName: 'file3.txt', fileHash: 'errorHash', relativePath: '' },
        ];
        const mockAllFiles = [...mockNewFiles];
        const mockSnapshotId = 1;

        getRecordedFiles.mockResolvedValue(mockRecordedFiles);
        compareFiles.mockResolvedValue({ allFiles: mockAllFiles, newFiles: mockNewFiles, modifiedFiles: [] });
        createSnapshot.mockResolvedValue(mockSnapshotId);
        readFileContent.mockImplementation((filePath) => {
            if (filePath === '/mock/directory/file3.txt') {
                throw new Error('File read error');
            }
            return 'new content';
        });
        insertOrUpdateFiles.mockResolvedValue();

        await takeIncrementalSnapshot(mockDirectoryPath);

        expect(getRecordedFiles).toHaveBeenCalled();
        expect(compareFiles).toHaveBeenCalledWith(mockDirectoryPath, mockRecordedFiles);
        expect(createSnapshot).toHaveBeenCalled();
        expect(readFileContent).toHaveBeenCalledTimes(2);
        expect(insertOrUpdateFiles).toHaveBeenCalledWith(
            [{ filePath: '/mock/directory/file2.txt', fileName: 'file2.txt', fileHash: 'newHash', relativePath: '', content: 'new content' }],
            mockSnapshotId
        );
    });

    it('should handle errors during snapshot creation', async () => {
        const mockDirectoryPath = '/mock/directory';
        const mockRecordedFiles = new Map([
            ['/mock/directory/file1.txt', 'oldHash'],
        ]);
        const mockNewFiles = [
            { filePath: '/mock/directory/file2.txt', fileName: 'file2.txt', fileHash: 'newHash', relativePath: '' },
        ];
        const mockAllFiles = [...mockNewFiles];

        getRecordedFiles.mockResolvedValue(mockRecordedFiles);
        compareFiles.mockResolvedValue({ allFiles: mockAllFiles, newFiles: mockNewFiles, modifiedFiles: [] });
        createSnapshot.mockRejectedValue(new Error('Snapshot creation failed'));

        await expect(takeIncrementalSnapshot(mockDirectoryPath)).rejects.toThrow('Snapshot creation failed');

        expect(getRecordedFiles).toHaveBeenCalled();
        expect(compareFiles).toHaveBeenCalledWith(mockDirectoryPath, mockRecordedFiles);
        expect(createSnapshot).toHaveBeenCalled();
        expect(insertOrUpdateFiles).not.toHaveBeenCalled();
    });
});

describe('displaySnapshots', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should display snapshots when they exist', async () => {
        const mockSnapshots = [
            { id: 1, formatted_timestamp: '2023-10-01 12:00:00' },
            { id: 2, formatted_timestamp: '2023-10-02 12:00:00' },
        ];

        listSnapshots.mockResolvedValue(mockSnapshots);

        await displaySnapshots();

        expect(listSnapshots).toHaveBeenCalled();
    });

    it('should handle no snapshots found', async () => {
        const mockSnapshots = [];

        listSnapshots.mockResolvedValue(mockSnapshots);

        await displaySnapshots();

        expect(listSnapshots).toHaveBeenCalled();
    });

    it('should handle errors when listing snapshots', async () => {
        listSnapshots.mockRejectedValue(new Error('Database error'));

        await expect(displaySnapshots()).rejects.toThrow('Database error');

        expect(listSnapshots).toHaveBeenCalled();
    });
});