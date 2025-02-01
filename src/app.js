const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { connectToDatabase } = require('./database/databaseConnection');
const { promptUser } = require('./operations/promptHandler');

const start = async () => {

    try {

        await connectToDatabase();
        promptUser();

    } catch (error) {
        console.error('Error connecting to database:', error.message);
        process.exit(1);
        throw error;
    }
};
// initialize the command line backup tool
start();