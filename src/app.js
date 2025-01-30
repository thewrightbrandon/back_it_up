const path = require('path');
// make sure environment variables are properly loaded in no matter where we run the program from in the file structure
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
// console.log(process.env.DATABASE_PASSWORD);

// main entry point for the CLI backup tool
const { connectToDatabase } = require('./database/databaseConnection');
const { promptUser } = require('./operations/promptHandler');

const start = async () => {
    try {
        // entry point into the database, make sure there is a connection before continuing
        await connectToDatabase();
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