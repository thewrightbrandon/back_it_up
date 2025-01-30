const { Pool } = require('pg');

// create connection pool to allow reuse of database connection
const pool = new Pool({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 5000,
});

// console.log('Database config ', pool);
module.exports =  { pool };