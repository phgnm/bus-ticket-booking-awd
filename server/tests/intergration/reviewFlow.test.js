const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/config/db');
// Nếu bạn có redisClient, hãy import để đóng nó sau khi test
const redisClient = require('../../src/config/redis'); 

describe('Review Flow Integration Test', () => {
    let userId;
    let token;
    let tripId;
    let bookingId;

    beforeAll(async () => {
        // 1. Dọn dẹp rác cũ
        await pool.query("DELETE FROM users WHERE email = 'review_test@test.com'");

        // 2. Tạo User & Token
        const userRes = await pool.query(
            "INSERT INTO users (email, password_hash, full_name, is_verified) VALUES ('review_test@test.com', 'hash', 'Reviewer', true) RETURNING id"
        );
        userId = userRes.rows[0].id;
        
        const jwt = require('jsonwebtoken');
        token = jwt.sign({ id: userId, role: 'user' }, process.env.JWT_ACCESS_SECRET);

        // 3. Lấy 1 chuyến xe và tạo 1 vé đã thanh toán (PAID)
        const tripRes = await pool.query("SELECT id FROM trips LIMIT 1");
        if (tripRes.rows.length === 0) throw new Error("Database chưa có Trip nào để test!");
        tripId = tripRes.rows[0].id;

        const bookingRes = await pool.query(`
            INSERT INTO bookings (
                trip_id, 
                user_id, 
                seat_number, 
                booking_status, 
                total_price, 
                booking_code, 
                contact_email,
                passenger_name,
                passenger_phone
            )
            VALUES ($1, $2, 99, 'PAID', 100000, 'TEST_REV_123', 'review_test@test.com', 'Test Passenger', '0123456789') 
            RETURNING id
        `, [tripId, userId]);

        bookingId = bookingRes.rows[0].id;
    });

    afterAll(async () => {
        // Dọn dẹp dữ liệu test
        await pool.query("DELETE FROM reviews WHERE booking_id = $1", [bookingId]);
        await pool.query("DELETE FROM bookings WHERE id = $1", [bookingId]);
        await pool.query("DELETE FROM users WHERE id = $1", [userId]);
        
        // Đóng các kết nối để Jest thoát sạch
        await pool.end();
        if (redisClient && redisClient.quit) {
            await redisClient.quit();
        }
    });

    it('Nên cho phép người dùng đã đi xe gửi đánh giá', async () => {
        const res = await request(app)
            .post('/api/reviews')
            .set('Authorization', `Bearer ${token}`)
            .send({
                tripId: tripId,
                rating: 5,
                comment: "Chuyến đi tuyệt vời!"
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
    });

    it('Nên chặn đánh giá lần thứ 2 trên cùng một vé', async () => {
        const res = await request(app)
            .post('/api/reviews')
            .set('Authorization', `Bearer ${token}`)
            .send({
                tripId: tripId,
                rating: 1,
                comment: "Spam review"
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.msg).toContain('đã đánh giá');
    });
});