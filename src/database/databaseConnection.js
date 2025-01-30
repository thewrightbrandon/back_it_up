const { pool } = require('../../config/databaseConfig');

// method to establish postgres database connection
const connectToDatabase = async () => {
    try {
        console.log("Attempting to connect to the database...");
        await pool.connect();
        console.log(`Successfully connected to the "${pool.options.database}" database!`);
    } catch (error) {
        console.error(`Error connecting to database.`, error);
    }
}

module.exports = { connectToDatabase };