const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:@BusTicket123@localhost:5432/bus_ticket_dev',
});

module.exports = pool;