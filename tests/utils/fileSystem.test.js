const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createRestoreDirectoryIfNoneExist, hashFile, getFilesInDirectory, getFileStats, readFileContent } = require('../../src/utils/fileSystem');

jest.mock('fs');
jest.mock('crypto');

describe('fileSystem utility', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createRestoreDirectoryIfNoneExist', () => {
        it('should create the directory if one does not exist', () => {
            fs.existsSync.mockReturnValue(false);
            fs.mkdirSync.mockImplementation(() => {});

            createRestoreDirectoryIfNoneExist('/mock/path');

            expect(fs.existsSync).toHaveBeenCalledWith('/mock/path');
            expect(fs.mkdirSync).toHaveBeenCalledWith('/mock/path', { recursive: true });
        });

        it('should not create the directory if it already exists', () => {
            fs.existsSync.mockReturnValue(true);

            createRestoreDirectoryIfNoneExist('/mock/path');

            expect(fs.existsSync).toHaveBeenCalledWith('/mock/path');
            expect(fs.mkdirSync).not.toHaveBeenCalled();
        });
    });

    describe('hashFile', () => {
        it('should return a hash for file content', async () => {
            const mockHash = {
                update: jest.fn(),
                digest: jest.fn().mockReturnValue('mockedHash')
            };
            crypto.createHash.mockReturnValue(mockHash);

            const mockFileStream = {
                on: jest.fn((event, callback) => {
                    if (event === 'data') callback('fileDataChunk');
                    if (event === 'end') callback();
                })
            };
            fs.createReadStream.mockReturnValue(mockFileStream);

            process.env.HASH = 'sha256';
            const result = await hashFile('/mock/file.txt');

            expect(crypto.createHash).toHaveBeenCalledWith('sha256');
            expect(mockHash.update).toHaveBeenCalledWith('fileDataChunk');
            expect(mockHash.digest).toHaveBeenCalledWith('hex');
            expect(result).toBe('mockedHash');
        });

        it('should reject on file read error', async () => {
            fs.createReadStream.mockReturnValue({
                on: jest.fn((event, callback) => {
                    if (event === 'error') callback(new Error('File read error'));
                })
            });

            await expect(hashFile('/mock/file.txt')).rejects.toThrow('File read error');
        });
    });

    describe('getFilesInDirectory', () => {
        it('should return a list of files in a directory', async () => {
            fs.readdirSync.mockReturnValue(['file1.txt', 'file2.txt']);
            fs.statSync.mockImplementation((filePath) => ({
                isDirectory: () => false,
                isFile: () => true
            }));

            const result = await getFilesInDirectory('/mock/directory');

            expect(fs.readdirSync).toHaveBeenCalledWith('/mock/directory');
            expect(result).toEqual([
                path.normalize('/mock/directory/file1.txt'),
                path.normalize('/mock/directory/file2.txt')
            ]);
        });

        it('should correctly identify files and directories', async () => {
            const mockDirectory = '/test/mixed';
            const mockFiles = ['file1.txt', 'file2.txt'];
            const mockSubdirectory = 'subdirectory';
            const mockSubdirectoryFiles = ['file3.txt'];

            fs.readdirSync.mockImplementation((directory) => {
                if (directory === mockDirectory) {
                    return [...mockFiles, mockSubdirectory];
                }
                if (directory === path.join(mockDirectory, mockSubdirectory)) {
                    return mockSubdirectoryFiles;
                }
                return [];
            });

            fs.statSync.mockImplementation((filePath) => {

                if (filePath === path.join(mockDirectory, mockSubdirectory)) {
                    return { isDirectory: () => true, isFile: () => false };
                } else if (mockFiles.includes(path.basename(filePath))) {
                    return { isDirectory: () => false, isFile: () => true };
                } else if (mockSubdirectoryFiles.includes(path.basename(filePath))) {
                    return { isDirectory: () => false, isFile: () => true };
                }
                return { isDirectory: () => false, isFile: () => false };
            });

            const filePaths = await getFilesInDirectory(mockDirectory);

            expect(filePaths.map(p => path.normalize(p))).toEqual([
                path.normalize(path.join(mockDirectory, mockFiles[0])),
                path.normalize(path.join(mockDirectory, mockFiles[1])),
                path.normalize(path.join(mockDirectory, mockSubdirectory, mockSubdirectoryFiles[0]))
            ]);
        });

        it('should throw an error if the directory does not exist', async () => {
            fs.readdirSync.mockImplementation(() => {
                throw new Error('Directory not found');
            });

            await expect(getFilesInDirectory('/invalid/path')).rejects.toThrow('Directory not found');
        });
    });

    describe('getFileStats', () => {
        it('should return file stats for a given file', () => {
            const mockStats = { size: 1000, birthtime: new Date() };
            fs.statSync.mockReturnValue(mockStats);

            const result = getFileStats('/mock/file.txt');

            expect(fs.statSync).toHaveBeenCalledWith('/mock/file.txt');
            expect(result).toEqual(mockStats);
        });

        it('should throw an error if the file does not exist', () => {
            fs.statSync.mockImplementation(() => {
                throw new Error('File not found');
            });

            expect(() => getFileStats('/invalid/file.txt')).toThrow('File not found');
        });
    });

    describe('readFileContent', () => {
        it('should read and return file content', () => {
            const mockContent = Buffer.from('mocked content');
            fs.readFileSync.mockReturnValue(mockContent);

            const result = readFileContent('/mock/file.txt');

            expect(fs.readFileSync).toHaveBeenCalledWith('/mock/file.txt');
            expect(result).toBe(mockContent);
        });

        it('should throw an error if the file cannot be read', () => {
            fs.readFileSync.mockImplementation(() => {
                throw new Error('Read error');
            });

            expect(() => readFileContent('/invalid/file.txt')).toThrow('Read error');
        });
    });

});