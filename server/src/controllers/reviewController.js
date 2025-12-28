const reviewService = require('../services/reviewService');

exports.createReview = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('Review request body:', req.body);
        console.log('User ID:', userId);

        const review = await reviewService.createReview(userId, req.body);

        res.status(201).json({
            success: true,
            msg: 'Cảm ơn bạn đã đánh giá!',
            data: review
        });
    } catch (err) {
        console.error('Review creation error:', err);
        res.status(400).json({
            success: false,
            msg: err.message
        });
    }
};

exports.getReviewsByTrip = async (req, res) => {
    try {
        const { tripId } = req.params;
        const data = await reviewService.getReviewsByTrip(tripId);

        res.json({
            success: true,
            data: data
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Lỗi server' });
    }
};