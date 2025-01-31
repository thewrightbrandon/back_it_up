const path = require('path');
const readline = require('readline');
const { takeIncrementalSnapshot, displaySnapshots } = require('./snapshotHandler');
const { restoreSnapshot } = require('./restoreHandler');
const { pruneSnapshot, pruneSnapshotByTimestamp } = require('./pruneHandler');
const { countFilesInDatabase } = require("../database/databaseQueries");

// provides a CLI interface, used to get user input
const readLine = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// default snapshot storage and restore locations for testing
const SNAPSHOT_DIRECTORY = path.resolve(__dirname, '../../test_data');
const RESTORE_DIRECTORY = path.resolve(__dirname, '../../restored_files');

const promptUser = () => {

    console.log(`
        |||| COMMAND LINE BACKUP TOOL ||||
        Available commands (command <argument>):
        ★ Generate Snapshot  → snapshot <directoryPath>
        ★ List Snapshots     → list
        ★ Restore Snapshot   → restore <snapshotId> <outputDirectory>
        ★ Prune Snapshot     → prune <snapshotId>
        ★ Prune Before Date  → prune-by-timestamp <YYYY-MM-DD HH:MM:SS>
        ★ Files in Database  → count
        ★ Exit               → exit
    `);

    readLine.question('Enter an available command: ', async (command) => {

        const commandArguments = command.split(' ');

        try {

            switch (commandArguments[0].toLowerCase()) {

                case 'snapshot':
                    let directoryPath;

                    if (commandArguments[1]) {
                        directoryPath = path.resolve(commandArguments[1]);
                    } else {
                        directoryPath = SNAPSHOT_DIRECTORY;
                    }

                    await takeIncrementalSnapshot(directoryPath);
                    break;

                case 'list':
                    await displaySnapshots();
                    break;

                case 'restore':
                    let outputDirectory;
                    const snapshotId = commandArguments[1];

                    if (commandArguments[2]) {
                        outputDirectory = path.resolve(commandArguments[2]);
                    } else {
                        outputDirectory = RESTORE_DIRECTORY;
                    }

                    if (snapshotId) {
                        await restoreSnapshot(snapshotId, outputDirectory);
                    } else {
                        console.log('Snapshot ID is required for directory restoration.');
                    }
                    break;

                case 'prune':
                    const snapshotToPruneId = commandArguments[1];

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
                    const dateObject = new Date(timestamp);

                    if (!timestamp || !dateRegex.test(timestamp)) {
                        console.log('Invalid timestamp format, please use: YYYY-MM-DD HH:MM:SS');
                        break;
                    }

                    if (isNaN(dateObject.getTime())) {
                        console.log('Invalid timestamp, please enter date-time using: YYYY-MM-DD HH:MM:SS');
                        break;
                    }

                    // format timestamp to match postgres format YYYY-MM-DD HH:MM:SS
                    const formattedTimestamp = dateObject.toISOString().slice(0, 19).replace('T', ' ');

                    await pruneSnapshotByTimestamp(formattedTimestamp);
                    break;

                case "count":
                    const fileCount = await countFilesInDatabase();
                    console.log(`Total files in database: ${fileCount}`);
                    break;

                case 'exit':
                    console.log('Have a nice day!');
                    readLine.close();
                    process.exit(0);
                    return;

                default:
                    console.log('Unknown command, please try again using one of the following commands:');
                    break;
            }
        } catch (error) {
            console.error(`Error executing command: ${error.message}`);
            throw error;
        }

        promptUser();
    });
};

module.exports = { promptUser };