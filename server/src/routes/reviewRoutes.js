const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateJWT } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Reviews
 *     description: Quản lý đánh giá & bình luận
 */

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Gửi đánh giá (Chỉ User đã đặt vé PAID mới được gửi)
 *     tags:
 *       - Reviews
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tripId
 *               - rating
 *             properties:
 *               tripId:
 *                 type: integer
 *               rating:
 *                 type: integer
 *                 description: Số sao (1-5)
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Đánh giá thành công
 *       400:
 *         description: Chưa mua vé hoặc đã đánh giá rồi
 */
router.post('/', authenticateJWT, reviewController.createReview);

/**
 * @swagger
 * /api/reviews/trip/{tripId}:
 *   get:
 *     summary: Xem danh sách đánh giá của chuyến xe
 *     tags:
 *       - Reviews
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Trả về stats (điểm trung bình) và danh sách reviews
 */
router.get('/trip/:tripId', reviewController.getReviewsByTrip);

module.exports = router;