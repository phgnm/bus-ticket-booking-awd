const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/config/db');
const emailService = require('../../src/utils/emailService');

jest.mock('../../src/utils/emailService', () => ({
    sendCancellationEmail: jest.fn().mockResolvedValue(true),
    sendTicketEmail: jest.fn().mockResolvedValue(true)
}));

describe('Booking Management (History & Cancel)', () => {
    let userToken;
    let userId;
    let otherUserToken;
    let tripIdFuture;
    let tripIdNear;
    let tripIdPast;

    beforeAll(async () => {
        // --- CLEANUP ---
        await pool.query("DELETE FROM bookings WHERE contact_email = 'cancel_test@test.com'");
        await pool.query("DELETE FROM users WHERE email IN ('cancel_test@test.com', 'other@test.com')");

        // 1. Create Main User
        const userRes = await pool.query(
            "INSERT INTO users (email, password_hash, full_name, is_verified) VALUES ('cancel_test@test.com', 'hash', 'Test Canceller', true) RETURNING id"
        );
        userId = userRes.rows[0].id;
        
        const jwt = require('jsonwebtoken');
        userToken = jwt.sign({ id: userId, role: 'user' }, process.env.JWT_ACCESS_SECRET);

        // 2. Create Second User (Hacker/Other)
        const otherUserRes = await pool.query("INSERT INTO users (email, full_name) VALUES ('other@test.com', 'Hacker') RETURNING id");
        otherUserToken = jwt.sign({ id: otherUserRes.rows[0].id, role: 'user' }, process.env.JWT_ACCESS_SECRET);

        // 3. Create Route & Bus
        const routeRes = await pool.query("INSERT INTO routes (price_base) VALUES (100000) RETURNING id");
        
        const busRes = await pool.query(
            "INSERT INTO buses (license_plate, seat_capacity, brand, type) VALUES ($1, $2, $3, $4) RETURNING id",
            ['59Z-TEST-CANCEL', 40, 'Test Bus Cancel', 'SLEEPER'] 
        );

        // 4. Create Trips
        // Future Trip (> 24h)
        const futureRes = await pool.query(
            "INSERT INTO trips (route_id, bus_id, departure_time, status) VALUES ($1, $2, NOW() + INTERVAL '3 days', 'SCHEDULED') RETURNING id",
            [routeRes.rows[0].id, busRes.rows[0].id]
        );
        tripIdFuture = futureRes.rows[0].id;

        // Near Trip (< 24h)
        const nearRes = await pool.query(
            "INSERT INTO trips (route_id, bus_id, departure_time, status) VALUES ($1, $2, NOW() + INTERVAL '1 hour', 'SCHEDULED') RETURNING id",
            [routeRes.rows[0].id, busRes.rows[0].id]
        );
        tripIdNear = nearRes.rows[0].id;

        // Past Trip (Completed)
        const pastRes = await pool.query(
            "INSERT INTO trips (route_id, bus_id, departure_time, status) VALUES ($1, $2, NOW() - INTERVAL '2 days', 'COMPLETED') RETURNING id",
            [routeRes.rows[0].id, busRes.rows[0].id]
        );
        tripIdPast = pastRes.rows[0].id;
    });

    afterAll(async () => {
        await pool.query("DELETE FROM bookings WHERE contact_email = 'cancel_test@test.com'");
        if (tripIdFuture && tripIdNear && tripIdPast) {
            await pool.query("DELETE FROM trips WHERE id IN ($1, $2, $3)", [tripIdFuture, tripIdNear, tripIdPast]);
        }
        await pool.query("DELETE FROM users WHERE email IN ('cancel_test@test.com', 'other@test.com')");
        await pool.query("DELETE FROM buses WHERE license_plate = '59Z-TEST-CANCEL'");
        await pool.end();
    });

    describe('Booking Cancellation', () => {
        it('Should cancel a PAID booking (>24h) and trigger REFUND email', async () => {
            const bookingRes = await pool.query(`
                INSERT INTO bookings (trip_id, user_id, seat_number, passenger_name, passenger_phone, booking_status, total_price, booking_code, contact_email)
                VALUES ($1, $2, 'A1', 'Test Name', '0909000000', 'PAID', 100000, 'TEST_REFUND', 'cancel_test@test.com') RETURNING id
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
            expect(emailService.sendCancellationEmail).toHaveBeenCalledWith(
                'cancel_test@test.com',
                'TEST_REFUND',
                expect.stringMatching(/90\./) // Check for formatted number roughly or non-null
            );
        });

        it('Should cancel a PENDING_PAYMENT booking (>24h) without refund', async () => {
             const bookingRes = await pool.query(`
                INSERT INTO bookings (trip_id, user_id, seat_number, passenger_name, passenger_phone, booking_status, total_price, booking_code, contact_email)
                VALUES ($1, $2, 'A2', 'Test Name', '0909000000', 'PENDING_PAYMENT', 100000, 'TEST_PENDING', 'cancel_test@test.com') RETURNING id
            `, [tripIdFuture, userId]);
            const bookingId = bookingRes.rows[0].id;

            const res = await request(app)
                .post(`/api/bookings/cancel/${bookingId}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.msg).not.toContain('Tiền đang được hoàn lại');
            expect(res.body.msg).toContain('Hủy vé thành công');

            const checkDb = await pool.query("SELECT booking_status FROM bookings WHERE id = $1", [bookingId]);
            expect(checkDb.rows[0].booking_status).toBe('CANCELLED');
        });

        it('Should FAIL to cancel booking if departure is < 24h', async () => {
            const bookingRes = await pool.query(`
                INSERT INTO bookings (trip_id, user_id, seat_number, passenger_name, passenger_phone, booking_status, total_price, booking_code, contact_email, created_at)
                VALUES ($1, $2, 'B1', 'Test Name', '0909000000', 'PAID', 100000, 'TEST_LATE', 'cancel_test@test.com', NOW()) RETURNING id
            `, [tripIdNear, userId]);
            // Note: Join with trips to get departure time is handled by controller query
            const bookingId = bookingRes.rows[0].id;

            const res = await request(app)
                .post(`/api/bookings/cancel/${bookingId}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(400);
            expect(res.body.msg).toContain('trước giờ khởi hành 24 tiếng');
        });

        it('Should FAIL if another user tries to cancel my booking', async () => {
            const bookingRes = await pool.query(`
                INSERT INTO bookings (trip_id, user_id, seat_number, passenger_name, passenger_phone, booking_status, total_price, booking_code, contact_email)
                VALUES ($1, $2, 'C1', 'Test Name', '0909000000', 'PAID', 100000, 'TEST_OWNER', 'cancel_test@test.com') RETURNING id
            `, [tripIdFuture, userId]);
            const bookingId = bookingRes.rows[0].id;

            const res = await request(app)
                .post(`/api/bookings/cancel/${bookingId}`)
                .set('Authorization', `Bearer ${otherUserToken}`);

            expect(res.statusCode).toBe(400);
            expect(res.body.msg).toContain('Bạn không thể hủy vé này');
        });

        it('Should FAIL to cancel an already CANCELLED booking', async () => {
             const bookingRes = await pool.query(`
                INSERT INTO bookings (trip_id, user_id, seat_number, passenger_name, passenger_phone, booking_status, total_price, booking_code, contact_email)
                VALUES ($1, $2, 'D1', 'Test Name', '0909000000', 'CANCELLED', 100000, 'TEST_ALREADY', 'cancel_test@test.com') RETURNING id
            `, [tripIdFuture, userId]);
            const bookingId = bookingRes.rows[0].id;

            const res = await request(app)
                .post(`/api/bookings/cancel/${bookingId}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(400);
            expect(res.body.msg).toContain('đã bị hủy');
        });

        it('Should return 400/404 for non-existent booking', async () => {
            const res = await request(app)
                .post(`/api/bookings/cancel/999999`)
                .set('Authorization', `Bearer ${userToken}`);

            // Controller catches error "Vé không tồn tại" from service and returns 400
            expect(res.statusCode).toBe(400);
            expect(res.body.msg).toContain('Vé không tồn tại');
        });
    });

    describe('Booking History', () => {
        it('Should retrieve list of my bookings', async () => {
            // Setup: We already have some bookings created in previous tests,
            // plus we can verify we see them.
            // Specifically, we created 'TEST_REFUND' (Refunded), 'TEST_PENDING' (Cancelled),
            // 'TEST_LATE' (Paid), 'TEST_OWNER' (Paid), 'TEST_ALREADY' (Cancelled)
            // for 'userId'.

            const res = await request(app)
                .get('/api/bookings/my-bookings')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeGreaterThanOrEqual(5);

            const codes = res.body.data.map(b => b.booking_code);
            expect(codes).toContain('TEST_REFUND');
            expect(codes).toContain('TEST_LATE');
            expect(codes).toContain('TEST_OWNER');
        });

        it('Should return empty list if user has no bookings', async () => {
             const res = await request(app)
                .get('/api/bookings/my-bookings')
                .set('Authorization', `Bearer ${otherUserToken}`); // otherUser has no bookings

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toEqual([]);
        });
    });
});
