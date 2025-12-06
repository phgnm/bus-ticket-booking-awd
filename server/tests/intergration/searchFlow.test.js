const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/config/db');

describe('Trip Search API (User Flow)', () => {
    // store ID of data
    let locA_Id, locB_Id;
    let busVipId, busNormalId;
    let routeVipId, routeNormalId;
    let tripVipId, tripNormalId;

    // test date (tomorrow)
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 1);
    const dateString = testDate.toISOString().split('T')[0];

    // --- SETUP DATA ---

    beforeAll(async () => {
        // create 2 locations
        const locRes = await pool.query(`
            INSERT INTO locations (name, type) VALUES 
            ('Test_City_A', 'City'), 
            ('Test_City_B', 'City') 
            RETURNING id
        `);
        locA_Id = locRes.rows[0].id;
        locB_Id = locRes.rows[1].id;

        // create 2 buses (1 vip, 1 normal)
        const busRes = await pool.query(`
            INSERT INTO buses (license_plate, brand, seat_capacity, type, amenities, images) VALUES 
            ('TEST-VIP-01', 'VipBus', 20, 'Sleeper', '["Wifi", "TV", "WC"]', '[]'),
            ('TEST-NOR-02', 'EcoBus', 40, 'Seater', '["Water"]', '[]')
            RETURNING id
        `);
        busVipId = busRes.rows[0].id;
        busNormalId = busRes.rows[1].id;

        // create 2 routes: vip routes and normal routes
        const routeVipRes = await pool.query(`
            INSERT INTO routes (route_from, route_to, distance, estimated_duration, price_base) VALUES 
            ($1, $2, 300, 240, 500000) RETURNING id
        `, [locA_Id, locB_Id]);
        routeVipId = routeVipRes.rows[0].id;

        const routeNormalRes = await pool.query(`
            INSERT INTO routes (route_from, route_to, distance, estimated_duration, price_base) VALUES 
            ($1, $2, 300, 360, 200000) RETURNING id
        `, [locA_Id, locB_Id]);
        routeNormalId = routeNormalRes.rows[0].id;

        // create 2 trips tomorrow (1 vip, 1 normal)
        const timeVip = new Date(testDate); timeVip.setHours(8, 0, 0, 0);
        const tripVipRes = await pool.query(`
            INSERT INTO trips (route_id, bus_id, departure_time, status) VALUES 
            ($1, $2, $3, 'SCHEDULED') RETURNING id
        `, [routeVipId, busVipId, timeVip]);
        tripVipId = tripVipRes.rows[0].id;

        const timeNormal = new Date(testDate); timeNormal.setHours(10, 0, 0, 0);
        const tripNormalRes = await pool.query(`
            INSERT INTO trips (route_id, bus_id, departure_time, status) VALUES 
            ($1, $2, $3, 'SCHEDULED') RETURNING id
        `, [routeNormalId, busNormalId, timeNormal]);
        tripNormalId = tripNormalRes.rows[0].id;

        // create fake bookings
        for(let i=1; i<=5; i++) {
             await pool.query(`INSERT INTO bookings (trip_id, passenger_name, passenger_phone, seat_number, total_price, booking_code, contact_email) VALUES ($1, 'Test', '000', $2, 0, $3, 'test@example.com')`, [tripVipId, `A${i}`, `VIP-${i}`]);
        }
         await pool.query(`INSERT INTO bookings (trip_id, passenger_name, passenger_phone, seat_number, total_price, booking_code, contact_email) VALUES ($1, 'Test', '000', 'B1', 0, 'NOR-1', 'test@example.com')`, [tripNormalId]);
    });

    // --- TEST CASES ---

    it('1. Should return 400 if required params are missing', async () => {
        const res = await request(app).get('/api/trips');
        expect(res.statusCode).toBe(400);
        expect(res.body.msg).toContain('Vui lòng cung cấp');
    });

    it('2. Should find trips with basic params (From, To, Date)', async () => {
        const res = await request(app)
            .get('/api/trips')
            .query({ from: locA_Id, to: locB_Id, date: dateString });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBeGreaterThanOrEqual(2);
        
        const trip = res.body.data[0];
        expect(trip).toHaveProperty('trip_id');
        expect(trip).toHaveProperty('price_base');
        expect(trip).toHaveProperty('available_seats');
        expect(trip).toHaveProperty('brand');
        expect(trip).toHaveProperty('amenities');
    });

    it('3. Should calculate available_seats correctly', async () => {
        const res = await request(app)
            .get('/api/trips')
            .query({ from: locA_Id, to: locB_Id, date: dateString });

        const vipTrip = res.body.data.find(t => t.trip_id === tripVipId);
        expect(parseInt(vipTrip.available_seats)).toBe(15);

        const normalTrip = res.body.data.find(t => t.trip_id === tripNormalId);
        expect(parseInt(normalTrip.available_seats)).toBe(39);
    });

    it('4. Should FILTER by Price Range (Min/Max)', async () => {
        const resCheap = await request(app)
            .get('/api/trips')
            .query({ from: locA_Id, to: locB_Id, date: dateString, max_price: 300000 });
        
        expect(resCheap.body.data.length).toBeGreaterThan(0);
        expect(resCheap.body.data.some(t => t.trip_id === tripNormalId)).toBe(true);
        expect(resCheap.body.data.some(t => t.trip_id === tripVipId)).toBe(false);
    });

    it('5. Should FILTER by Bus Type', async () => {
        const res = await request(app)
            .get('/api/trips')
            .query({ from: locA_Id, to: locB_Id, date: dateString, bus_type: 'Sleeper' });

        expect(res.body.data.some(t => t.trip_id === tripVipId)).toBe(true);
        expect(res.body.data.some(t => t.trip_id === tripNormalId)).toBe(false);
    });

    it('6. Should FILTER by Amenities (JSONB check)', async () => {
        const res = await request(app)
            .get('/api/trips')
            .query({ from: locA_Id, to: locB_Id, date: dateString, amenities: 'TV' });

        expect(res.body.data.some(t => t.trip_id === tripVipId)).toBe(true);
        expect(res.body.data.some(t => t.trip_id === tripNormalId)).toBe(false);
    });

    it('7. Should SORT by Price ASC', async () => {
        const res = await request(app)
            .get('/api/trips')
            .query({ from: locA_Id, to: locB_Id, date: dateString, sort_by: 'price', order: 'asc' });

        const data = res.body.data;
        if (data.length >= 2) {
            expect(parseFloat(data[0].price_base)).toBeLessThanOrEqual(parseFloat(data[1].price_base));
            expect(data[0].trip_id).toBe(tripNormalId);
        }
    });

    it('8. Should hide Full Trips (0 available seats)', async () => {
        // book remianing normal trips until it's full
        const promises = [];
        for(let i=2; i<=40; i++) {
             promises.push(pool.query(`INSERT INTO bookings (trip_id, passenger_name, passenger_phone, seat_number, total_price, booking_code, contact_email) VALUES ($1, 'Full', '000', $2, 0, $3, 'full@example.com')`, [tripNormalId, `B${i}`, `FULL-${i}`]));
        }
        await Promise.all(promises);

        const res = await request(app)
            .get('/api/trips')
            .query({ from: locA_Id, to: locB_Id, date: dateString });
        
        expect(res.body.data.some(t => t.trip_id === tripNormalId)).toBe(false);
        expect(res.body.data.some(t => t.trip_id === tripVipId)).toBe(true);
    });

    it('9. Should support Pagination', async () => {
        const res = await request(app)
            .get('/api/trips')
            .query({ from: locA_Id, to: locB_Id, date: dateString, limit: 1, page: 1 });

        expect(res.body.data.length).toBe(1);
        expect(res.body.pagination).toBeDefined();
        expect(res.body.pagination.total_pages).toBeGreaterThanOrEqual(1);
    });

    // --- TEARDOWN ---

    afterAll(async () => {
        await pool.query('DELETE FROM bookings WHERE passenger_name IN ($1, $2)', ['Test', 'Full']);
        if(tripVipId && tripNormalId) {
            await pool.query('DELETE FROM trips WHERE id IN ($1, $2)', [tripVipId, tripNormalId]);
        }
        if(routeVipId && routeNormalId) {
            await pool.query('DELETE FROM routes WHERE id IN ($1, $2)', [routeVipId, routeNormalId]);
        }
        if(busVipId && busNormalId) {
            await pool.query('DELETE FROM buses WHERE id IN ($1, $2)', [busVipId, busNormalId]);
        }
        if(locA_Id && locB_Id) {
            await pool.query('DELETE FROM locations WHERE id IN ($1, $2)', [locA_Id, locB_Id]);
        }
        
        await pool.end();
    });
});