const pool = require('../config/db');

class BusRepository {
    async getAll() {
        const result = await pool.query('SELECT * FROM buses ORDER BY id ASC');
        return result.rows;
    }

    async create(busData) {
        const {
            license_plate,
            brand,
            seat_capacity,
            type,
            seat_layout,
            amenities,
            images,
        } = busData;
        const query = `
            INSERT INTO buses (license_plate, brand, seat_capacity, type, seat_layout, amenities, images) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
        `;
        const result = await pool.query(query, [
            license_plate,
            brand,
            seat_capacity,
            type,
            seat_layout,
            JSON.stringify(amenities),
            JSON.stringify(images),
        ]);
        return result.rows[0];
    }

    async delete(id) {
        await pool.query('DELETE FROM buses WHERE id = $1', [id]);
    }

    async hasActiveTrips(busId) {
        const result = await pool.query(
            "SELECT 1 FROM trips WHERE bus_id = $1 AND status != 'CANCELLED' LIMIT 1",
            [busId],
        );
        return result.rows.length > 0;
    }
}

module.exports = new BusRepository();
