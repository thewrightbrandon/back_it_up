const path = require('path');
const readline = require('readline');
const { takeIncrementalSnapshot, listSnapshots } = require('./snapshotHandler');
const { restoreSnapshot } = require('./restoreHandler');
const { pruneSnapshot, pruneSnapshotByTimestamp } = require('./pruneHandler');
const { countFilesInDatabase } = require("../database/databaseQuery");

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
    Available commands inside quotes ("command <argument>"):
    ★ Generate Snapshot  → "snapshot <directoryPath>"
    ★ List Snapshots     → "list"
    ★ Restore Snapshot   → "restore <snapshotId> <outputDirectory>"
    ★ Prune Snapshot     → "prune <snapshotId>"
    ★ Prune by Timestamp → "prune-by-timestamp <YYYY-MM-DD HH:MM:SS>"
    ★ Files in Database  → "count"
    ★ Exit               → "exit"
    `);

    readLine.question('Enter an available command: ', async (command) => {
        // converts user input command string into an array of arguments
        const commandArguments = command.split(' ');

        // console.log("Command entered:", commandArguments);

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

                    await takeIncrementalSnapshot(directoryPath);
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

                case 'prune-by-timestamp':
                    // rejoin timestamp format to follow YYYY-MM-DD HH:MM:SS
                    const timestamp = [commandArguments[1], commandArguments[2]].join(' ');
                    // regex to ensure timestamp format follows YYYY-MM-DD HH:MM:SS
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

                    // format timestamp to match postgres format YYYY-MM-DD HH:MM:SS
                    // toISOString() gives us something like 2025-01-29T23:15:33.000Z
                    // the slice() method then trims off the milliseconds and timezone
                    // ISO format uses a T in white space, so the replace() method is replaced by a space
                    const formattedTimestamp = dateObject.toISOString().slice(0, 19).replace('T', ' ');

                    // console.log("Formatted timestamp:", formattedTimestamp);

                    // formattedTimestamp now matches the timestamp format in postgres db
                    await pruneSnapshotByTimestamp(formattedTimestamp);
                    break;

                case "count":
                    const fileCount = await countFilesInDatabase();
                    console.log(`Total files in database: ${fileCount}`);
                    break;

                case 'exit':
                    console.log('Have a nice day!');
                    // close readline interface
                    readLine.close();
                    // terminate any running processes
                    process.exit(0);
                    // exit command prompt
                    return;

                default:
                    console.log('Unknown command, please try again using one of the following commands:');
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