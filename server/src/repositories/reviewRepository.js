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
}

module.exports = new ReviewRepository();