const request = require('supertest');
const app = require('../../src/app');
const redisClient = require('../../src/config/redis');

describe('Seat Locking Flow', () => {
    const tripId = 123; // Fake trip ID, Redis doesn't validate DB constraints for locking
    const userId = 'user-session-1';
    const userId2 = 'user-session-2';

    beforeAll(async () => {
        if (!redisClient.isOpen) await redisClient.connect();
    });

    afterAll(async () => {
        // Clear keys
        await redisClient.del(`lock:${tripId}:A1`);
        await redisClient.del(`lock:${tripId}:A2`);
        // We don't close redisClient because it might be shared?
        // Actually jest environment usually handles it or we should be careful.
        // But let's leave it open or close if we are sure.
        // If app.js imports redis, it might be open.
    });

    it('should lock seats successfully', async () => {
        const res = await request(app)
            .post(`/api/seats/${tripId}/lock`)
            .send({
                seats: ['A1', 'A2'],
                userId: userId
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);

        const lockA1 = await redisClient.get(`lock:${tripId}:A1`);
        expect(lockA1).toBe(userId);
    });

    it('should FAIL to lock already locked seats by another user', async () => {
        const res = await request(app)
            .post(`/api/seats/${tripId}/lock`)
            .send({
                seats: ['A1'],
                userId: userId2
            });

        expect(res.statusCode).toBe(409);
        expect(res.body.unavailableSeats).toContain('A1');
    });

    it('should refresh lock if same user locks again', async () => {
        const res = await request(app)
            .post(`/api/seats/${tripId}/lock`)
            .send({
                seats: ['A1'],
                userId: userId
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should unlock seats', async () => {
        const res = await request(app)
            .post(`/api/seats/${tripId}/unlock`)
            .send({
                seats: ['A1'],
                userId: userId
            });

        expect(res.statusCode).toBe(200);

        const lockA1 = await redisClient.get(`lock:${tripId}:A1`);
        expect(lockA1).toBeNull();
    });
});
