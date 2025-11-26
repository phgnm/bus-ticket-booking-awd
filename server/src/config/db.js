const { Pool } = require('pg');
require('dotenv').config();

const useSSL = !!process.env.DATABASE_URL;

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: connectionString,
    ssl: useSSL ? { rejectUnauthorized: false } : false,
});

module.exports = pool;