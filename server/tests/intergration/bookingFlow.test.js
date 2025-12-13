const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/config/db');

// Mock socket.io in app if needed, but integration tests usually spin up the app.
// Since we modify app.js/server.js to attach io, it might be tricky in supertest.
// However, req.app.get('io') will just be undefined or we can mock it.
// The controller checks `if (io)`.

// Mock email service to avoid sending real emails
jest.mock('../../src/utils/emailService', () => ({
    sendTicketEmail: jest.fn().mockResolvedValue(true),
}));

// Mock PayOS library config
jest.mock('../../src/config/payos', () => ({
    paymentRequests: {
        create: jest.fn().mockResolvedValue({
            checkoutUrl: 'https://mock-payos-checkout.com',
        }),
    },
    webhooks: {
        verify: jest.fn().mockReturnValue({
            code: '00',
            orderCode: 123456,
        }),
    },
}));

describe('Booking Flow', () => {
    let tripId;
    let bookingCode;

    // random data
    const randomSuffix = Math.floor(Math.random() * 10000);

    beforeAll(async () => {
        // Create a trip for testing
        // 1. Create Location
        const locRes = await pool.query(`
            INSERT INTO locations (name, type) VALUES
            ('BookingCityA-${randomSuffix}', 'City'),
            ('BookingCityB-${randomSuffix}', 'City')
            RETURNING id
        `);
        const locA = locRes.rows[0].id;
        const locB = locRes.rows[1].id;

        // 2. Create Bus
        const busRes = await pool.query(
            `INSERT INTO buses (license_plate, brand, seat_capacity, type) VALUES ('BOOK-${randomSuffix}', 'TestBus', 40, 'Sleeper') RETURNING id`,
        );
        const busId = busRes.rows[0].id;

        // 3. Create Route
        const routeRes = await pool.query(
            `INSERT INTO routes (route_from, route_to, distance, estimated_duration, price_base) VALUES ($1, $2, 100, 60, 100000) RETURNING id`,
            [locA, locB],
        );
        const routeId = routeRes.rows[0].id;

        // 4. Create Trip
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tripRes = await pool.query(
            `INSERT INTO trips (route_id, bus_id, departure_time, status) VALUES ($1, $2, $3, 'SCHEDULED') RETURNING id`,
            [routeId, busId, tomorrow],
        );
        tripId = tripRes.rows[0].id;
    });

    it('should create a booking successfully', async () => {
        const res = await request(app)
            .post('/api/bookings')
            .send({
                trip_id: tripId,
                seats: ['A1', 'A2'],
                passenger_info: {
                    name: 'John Doe',
                    phone: '0901234567',
                    email: 'john@example.com',
                },
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.paymentUrl).toBeDefined();
        bookingCode = res.body.booking_code;
    });

    it('should FAIL to book already booked seats', async () => {
        const res = await request(app)
            .post('/api/bookings')
            .send({
                trip_id: tripId,
                seats: ['A1'], // Already booked above
                passenger_info: {
                    name: 'Jane Doe',
                    phone: '0909876543',
                    email: 'jane@example.com',
                },
            });

        expect(res.statusCode).toEqual(409);
        expect(res.body.msg).toContain('Một số ghế đã bị đặt');
        expect(res.body.unavailable_seats).toContain('A1');
    });

    it('should lookup booking by code and email', async () => {
        const res = await request(app)
            .get('/api/bookings/lookup')
            .query({ code: bookingCode, email: 'john@example.com' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.booking_code).toBe(bookingCode);
        expect(res.body.data.passenger_name).toBe('John Doe');
        expect(res.body.data.seats).toEqual(
            expect.arrayContaining(['A1', 'A2']),
        );
    });

    it('should FAIL to lookup with wrong info', async () => {
        const res = await request(app)
            .get('/api/bookings/lookup')
            .query({ code: bookingCode, email: 'wrong@example.com' });

        expect(res.statusCode).toEqual(404);
    });

    afterAll(async () => {
        // Cleanup
        if (bookingCode) {
            await pool.query('DELETE FROM bookings WHERE booking_code = $1', [
                bookingCode,
            ]);
        }
        if (tripId) {
            // Delete bookings for this trip first to avoid foreign key violation
            await pool.query('DELETE FROM bookings WHERE trip_id = $1', [
                tripId,
            ]);
            await pool.query('DELETE FROM trips WHERE id = $1', [tripId]);
        }
        await pool.end();
    });
});
