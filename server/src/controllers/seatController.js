const redisClient = require('../config/redis');
const seatService = require('../services/seatService');

exports.lockSeat = async (req, res) => {
    try {
        const { tripId } = req.params;
        const { seats, userId } = req.body; // userId can be socketId or tempId for guests

        if (!seats || !Array.isArray(seats) || seats.length === 0 || !userId) {
            return res.status(400).json({ msg: 'Invalid data' });
        }

        const lockedSeats = await seatService.lockSeats(tripId, seats, userId);

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
        res.status(409).json({
            msg: err.message,
            unavailableSeats: err.unavailableSeats || [],
        });
    }
};

exports.unlockSeat = async (req, res) => {
    try {
        const { tripId } = req.params;
        const { seats, userId } = req.body;

        await seatService.unlockSeats(tripId, seats, userId);

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
