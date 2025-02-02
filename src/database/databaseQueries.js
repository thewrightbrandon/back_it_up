const { pool } = require('../../config/databaseConfig');

const countFilesInDatabase = async () => {
    try {
        const countQuery = "SELECT COUNT(*) FROM file_contents;";
        const result = await pool.query(countQuery);
        return result.rows[0].count;
    } catch (error) {
        console.error("Error counting files:", error.message);
        throw error;
    }
};

module.exports = { countFilesInDatabase };