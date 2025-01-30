const { pool } = require('../../config/databaseConfig');
// console.log(pool)

// method to establish postgres database connection
const connectToDatabase = async () => {
    try {
        await pool.connect();
        console.log(`Successfully connected to the "${pool.options.database}" database!`);
    } catch (error) {
        console.error(`Error connecting to the "${pool.options.database}" database. |`, error);
    }
}

// method to end database connection
const closeDatabaseConnection = async () => {
    try {
        // close the pool, ending all idle connections
        await pool.end();
        console.log('Database connection pool has been closed successfully.');
    } catch (error) {
        console.error('Error closing the database connection pool:', error);
    }
};

module.exports = { connectToDatabase, closeDatabaseConnection };