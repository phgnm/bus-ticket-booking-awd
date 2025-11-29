// server/src/config/db.js

const { Pool } = require('pg');
require('dotenv').config();

const connectionString =
    process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error(
        'Database connection URL is missing. Check LOCAL_DATABASE_URL or DATABASE_URL in .env',
    );
}

const isLocal =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');

const sslConfig = isLocal ? false : { rejectUnauthorized: false };

const pool = new Pool({
    connectionString: connectionString,
    ssl: sslConfig,
});

module.exports = pool;
