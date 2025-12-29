const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

/**
 * @swagger
 * tags:
 *   - name: AI
 *     description: API Chatbot hỗ trợ tìm kiếm chuyến xe thông minh (Google Gemini)
 */

/**
 * @swagger
 * /ai/chat:
 *   post:
 *     summary: Chat với trợ lý ảo
 *     description: >
 *       Gửi tin nhắn để tìm kiếm chuyến xe hoặc hỏi đáp.
 *       AI sẽ tự động phân tích và tìm dữ liệu trong DB nếu cần.
 *     tags:
 *       - AI
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messages
 *             properties:
 *               messages:
 *                 type: array
 *                 description: Lịch sử đoạn chat (để AI hiểu ngữ cảnh)
 *                 items:
 *                   type: object
 *                   required:
 *                     - role
 *                     - content
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant]
 *                       description: Vai trò (user là khách, assistant là AI)
 *                     content:
 *                       type: string
 *                       description: Nội dung tin nhắn
 *             example:
 *               messages:
 *                 - role: user
 *                   content: "Tìm xe từ Sài Gòn đi Đà Lạt ngày mai"
 *     responses:
 *       200:
 *         description: Trả lời thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 reply:
 *                   type: string
 *                   description: Câu trả lời của AI
 *                   example: "Mình tìm thấy 3 chuyến xe đi Đà Lạt vào ngày mai. Chuyến sớm nhất của nhà xe Phương Trang khởi hành lúc 08:00..."
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       500:
 *         description: Lỗi Server hoặc lỗi kết nối AI
 */
router.post('/chat', aiController.chat);

module.exports = router;