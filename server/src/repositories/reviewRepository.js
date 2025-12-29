const pool = require('../config/db');

class ReviewRepository {
    // create a new review
    async create(reviewData) {
        const { userId, tripId, bookingId, rating, comment } = reviewData;
        const query = `
            INSERT INTO reviews (user_id, trip_id, booking_id, rating, comment)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const result = await pool.query(query, [userId, tripId, bookingId, rating, comment]);
        return result.rows[0];
    }

    // take all reviews of a trip by tripId
    async findByTripId(tripId) {
        const query = `
            SELECT r.*, u.full_name, u.email
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.trip_id = $1
            ORDER BY r.created_at DESC
        `;
        const result = await pool.query(query, [tripId]);
        return result.rows;
    }

    // check if user has reviewed this booking
    async findByBookingId(bookingId) {
        const query = `SELECT * FROM reviews WHERE booking_id = $1`;
        const result = await pool.query(query, [bookingId]);
        return result.rows[0];
    }

    // get trip average rating
    async getAverageRating(tripId) {
        const query = `
            SELECT AVG(rating) as avg_rating, COUNT(id) as total_reviews
            FROM reviews
            WHERE trip_id = $1
        `;
        const result = await pool.query(query, [tripId]);
        return result.rows[0];
    }

    // find all for admin review
    async findAll({ rating, trip_id, limit = 20, offset = 0 }) {
        let query = `
            SELECT r.*, u.full_name as user_name, u.email as user_email,
                   lf.name as from_loc, lt.name as to_loc, t.departure_time
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            JOIN trips t ON r.trip_id = t.id
            JOIN routes rt ON t.route_id = rt.id
            JOIN locations lf ON rt.route_from = lf.id
            JOIN locations lt ON rt.route_to = lt.id
            WHERE 1=1
        `;
        const params = [];

        if (rating) {
            params.push(rating);
            query += ` AND r.rating = $${params.length}`;
        }
        if (trip_id) {
            params.push(trip_id);
            query += ` AND r.trip_id = $${params.length}`;
        }

        query += ` ORDER BY r.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        return result.rows;
    }

    // delete a review by id
    async delete(id) {
        return await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
    }
}

module.exports = new ReviewRepository();