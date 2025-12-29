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

    async create(data) {
        const { name, type, thumbnail } = data;
        const result = await pool.query(
            'INSERT INTO locations (name, type, thumbnail) VALUES ($1, $2, $3) RETURNING *',
            [name, type, thumbnail]
        );
        return result.rows[0];
    }

    async update(id, data) {
        const { name, type, thumbnail } = data;
        const result = await pool.query(
            'UPDATE locations SET name = $1, type = $2, thumbnail = $3 WHERE id = $4 RETURNING *',
            [name, type, thumbnail, id]
        );
        return result.rows[0];
    }

    async delete(id) {
        await pool.query('DELETE FROM locations WHERE id = $1', [id]);
        return true;
    }
}

module.exports = new LocationRepository();
