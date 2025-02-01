const path = require('path');
const { hashFile, getFilesInDirectory } = require('./fileSystem');

const compareFiles = async (directoryPath, recordedFiles) => {

    try {

        const currentFiles = await getFilesInDirectory(directoryPath);
        console.log(`Files found in specified directory: ${currentFiles.length}`);

        if (!currentFiles.length) {
            console.log("Snapshot not recorded. The specified directory is empty.");
            // method won't return undefined if specified directory is empty
            return { newFiles: [], modifiedFiles: [] };
        }

        const newFiles = [];
        const modifiedFiles = [];

        for (const filePath of currentFiles) {
            const relativePath = path.relative(directoryPath, path.dirname(filePath));
            const fileName = path.basename(filePath);
            const fileHash = await hashFile(filePath);

            const fileKey = `${relativePath}/${fileName}`;

            if (!recordedFiles.has(fileKey)) {
                newFiles.push({ filePath, fileName, fileHash, relativePath });
            } else if (recordedFiles.get(fileKey) !== fileHash) {
                modifiedFiles.push({ filePath, fileName, fileHash, relativePath });
            }
        }

        console.log(`New files found: ${newFiles.length}`)
        console.log(`Modified files found: ${modifiedFiles.length}`);
        return { newFiles, modifiedFiles };
    } catch (error) {
        console.error('Error comparing files:', error.message);
        throw error;
    }
};

module.exports = { compareFiles };