const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const createRestoreDirectoryIfNoneExist = (directoryPath) => {
    // create an output directory if one does not already exist
    if (!fs.existsSync(directoryPath)) {
        // creates directory and makes sure nested directories are restored as well
        fs.mkdirSync(directoryPath, { recursive: true })
        console.log(`Directory created: ${directoryPath}`);
    }
}

const hashFile = (filePath) => {
    return new Promise((resolve, reject) => {
        try {
            // console.log('Hash algo from environment variables:', process.env.HASH)
            // hash algorithm pulled from environment variables
            const hash = crypto.createHash(process.env.HASH);
            const fileStream = fs.createReadStream(filePath);

            // hash in chunks
            fileStream.on('data', (chunk) => {
                hash.update(chunk);
            });

            fileStream.on('end', () => {
                const fileHash = hash.digest('hex');
                // console.log(`File hash: ${fileHash}`);
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

// fetching all files from specified directory & subdirectories
const getFilesInDirectory = async (directoryPath) => {
    let filingCabinet = [];

    try {
        // read contents of specified directory
        const files = fs.readdirSync(directoryPath);

        for (const file of files) {
            // combine directoryPath and filename to form the full file path
            const filePath = path.join(directoryPath, file);
            // check if we are reading a file, directory, or something else
            const stat = fs.statSync(filePath);

            // if what is read is a nested directory we will recursively get those files as well
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

// method checks to be sure we are dealing with a file and nothing else
const getFileStats = (filePath) => {

    try {
        // returns a stat object containing information about the file @ filePath
        return fs.statSync(filePath);

    } catch (error) {
        console.error(`Error fetching stats for file: ${filePath}`, error.message);
        throw error;
    }
};

// read a file's content and return the file content as a Buffer (raw binary)
const readFileContent = (filePath) => {

    try {
        // reads the file at the provided filePath and returns the contents of the file
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