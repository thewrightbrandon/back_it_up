const path = require('path');
const { hashFile, getFilesInDirectory } = require('./fileSystem');

const compareFiles = async (directoryPath, recordedFiles) => {

    try {

        const currentFiles = await getFilesInDirectory(directoryPath);
        console.log(`Files found in specified directory: ${currentFiles.length}`);

        if (!currentFiles.length) {
            console.log("Snapshot not recorded. The specified directory is empty.");
            // method won't return undefined if specified directory is empty
            return { allFiles: [], newFiles: [], modifiedFiles: [] };
        }

        const allFiles = [];
        const newFiles = [];
        const modifiedFiles = [];

        for (const filePath of currentFiles) {
            const relativePath = path.relative(directoryPath, path.dirname(filePath));
            const fileName = path.basename(filePath);
            const fileHash = await hashFile(filePath);

            const file = { filePath, fileName, fileHash, relativePath };
            allFiles.push(file);

            const fileKey = `${relativePath}/${fileName}`;

            if (!recordedFiles.has(fileKey)) {
                newFiles.push(file);
            } else if (recordedFiles.get(fileKey) !== fileHash) {
                modifiedFiles.push(file);
            }
        }

        console.log(`New files found: ${newFiles.length}`)
        console.log(`Modified files found: ${modifiedFiles.length}`);
        return { allFiles, newFiles, modifiedFiles };
    } catch (error) {
        console.error('Error comparing files:', error.message);
        throw error;
    }
};

module.exports = { compareFiles };