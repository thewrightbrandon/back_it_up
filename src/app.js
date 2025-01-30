// main entry point for the CLI backup tool
const { connectToDatabase } = require('config/databaseConfig');
const { promptUser } = require('./operations/promptHandler');

const start = async () => {
    try {
        // entry point into the database, make sure there is a connection before continuing
        await connectToDatabase();
        console.log('Successfully connected to database.');
        // start the command line interface and take user input
        promptUser();
    } catch (error) {
        console.error('Error connecting to database:', error.message);
        // exit process if the database fails to connect
        process.exit(1);
        throw error;
    }
};
// initialize the command line backup tool
start();
