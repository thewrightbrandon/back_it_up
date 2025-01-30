const { pool } = require('../../config/databaseConfig');

// method to count files in the database
const countFilesInDatabase = async () => {
    try {
        const countQuery = "SELECT COUNT(*) FROM files;";
        const result = await pool.query(countQuery);
        return result.rows[0].count;
    } catch (error) {
        console.error("Error counting files:", error.message);
        throw error;
    }
};

module.exports = { countFilesInDatabase };