const reviewRepository = require('../repositories/reviewRepository');
const bookingRepository = require('../repositories/bookingRepository');

class ReviewService {
    async createReview(userId, data) {
        const { tripId, rating, comment } = data;

        // validate tripId
        if (!tripId || isNaN(tripId)) {
            throw new Error('tripId không hợp lệ. Vui lòng chọn chuyến đi hợp lệ.');
        }

        // validate rating
        if (!rating || rating < 1 || rating > 5) {
            throw new Error('Số sao đánh giá phải từ 1 đến 5');
        }

        // check for valid booking
        const validBooking = await bookingRepository.findVerifiedBooking(userId, tripId);
        console.log('Valid booking found:', validBooking);

        if (!validBooking) {
            throw new Error('Bạn cần mua vé và thanh toán chuyến này trước khi đánh giá.');
        }

        // check if the ticket has already been reviewed
        const existingReview = await reviewRepository.findByBookingId(validBooking.id);
        console.log('Existing review for booking ID', validBooking.id, ':', existingReview);

        if (existingReview) {
            throw new Error('Bạn đã đánh giá cho chuyến đi này rồi.');
        }

        // create review
        return await reviewRepository.create({
            userId,
            tripId: parseInt(tripId),
            bookingId: validBooking.id,
            rating: parseInt(rating),
            comment: comment || null
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