require('dotenv').config({path: '../.env'});
// console.log("Environment variables: ", process.env);

const { Pool } = require('pg');

// create connection pool to allow reuse of database connection
const pool = new Pool({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
});

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

// console.log('Database Config:', pool.options);
module.exports = { connectToDatabase, closeDatabaseConnection };