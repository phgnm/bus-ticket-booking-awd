const reviewRepository = require('../repositories/reviewRepository');
const bookingRepository = require('../repositories/bookingRepository');

class ReviewService {
    async createReview(userId, data) {
        const { tripId, rating, comment } = data;

        // validate input
        if (!rating || rating < 1 || rating > 5) {
            throw new Error('Số sao đánh giá phải từ 1 đến 5');
        }

        // check for valid booking
        const validBooking = await bookingRepository.findVerifiedBooking(userId, tripId);

        if (!validBooking) {
            throw new Error('Bạn cần mua vé và thanh toán chuyến này trước khi đánh giá.');
        }

        // check if the ticket has already been reviewed
        const existingReview = await reviewRepository.findByBookingId(validBooking.id);
        if (existingReview) {
            throw new Error('Bạn đã đánh giá cho chuyến đi này rồi.');
        }

        // create review
        return await reviewRepository.create({
            userId,
            tripId,
            bookingId: validBooking.id,
            rating,
            comment
        });
    }

    async getReviewsByTrip(tripId) {
        const reviews = await reviewRepository.findByTripId(tripId);
        const stats = await reviewRepository.getAverageRating(tripId);
        
        return {
            stats: {
                average: parseFloat(stats.avg_rating || 0).toFixed(1),
                total: parseInt(stats.total_reviews || 0)
            },
            reviews
        };
    }
}

module.exports = new ReviewService();