const { compareFiles } = require('../../src/utils/fileComparison');
const { getFilesInDirectory, hashFile } = require('../../src/utils/fileSystem');

jest.mock('../../src/utils/fileSystem', () => ({
    getFilesInDirectory: jest.fn(),
    hashFile: jest.fn(),
}));

describe('compareFiles', () => {
    const mockDirectory = '/mock/directory';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns empty file arrays when the specified directory is empty', async () => {
        getFilesInDirectory.mockResolvedValue([]); // Simulating an empty directory
        const recordedFiles = new Map();

        const result = await compareFiles(mockDirectory, recordedFiles);

        expect(result).toEqual({ newFiles: [], modifiedFiles: [] });
    });

    it('detects new files', async () => {
        getFilesInDirectory.mockResolvedValue([
            '/mock/directory/newFile.txt',
        ]);

        hashFile.mockResolvedValueOnce('hash123');

        const recordedFiles = new Map();

        const result = await compareFiles(mockDirectory, recordedFiles);

        expect(result).toEqual({
            newFiles: [
                { filePath: '/mock/directory/newFile.txt', fileName: 'newFile.txt', fileHash: 'hash123', relativePath: '' },
            ],
            modifiedFiles: [],
        });
    });

    it('detects modified files', async () => {
        getFilesInDirectory.mockResolvedValue([
            '/mock/directory/modifiedFile.txt',
        ]);

        hashFile.mockResolvedValueOnce('newHash');

        const recordedFiles = new Map([
            ['/modifiedFile.txt', 'oldHash']
        ]);

        const result = await compareFiles(mockDirectory, recordedFiles);

        expect(result).toEqual({
            newFiles: [],
            modifiedFiles: [
                { filePath: '/mock/directory/modifiedFile.txt', fileName: 'modifiedFile.txt', fileHash: 'newHash', relativePath: '' },
            ],
        });
    });

    it('handles case where input path is a file instead of a directory', async () => {
        getFilesInDirectory.mockRejectedValue(new Error('ENOTDIR: not a directory'));

        await expect(compareFiles('/mock/file.txt', new Map())).rejects.toThrow('ENOTDIR: not a directory');
    });

    it('handles errors', async () => {
        getFilesInDirectory.mockRejectedValue(new Error('Failed to read directory'));

        await expect(compareFiles(mockDirectory, new Map())).rejects.toThrow('Failed to read directory');
    });
});
