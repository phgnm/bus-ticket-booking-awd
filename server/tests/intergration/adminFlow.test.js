const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/config/db');

describe('Admin Management Flow', () => {
    let adminToken;
    let createdBusId;
    let createdRouteId;

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

    // test bus crud
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

    // test route creation
    it('should create a new route', async () => {
        const res = await request(app)
            .post('/api/admin/routes')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                from_location_id: 1, 
                to_location_id: 2,   
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

    // test scheduling
    it('should create a trip successfully (Valid Time)', async () => {
        // create a trip that starts tomorrow at 10AM
        // stimated_duration cof the route is 300 mins (5 hrs)
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
    });

    // test conflict trips
    it('should FAIL to create overlapping trip (Conflict)', async () => {
        // create another trip for the same bus
        // starts at 12PM the same day
        // should state conflict
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

        // expect 409
        expect(res.statusCode).toEqual(409); 
        expect(res.body.msg).toContain('Xe đang bận');
    });

    // test a non-conflict trip
    it('should create another trip successfully (After previous trip finishes)', async () => {
        // create trip at 4PM
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

    // clear data post-test (to make it reusable)
    afterAll(async () => {
        if (createdBusId && createdRouteId) {
            console.log(`\n--- Cleaning up test data: Bus ID ${createdBusId}, Route ID ${createdRouteId} ---`);
            try {
                // 1. delete trips
                await pool.query('DELETE FROM trips WHERE bus_id = $1 AND route_id = $2', [
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

                // 4. delete buses
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