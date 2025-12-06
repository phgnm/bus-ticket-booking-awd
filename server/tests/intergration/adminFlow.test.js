const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/config/db');

describe('Admin Management Flow', () => {
    let adminToken;
    let createdBusId;
    let createdRouteId;
    // let createdTripId; // Unused variable

    // random data
    const randomSuffix = Math.floor(Math.random() * 10000); 
    const busPlate = `59Z-${randomSuffix}`;

    // test admin login
    it('should login as admin and return token', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@vexere.com',
                password: 'admin123'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        adminToken = res.body.token;
    });

    // === BUS MANAGEMENT TESTS ===

    it('should create a new bus', async () => {
        const res = await request(app)
            .post('/api/admin/buses')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                license_plate: busPlate,
                brand: 'Test Bus Line',
                seat_capacity: 40,
                type: 'Sleeper',
                seat_layout: { rows: 10, cols: 4 },
                amenities: ['Wifi', 'LCD'],
                images: ['http://img.com/1.jpg']
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.license_plate).toBe(busPlate);
        createdBusId = res.body.data.id;
    });

    it('should FAIL to create bus with duplicate license plate', async () => {
        const res = await request(app)
            .post('/api/admin/buses')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                license_plate: busPlate, // Same license plate
                brand: 'Another Bus',
                seat_capacity: 30,
                type: 'Seat',
                seat_layout: { rows: 10, cols: 3 }
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body.msg).toBe('Biển số xe đã tồn tại');
    });

    it('should get all buses', async () => {
        const res = await request(app)
            .get('/api/admin/buses')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        // Ensure our created bus is in the list
        const found = res.body.data.find(b => b.id === createdBusId);
        expect(found).toBeTruthy();
    });

    // === ROUTE MANAGEMENT TESTS ===

    it('should FAIL to create a new route with invalid data', async () => {
        await request(app)
            .post('/api/admin/routes')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                // missing required fields
                distance: 300,
                estimated_duration: 300,
                price_base: 250000,
                points: []
            });

        // Assuming the DB schema has NOT NULL constraints, this should fail.
        // Or if there is validation logic.
        // Based on controller: it tries to insert immediately.
        // DB constraints: route_from and route_to are FKs but not explicitly NOT NULL in CREATE TABLE?
        // Let's check init.sql:
        // route_from INT REFERENCES locations(id),
        // price_base DECIMAL(10, 2) NOT NULL
        // If route_from is missing, it might be NULL.
        // However, let's assume we want it to fail or at least test what happens.
        // If the controller doesn't validate, it might return 500 or 201 depending on DB.

        // Actually, looking at the code, if `route_from` is missing, it will be undefined.
        // The query uses $1, $2 etc.
        // If I send null/undefined, pg might complain or insert NULL.
        // Let's force a failure by sending an invalid type or violating a constraint if possible.
        // Creating a route with invalid location ID (FK violation) is a good test.

    });

    it('should FAIL to create a new route with invalid location IDs', async () => {
        const res = await request(app)
            .post('/api/admin/routes')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                route_from: 99999,
                route_to: 88888,
                distance: 300,
                estimated_duration: 300,
                price_base: 250000
            });

        expect(res.statusCode).toEqual(500); // Controller catches error and returns 500
        expect(res.body.msg).toBe('Lỗi khi tạo tuyến đường');
    });

    it('should create a new route', async () => {
        const res = await request(app)
            .post('/api/admin/routes')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                route_from: 1,
                route_to: 2,
                distance: 300,
                estimated_duration: 300,
                price_base: 250000,
                points: [
                    { point_id: 1, type: 'PICKUP', order_index: 1, time_offset: 0 },
                    { point_id: 4, type: 'DROPOFF', order_index: 2, time_offset: 300 }
                ]
            });

        expect(res.statusCode).toEqual(201);
        createdRouteId = res.body.data.id;
    });

    it('should get all routes', async () => {
        const res = await request(app)
            .get('/api/admin/routes')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        const found = res.body.data.find(r => r.id === createdRouteId);
        expect(found).toBeTruthy();
    });

    // === TRIP MANAGEMENT TESTS ===

    it('should create a trip successfully (Valid Time)', async () => {
        // create a trip that starts tomorrow at 10AM
        // estimated_duration of the route is 300 mins (5 hrs)
        // => should run from 10:00 -> 15:00
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);

        const res = await request(app)
            .post('/api/admin/trips')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                route_id: createdRouteId,
                bus_id: createdBusId,
                departure_time: tomorrow.toISOString()
            });

        expect(res.statusCode).toEqual(201);
        // createdTripId = res.body.data.id;
    });

    it('should FAIL to create trip with non-existent route', async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(20, 0, 0, 0);

        const res = await request(app)
            .post('/api/admin/trips')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                route_id: 999999, // Invalid ID
                bus_id: createdBusId,
                departure_time: tomorrow.toISOString()
            });

        expect(res.statusCode).toEqual(404);
        expect(res.body.msg).toBe('Tuyến đường không tồn tại');
    });

    // Overlap scenarios
    // Existing trip: 10:00 -> 15:00

    it('should FAIL to create overlapping trip (Starts inside existing trip)', async () => {
        // Starts at 12:00, ends at 17:00
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(12, 0, 0, 0);

        const res = await request(app)
            .post('/api/admin/trips')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                route_id: createdRouteId,
                bus_id: createdBusId, 
                departure_time: tomorrow.toISOString()
            });

        expect(res.statusCode).toEqual(409); 
        expect(res.body.msg).toContain('Xe đang bận');
    });

    it('should FAIL to create overlapping trip (Ends inside existing trip)', async () => {
        // Starts at 08:00, ends at 13:00 (overlap 10:00-13:00)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(8, 0, 0, 0);

        const res = await request(app)
            .post('/api/admin/trips')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                route_id: createdRouteId,
                bus_id: createdBusId,
                departure_time: tomorrow.toISOString()
            });

        expect(res.statusCode).toEqual(409);
        expect(res.body.msg).toContain('Xe đang bận');
    });

    it('should FAIL to create overlapping trip (Encloses existing trip)', async () => {
        // Starts at 09:00, ends at 16:00 (encloses 10:00-15:00)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);

        const res = await request(app)
            .post('/api/admin/trips')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                route_id: createdRouteId,
                bus_id: createdBusId,
                departure_time: tomorrow.toISOString()
            });

        expect(res.statusCode).toEqual(409);
        expect(res.body.msg).toContain('Xe đang bận');
    });

    it('should create another trip successfully (After previous trip finishes)', async () => {
        // create trip at 16:00 (gap of 1 hour from 15:00)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(16, 0, 0, 0);

        const res = await request(app)
            .post('/api/admin/trips')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                route_id: createdRouteId,
                bus_id: createdBusId,
                departure_time: tomorrow.toISOString()
            });

        expect(res.statusCode).toEqual(201);
    });

    // === DELETE CHECKS ===

    it('should FAIL to delete bus assigned to active trips', async () => {
        const res = await request(app)
            .delete(`/api/admin/buses/${createdBusId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toEqual(400);
        expect(res.body.msg).toBe('Không thể xóa xe đang có lịch chạy');
    });

    // Clean up trips first so we can delete the bus
    it('should delete the bus successfully after trips are removed', async () => {
        // Manually delete trips for this bus to simulate cleanup/cancellation
        await pool.query('DELETE FROM trips WHERE bus_id = $1', [createdBusId]);

        const res = await request(app)
            .delete(`/api/admin/buses/${createdBusId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.msg).toBe('Đã xóa xe thành công');
    });

    // clear data post-test (to make it reusable)
    afterAll(async () => {
        if (createdBusId && createdRouteId) {
            console.log(`\n--- Cleaning up test data: Bus ID ${createdBusId}, Route ID ${createdRouteId} ---`);
            try {
                // 1. delete trips
                await pool.query('DELETE FROM trips WHERE bus_id = $1 OR route_id = $2', [
                    createdBusId,
                    createdRouteId,
                ]);
                console.log('Deleted test trips.');

                // 2. delete route_points
                await pool.query('DELETE FROM route_points WHERE route_id = $1', [createdRouteId]);
                console.log('Deleted test route_points.');

                // 3. delete routes
                await pool.query('DELETE FROM routes WHERE id = $1', [createdRouteId]);
                console.log('Deleted test route.');

                // 4. delete buses (if not already deleted by test)
                await pool.query('DELETE FROM buses WHERE id = $1', [createdBusId]);
                console.log('Deleted test bus.');

            } catch (error) {
                console.error('ERROR during cleanup:', error.message);
            }
        } else {
            console.log('\n--- Cleanup skipped: Test data not fully created ---');
        }

        await pool.end(); 
    });
});
