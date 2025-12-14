const redisClient = require('../config/redis');

class SeatRepository {
    async setSeatLock(key, userId, expirySeconds) {
        return await redisClient.set(key, userId, {
            NX: true,
            EX: expirySeconds,
        });
    }

    async getSeatHolder(key) {
        return await redisClient.get(key);
    }

    async extendLock(key, expirySeconds) {
        return await redisClient.expire(key, expirySeconds);
    }

    async removeLock(key) {
        return await redisClient.del(key);
    }
}

module.exports = new SeatRepository();
