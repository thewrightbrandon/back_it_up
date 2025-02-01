const { readFileContent, directoryExists } = require('../utils/fileSystem')
const { compareFiles } = require('../utils/fileComparison');
const { getRecordedFiles, createSnapshot, insertOrUpdateFiles, listSnapshots } = require('../database/snapshotQueries');

const takeIncrementalSnapshot = async (directoryPath) => {

    try {

        console.log("Preparing file snapshot...");

        if (!(directoryExists(directoryPath))) {
            console.error(`Error: Directory not found - ${directoryPath}`);
            return;
        }

        const recordedFiles = await getRecordedFiles();
        const { allFiles, newFiles, modifiedFiles } = await compareFiles(directoryPath, recordedFiles);

        if (!allFiles.length) {
            console.log("Snapshot not recorded. No files detected in the specified directory.");
            return;
        }

        const filesToProcess = [...newFiles, ...modifiedFiles];

        if (!filesToProcess.length) {
            console.log("Snapshot not recorded. No new or modified files detected.");
            return;
        }

        const validFiles = [];
        for (const file of filesToProcess) {
            try {
                file.content = await readFileContent(file.filePath);
                validFiles.push(file);
            } catch (error) {
                // isolate bad file, continue looping through rest of files
                console.error(`Error reading file content: ${file.filePath}`, error.message);
                continue;
            }
        }

        if (validFiles.length) {
            const snapshotId = await createSnapshot();
            await insertOrUpdateFiles(validFiles, snapshotId);
            console.log(`Total files recorded: ${validFiles.length}`);
            console.log(`Snapshot successfully created with ID: ${snapshotId}`);
        } else {
            console.log("No valid files to add to the database.");
        }

    } catch (error) {
        console.error('Error creating incremental snapshot:', error.message);
        throw error;
    }
};

const displaySnapshots = async () => {

    try {

        const snapshots = await listSnapshots();

        if (!snapshots.length) {
            console.log('No snapshots found.');
            return;
        }

        console.log('SNAPSHOT | TIMESTAMP');
        for (const snapshot of snapshots) {
            console.log(`${snapshot.id} | ${snapshot.formatted_timestamp}`);
        }

    } catch (error) {
        console.error('Error listing snapshots:', error.message);
        throw error;
    }
};

module.exports = { takeIncrementalSnapshot, displaySnapshots };