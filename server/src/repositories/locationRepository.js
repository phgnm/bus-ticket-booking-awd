const pool = require('../config/db');

class LocationRepository {
    async findAll(keyword) {
        let query = 'SELECT * FROM locations';
        const params = [];

        if (keyword) {
            query += ' WHERE name ILIKE $1';
            params.push(`%${keyword}%`);
        }

        query += ' ORDER BY name ASC';

        const result = await pool.query(query, params);
        return result.rows;
    }
}

module.exports = new LocationRepository();
