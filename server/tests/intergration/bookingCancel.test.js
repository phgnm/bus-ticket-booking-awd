const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/config/db');
const emailService = require('../../src/utils/emailService');

jest.mock('../../src/utils/emailService', () => ({
    sendCancellationEmail: jest.fn().mockResolvedValue(true),
    sendTicketEmail: jest.fn().mockResolvedValue(true)
}));

describe('Booking Cancellation Flow', () => {
    let userToken;
    let userId;
    let otherUserToken;
    let tripIdFuture;
    let tripIdNear;

    beforeAll(async () => {
        // --- BƯỚC QUAN TRỌNG: XÓA DỮ LIỆU CŨ TRƯỚC KHI TẠO MỚI ---
        // Giúp tránh lỗi "Duplicate Key" nếu lần chạy trước bị crash
        await pool.query("DELETE FROM bookings WHERE contact_email = 'cancel_test@test.com'");
        // Xóa user theo email để đảm bảo sạch sẽ
        await pool.query("DELETE FROM users WHERE email IN ('cancel_test@test.com', 'other@test.com')");
        // -----------------------------------------------------------

        // 1. Tạo User chính
        const userRes = await pool.query(
            "INSERT INTO users (email, password_hash, full_name, is_verified) VALUES ('cancel_test@test.com', 'hash', 'Test Canceller', true) RETURNING id"
        );
        userId = userRes.rows[0].id;
        
        const jwt = require('jsonwebtoken');
        userToken = jwt.sign({ id: userId, role: 'user' }, process.env.JWT_ACCESS_SECRET);

        // 2. Tạo User thứ 2 (Kẻ phá bĩnh)
        const otherUserRes = await pool.query("INSERT INTO users (email, full_name) VALUES ('other@test.com', 'Hacker') RETURNING id");
        otherUserToken = jwt.sign({ id: otherUserRes.rows[0].id, role: 'user' }, process.env.JWT_ACCESS_SECRET);

        // 3. Tạo Route & Bus
        const routeRes = await pool.query("INSERT INTO routes (price_base) VALUES (100000) RETURNING id");
        
        // (Đã fix lỗi license_plate ở đây)
        const busRes = await pool.query(
            "INSERT INTO buses (license_plate, seat_capacity, brand, type) VALUES ($1, $2, $3, $4) RETURNING id",
            ['59Z-TEST-CANCEL', 40, 'Test Bus Cancel', 'SLEEPER'] 
        );

        // 4. Tạo Trip
        const futureRes = await pool.query(
            "INSERT INTO trips (route_id, bus_id, departure_time, status) VALUES ($1, $2, NOW() + INTERVAL '2 days', 'SCHEDULED') RETURNING id",
            [routeRes.rows[0].id, busRes.rows[0].id]
        );
        tripIdFuture = futureRes.rows[0].id;

        const nearRes = await pool.query(
            "INSERT INTO trips (route_id, bus_id, departure_time, status) VALUES ($1, $2, NOW() + INTERVAL '1 hour', 'SCHEDULED') RETURNING id",
            [routeRes.rows[0].id, busRes.rows[0].id]
        );
        tripIdNear = nearRes.rows[0].id;
    });

    afterAll(async () => {
        // Dọn dẹp sạch sẽ
        await pool.query("DELETE FROM bookings WHERE contact_email = 'cancel_test@test.com'");
        
        if (tripIdFuture && tripIdNear) {
            await pool.query("DELETE FROM trips WHERE id IN ($1, $2)", [tripIdFuture, tripIdNear]);
        }
        
        // Xóa cả 2 user test
        await pool.query("DELETE FROM users WHERE email IN ('cancel_test@test.com', 'other@test.com')");
        
        // Xóa Bus & Route test (dọn cho sạch DB)
        await pool.query("DELETE FROM buses WHERE license_plate = '59Z-TEST-CANCEL'");
        
        await pool.end();
    });

    // ... (Giữ nguyên các test case it('...') như cũ) ...
    it('Should cancel a PAID booking (>24h) and trigger REFUND email', async () => {
        const bookingRes = await pool.query(`
            INSERT INTO bookings (trip_id, user_id, seat_number, booking_status, total_price, booking_code, contact_email)
            VALUES ($1, $2, 1, 'PAID', 100000, 'TEST_REFUND', 'cancel_test@test.com') RETURNING id
        `, [tripIdFuture, userId]);
        const bookingId = bookingRes.rows[0].id;

        const res = await request(app)
            .post(`/api/bookings/cancel/${bookingId}`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.msg).toContain('Tiền đang được hoàn lại');
        
        const checkDb = await pool.query("SELECT booking_status FROM bookings WHERE id = $1", [bookingId]);
        expect(checkDb.rows[0].booking_status).toBe('REFUNDED');
        expect(emailService.sendCancellationEmail).toHaveBeenCalled();
    });

    it('Should FAIL to cancel booking if departure is < 24h', async () => {
        const bookingRes = await pool.query(`
            INSERT INTO bookings (trip_id, user_id, seat_number, booking_status, total_price, booking_code, contact_email)
            VALUES ($1, $2, 2, 'PAID', 100000, 'TEST_LATE', 'cancel_test@test.com') RETURNING id
        `, [tripIdNear, userId]);
        const bookingId = bookingRes.rows[0].id;

        const res = await request(app)
            .post(`/api/bookings/cancel/${bookingId}`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.statusCode).toBe(400);
        expect(res.body.msg).toContain('trước giờ khởi hành 24 tiếng');
    });

    it('Should FAIL if another user tries to cancel my booking', async () => {
        const bookingRes = await pool.query(`
            INSERT INTO bookings (trip_id, user_id, seat_number, booking_status, total_price, booking_code, contact_email)
            VALUES ($1, $2, 3, 'PAID', 100000, 'TEST_OWNER', 'cancel_test@test.com') RETURNING id
        `, [tripIdFuture, userId]);
        const bookingId = bookingRes.rows[0].id;

        const res = await request(app)
            .post(`/api/bookings/cancel/${bookingId}`)
            .set('Authorization', `Bearer ${otherUserToken}`);

        expect(res.statusCode).toBe(400);
        expect(res.body.msg).toContain('không có quyền');
    });
});