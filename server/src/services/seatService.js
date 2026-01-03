const seatRepository = require('../repositories/seatRepository');

class SeatService {
    async lockSeats(tripId, seats, userId) {
        if (!redisClient.isOpen) {
            console.warn('⚠️ Redis is down. Seat locking is temporarily unavailable.');
            return seats; 
        }

        try {
            const lockedSeats = [];
            const unavailableSeats = [];

            for (const seat of seats) {
                const key = `lock:${tripId}:${seat}`;
                const result = await seatRepository.setSeatLock(key, userId, 300);

                if (result === 'OK') {
                    lockedSeats.push(seat);
                } else {
                    const holder = await seatRepository.getSeatHolder(key);
                    if (holder === userId) {
                        await seatRepository.extendLock(key, 300);
                        lockedSeats.push(seat);
                    } else {
                        unavailableSeats.push(seat);
                    }
                }
            }

            if (unavailableSeats.length > 0) {
                await this.unlockSeats(tripId, lockedSeats, userId);
                const error = new Error(
                    `Ghế ${unavailableSeats.join(', ')} đã bị người khác giữ`,
                );
                error.unavailableSeats = unavailableSeats;
                throw error;
            }

            return lockedSeats;
        } catch(error) {
            console.error('⚠️ Redis Lock Seats Error:', error.message);
        }
    } 

    async unlockSeats(tripId, seats, userId) {
        if (!redisClient.isOpen)  return true;
        try {
            for (const seat of seats) {
                const key = `lock:${tripId}:${seat}`;
                const holder = await seatRepository.getSeatHolder(key);
                if (holder === userId) {
                    await seatRepository.removeLock(key);
                }
            }
            return true;
        } catch (error) {
            return true;
        }
    }
}

module.exports = new SeatService();
