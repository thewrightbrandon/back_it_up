// establish connection to postgres database
require('dotenv').config({path: '../../.env'});

const pool = require('../../config/databaseConfig');
// console.log('Database Config', pool);

// method to establish a database connection
const connectToDatabase = async () => {
    try {
        await pool.connect();
        console.log(`Successfully connected to the "${pool.options.database}" database!`);
    } catch (error) {
        console.error(`Error connecting to the "${pool.options.database}" database. |`, error);
    }
}

// method to end the pool
const closeDatabaseConnection = async () => {
    try {
        // close the pool, ending all idle connections
        await pool.end();
        console.log('Database connection pool has been closed successfully.');
    } catch (error) {
        console.error('Error closing the database connection pool:', error);
    }
};

const startDatabaseConnection = connectToDatabase();
const endDatabaseConnection = closeDatabaseConnection();

module.exports = { startDatabaseConnection, endDatabaseConnection };