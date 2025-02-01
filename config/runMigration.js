require('dotenv').config();
const { dbConfig } = require('./databaseConfig');

module.exports = {
    ...dbConfig,
    migrationsTable: 'pgmigrations',
    dir: '../migrations',
    direction: 'up'
};