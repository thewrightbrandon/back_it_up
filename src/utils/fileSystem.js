const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const createRestoreDirectoryIfNoneExist = (directoryPath) => {
    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true })
        console.log(`Directory created: ${directoryPath}`);
    }
}

const hashFile = (filePath) => {
    return new Promise((resolve, reject) => {

        try {

            const hash = crypto.createHash(process.env.HASH);
            const fileStream = fs.createReadStream(filePath);

            fileStream.on('data', (chunk) => {
                hash.update(chunk);
            });

            fileStream.on('end', () => {
                const fileHash = hash.digest('hex');
                resolve(fileHash);
            });

            fileStream.on('error', (error) => {
                reject(error);
            });

        } catch (error) {
            console.error(`Error hashing file: ${filePath}`, error.message);
            reject(error);
        }
    })
};

const getFilesInDirectory = async (directoryPath) => {
    let filingCabinet = [];

    try {

        const files = fs.readdirSync(directoryPath);

        for (const file of files) {
            const filePath = path.join(directoryPath, file);
            const stat = fs.statSync(filePath);

            // recursively fetch files from subdirectories
            if (stat.isDirectory()) {
                // recursive call on nested directory
                const nestedFiles = await getFilesInDirectory(filePath);
                // console.log("Nested files array: ", nestedFiles);
                // add files from nested directory to the existing array of files
                filingCabinet = [...filingCabinet, ...nestedFiles];
            } else if (stat.isFile()) {
                // if what is read is a file then add it to the list
                filingCabinet.push(filePath);
            }
        }

    } catch (error) {
        console.error(`Error reading directory: ${directoryPath}`, error.message);
        throw error;
    }

    return filingCabinet;
};


const getFileStats = (filePath) => {

    try {

        return fs.statSync(filePath);

    } catch (error) {
        console.error(`Error fetching stats for file: ${filePath}`, error.message);
        throw error;
    }
};


const readFileContent = (filePath) => {

    try {

        return fs.readFileSync(filePath);

    } catch (error) {
        console.error(`Error reading file content: ${filePath}`, error.message);
        throw error;
    }
};

module.exports = {
    createRestoreDirectoryIfNoneExist,
    hashFile,
    getFilesInDirectory,
    getFileStats,
    readFileContent
};