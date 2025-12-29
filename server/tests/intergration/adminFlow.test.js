const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/config/db');
const jwt = require('jsonwebtoken');

describe('Comprehensive Admin & Review Flow', () => {
    let userToken, adminToken, userId, adminId, tripId, bookingId, reviewId;
    const PASSWORD_HASH = '$2a$10$8.UnVuG9HHgffUDAlk8qfOu5HEpA1E/v5i.tS7J8o.vL.C3W6O61G'; // password123

    beforeAll(async () => {
        // 1. Dọn rác
        await pool.query("DELETE FROM users WHERE email IN ('test_user@flow.com', 'test_admin@flow.com')");

        // 2. Tạo User & Admin
        const userRes = await pool.query(
            "INSERT INTO users (email, password_hash, full_name, role, is_verified) VALUES ($1, $2, $3, $4, true) RETURNING id",
            ['test_user@flow.com', PASSWORD_HASH, 'Test User', 'user']
        );
        userId = userRes.rows[0].id;

        const adminRes = await pool.query(
            "INSERT INTO users (email, password_hash, full_name, role, is_verified) VALUES ($1, $2, $3, $4, true) RETURNING id",
            ['test_admin@flow.com', PASSWORD_HASH, 'Test Admin', 'admin']
        );
        adminId = adminRes.rows[0].id;

        // Sign Token
        userToken = jwt.sign({ id: userId, role: 'user' }, process.env.JWT_ACCESS_SECRET);
        adminToken = jwt.sign({ id: adminId, role: 'admin' }, process.env.JWT_ACCESS_SECRET);

        // 3. Chuẩn bị Trip & Booking PAID
        const tripRes = await pool.query("SELECT id FROM trips LIMIT 1");
        tripId = tripRes.rows[0].id;

        const bookingRes = await pool.query(`
            INSERT INTO bookings (trip_id, user_id, passenger_name, passenger_phone, seat_number, total_price, booking_code, contact_email, booking_status)
            VALUES ($1, $2, 'Flow Test', '0123456789', 'A99', 100000, 'FLOW123', 'test_user@flow.com', 'PAID')
            RETURNING id
        `, [tripId, userId]);
        bookingId = bookingRes.rows[0].id;
    });

    afterAll(async () => {
        await pool.query("DELETE FROM reviews WHERE booking_id = $1", [bookingId]);
        await pool.query("DELETE FROM bookings WHERE id = $1", [bookingId]);
        await pool.query("DELETE FROM users WHERE id IN ($1, $2)", [userId, adminId]);
        await pool.end();
    });

    // --- TEST CASE 1: USER REVIEW ---
    describe('User Review API', () => {
        it('Nên cho phép user có vé PAID gửi review', async () => {
            const res = await request(app)
                .post('/api/reviews')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    tripId: tripId,
                    rating: 5,
                    comment: "Chuyến đi tuyệt vời, tài xế lái êm!"
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            reviewId = res.body.data.id;
        });

        it('Nên chặn user review lại lần 2 trên cùng 1 chuyến/vé', async () => {
            const res = await request(app)
                .post('/api/reviews')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ tripId, rating: 1, comment: "Spam" });

            expect(res.statusCode).toBe(400);
            expect(res.body.msg).toContain('đã đánh giá');
        });
    });

    // --- TEST CASE 2: ADMIN STATS ---
    describe('Admin Dashboard Statistics', () => {
        it('Dashboard nên hiển thị Average Rating và Total Reviews', async () => {
            const res = await request(app)
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({ startDate: '2020-01-01', endDate: '2030-12-31' }); // Range rộng để cover data test

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toHaveProperty('averageRating');
            expect(res.body.data).toHaveProperty('totalReviews');
            // Vì ta vừa insert 1 review 5 sao ở test trước
            expect(parseFloat(res.body.data.averageRating)).toBeGreaterThan(0);
        });

        it('Dashboard KHÔNG nên có trường activeBuses (đã xóa)', async () => {
            const res = await request(app)
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`);
            
            expect(res.body.data.activeBuses).toBeUndefined();
        });
    });

    // --- TEST CASE 3: ADMIN REVIEW MANAGEMENT ---
    describe('Admin Review Management', () => {
        it('Admin có thể xem danh sách review toàn hệ thống', async () => {
            const res = await request(app)
                .get('/api/admin/reviews')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            // Kiểm tra xem có review "Chuyến đi tuyệt vời" không
            const found = res.body.data.find(r => r.id === reviewId);
            expect(found).toBeDefined();
        });

        it('Admin có thể xóa review vi phạm', async () => {
            const res = await request(app)
                .delete(`/api/admin/reviews/${reviewId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.msg).toContain('thành công');

            // Kiểm tra DB xem mất chưa
            const check = await pool.query("SELECT * FROM reviews WHERE id = $1", [reviewId]);
            expect(check.rows.length).toBe(0);
        });
    });
});