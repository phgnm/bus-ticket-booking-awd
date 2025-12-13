const redisClient = require('../config/redis');

exports.lockSeat = async (req, res) => {
    try {
        const { tripId } = req.params;
        const { seats, userId } = req.body; // userId can be socketId or tempId for guests

        if (!seats || !Array.isArray(seats) || seats.length === 0 || !userId) {
            return res.status(400).json({ msg: 'Invalid data' });
        }

        const lockedSeats = [];
        const unavailableSeats = [];

        for (const seat of seats) {
            const key = `lock:${tripId}:${seat}`;
            // Try to set lock with 5 min (300s) expiry, only if not exists (NX)
            const result = await redisClient.set(key, userId, {
                NX: true,
                EX: 300,
            });

            if (result === 'OK') {
                lockedSeats.push(seat);
            } else {
                // If set failed, check if it's locked by THIS user (refresh lock)
                const holder = await redisClient.get(key);
                if (holder === userId) {
                    await redisClient.expire(key, 300);
                    lockedSeats.push(seat);
                } else {
                    unavailableSeats.push(seat);
                }
            }
        }

        if (unavailableSeats.length > 0) {
            // Rollback locks acquired in this batch?
            // Yes, to be polite.
            for (const seat of lockedSeats) {
                const key = `lock:${tripId}:${seat}`;
                const holder = await redisClient.get(key);
                if (holder === userId) await redisClient.del(key);
            }
            return res.status(409).json({
                msg: 'Some seats are already locked',
                unavailableSeats,
            });
        }

        // Emit socket event to notify others (optional, frontend can listen)
        const io = req.app.get('io');
        if (io) {
            io.emit('seats_locked', { tripId, seats, userId });
        }

        res.json({
            success: true,
            msg: 'Seats locked successfully',
            lockedSeats,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.unlockSeat = async (req, res) => {
    try {
        const { tripId } = req.params;
        const { seats, userId } = req.body;

        for (const seat of seats) {
            const key = `lock:${tripId}:${seat}`;
            const holder = await redisClient.get(key);
            if (holder === userId) {
                await redisClient.del(key);
            }
        }

        const io = req.app.get('io');
        if (io) {
            io.emit('seats_unlocked', { tripId, seats });
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};
