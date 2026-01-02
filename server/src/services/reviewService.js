const reviewRepository = require('../repositories/reviewRepository');
const bookingRepository = require('../repositories/bookingRepository');

class ReviewService {
    async createReview(userId, data) {
        const { bookingId, rating, comment } = data;

        // validate bookingId
        if (!bookingId || isNaN(bookingId)) {
            throw new Error('bookingId không hợp lệ. Vui lòng chọn vé hợp lệ.');
        }

        // validate rating
        if (!rating || rating < 1 || rating > 5) {
            throw new Error('Số sao đánh giá phải từ 1 đến 5');
        }

        // check for valid booking - verify it belongs to the user and is paid
        const validBooking = await bookingRepository.findById(bookingId);
        console.log('Valid booking found:', validBooking);

        if (!validBooking || validBooking.user_id !== userId) {
            throw new Error('Không tìm thấy vé hoặc vé không thuộc về bạn.');
        }

        if (!['PAID', 'COMPLETED'].includes(validBooking.booking_status)) {
            throw new Error('Bạn cần thanh toán vé trước khi đánh giá.');
        }

        // check if the ticket has already been reviewed
        const existingReview = await reviewRepository.findByBookingId(bookingId);
        console.log('Existing review for booking ID', bookingId, ':', existingReview);

        if (existingReview) {
            throw new Error('Bạn đã đánh giá cho vé này rồi.');
        }

        // create review
        return await reviewRepository.create({
            userId,
            tripId: validBooking.trip_id,
            bookingId: parseInt(bookingId),
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