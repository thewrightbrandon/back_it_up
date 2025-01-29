// require('dotenv').config({path: '../.env'});
const { Pool } = require('pg');

// create connection pool to allows reuse of database connection
const pool = new Pool({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
});

// console.log('Database Config:', pool.options);

module.exports = pool;