const path = require('path');
const readline = require('readline');
const { takeSnapshot, listSnapshots } = require('./snapshotHandler');  // Snapshot logic
const { restoreSnapshot } = require('./restoreHandler');  // Restore logic
const { pruneSnapshot, pruneSnapshotByTimestamp } = require('./pruneHandler');  // Prune logic
const { closeDatabaseConnection } = require('../database/index');  // Database closing logic

// provides a CLI interface, used to get user input
const readLine = readline.createInterface({
    // takes input from CLI
    input: process.stdin,
    // returns output to console
    output: process.stdout
});

// absolute paths for default snapshot storage and restore locations
const SNAPSHOT_DIRECTORY = path.resolve(__dirname, '../../test_data');
const RESTORE_DIRECTORY = path.resolve(__dirname, '../../restored_files');

// displays available commands and handles user input
const promptUser = () => {
    console.log(`
    |||| COMMAND LINE BACKUP TOOL ||||
    Available commands after arrow in quotes:
    1. Generate Snapshot  -> "snapshot <directoryPath>"
    2. List Snapshots     -> "list"
    3. Restore Snapshot   -> "restore <snapshotId> <outputDirectory>"
    4. Prune Snapshot     -> "prune <snapshotId>"
    5. Prune by Timestamp -> "pruneByTimestamp <YYYY-MM-DD HH:MM:SS>"
    6. Exit               -> "exit"
    `);

    readLine.question('Enter an available command: ', async (command) => {
        // converts user input command string into an array of arguments
        const commandArguments = command.split(' ');

        try {
            // handle different commands and case sensitivity
            switch (commandArguments[0].toLowerCase()) {

                case 'snapshot':
                    let directoryPath;

                    if (commandArguments[1]) {
                        // if user input contains path to a directory use specified directory
                        directoryPath = path.resolve(commandArguments[1]);
                    } else {
                        // if user input does not contain path, use default
                        directoryPath = SNAPSHOT_DIRECTORY;
                    }

                    await takeSnapshot(directoryPath);
                    break;

                case 'list':
                    await listSnapshots();
                    break;

                case 'restore':
                    let outputDirectory;
                    const snapshotId = commandArguments[1];

                    if (commandArguments[2]) {
                        // if user input contains path to an output directory use specified directory
                        outputDirectory = path.resolve(commandArguments[2]);
                    } else {
                        // if user input does not contain path, use default
                        outputDirectory = RESTORE_DIRECTORY;
                    }
                    // check to make sure snapshotId was included in user input command
                    if (snapshotId) {
                        await restoreSnapshot(snapshotId, outputDirectory);
                    } else {
                        console.log('Snapshot ID is required for directory restoration.');
                    }
                    break;

                case 'prune':
                    const snapshotToPruneId = commandArguments[1];
                    // check to make sure snapshotId was included in user input command
                    if (snapshotToPruneId) {
                        await pruneSnapshot(snapshotToPruneId);
                    } else {
                        console.log('Snapshot ID is required to prune a Snapshot.');
                    }
                    break;

                case 'pruneByTimestamp':
                    const timestamp = commandArguments[1];
                    const dateRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
                    // will create a Date object if timestamp format is correct
                    const dateObject = new Date(timestamp);
                    // checks to make sure timestamp is there and in correct format, test() method provided by regex
                    if (!timestamp || !dateRegex.test(timestamp)) {
                        console.log('Invalid timestamp format, please use: YYYY-MM-DD HH:MM:SS');
                        break;
                    }
                    // checks to make sure timestamp corresponds to a valid date-time
                    // if timestamp was incorrectly formatted getTime() will return NaN
                    if (isNaN(dateObject.getTime())) {
                        console.log('Invalid timestamp, please enter date-time using: YYYY-MM-DD HH:MM:SS');
                        break;
                    }

                    await pruneSnapshotByTimestamp(timestamp);
                    break;

                case 'exit':
                    console.log('Have a nice day!');
                    // close database connection
                    await closeDatabaseConnection();
                    // close readline interface
                    readLine.close();
                    // terminate any running processes
                    process.exit(0);
                    // exit command prompt
                    return;

                default:
                    console.log('Unknown command, please try again using one of the following commands:');
                    promptUser();
                    break;
            }
        } catch (error) {
            console.error(`Error executing command: ${error.message}`);
            throw error;
        }

        // continue to prompt user after handling command, exit command will shut down prompt
        promptUser();
    });
};

module.exports = { promptUser };