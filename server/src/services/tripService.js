const pool = require('../config/db');
const redisClient = require('../config/redis');
const tripRepository = require('../repositories/tripRepository');
const seatRepository = require('../repositories/seatRepository');
const bookingRepository = require('../repositories/bookingRepository');
const { generateBookingCode } = require('../utils/bookingCode');
const emailService = require('../utils/emailService');
const { generateTicketPDF } = require('../utils/ticketGenerator');

class TripService {
    // --- SEARCH ---
    async searchTrips(filters) {
        const { from, to, date, page = 1, limit = 10, ...rest } = filters;

        // cache Key
        const cacheKey = `trips:${JSON.stringify(filters)}`;

        if (process.env.NODE_ENV !== 'test' && redisClient.isOpen) {
            const cached = await redisClient.get(cacheKey);
            if (cached) return JSON.parse(cached);
        }

        // call repo
        const result = await tripRepository.searchWithFilters({
            from,
            to,
            date,
            limit,
            offset: (page - 1) * limit,
            ...rest,
        });

        const response = {
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total_trips: result.total,
                total_pages: Math.ceil(result.total / limit),
            },
            data: result.trips,
        };

        // set cache
        if (process.env.NODE_ENV !== 'test' && redisClient.isOpen) {
            await redisClient.set(cacheKey, JSON.stringify(response), {
                EX: 300,
            });
        }

        return response;
    }

    async getTripById(tripId) {
        const trip = await tripRepository.getById(tripId);
        if (!trip) {
            throw new Error('Trip not found');
        }
        return trip;
    }

    // --- SEATS ---
    async getSeatStatus(tripId) {
        const soldSeats = await tripRepository.getSoldSeats(tripId);

        const keys = await redisClient.keys(`lock:trip:${tripId}:seat:*`);
        const lockedSeats = keys.map((key) => key.split(':').pop());

        return { sold_seats: soldSeats, locked_seats: lockedSeats };
    }

    async lockSeat(tripId, seatNumber, userId) {
        // 1. check db
        const soldSeats = await tripRepository.getSoldSeats(tripId);
        if (soldSeats.includes(seatNumber))
            throw new Error('Ghế này đã được bán!');

        // 2. redis lock
        const key = `lock:trip:${tripId}:seat:${seatNumber}`;
        const result = await seatRepository.setSeatLock(key, userId, 600);

        if (!result) throw new Error('Ghế đang được người khác giữ!');
        return true;
    }

    async unlockSeat(tripId, seatNumber) {
        const key = `lock:trip:${tripId}:seat:${seatNumber}`;
        await seatRepository.removeLock(key);
    }

    // --- BOOKING  ---
    async createDirectBooking(tripId, seats, guestInfo, user) {
        const client = await pool.connect();
        try {
            // 1. prepare user info
            let userId = null;
            let redisOwnerId = null;
            let contact = {};

            if (user) {
                userId = user.id;
                redisOwnerId = `user:${userId}`;
                contact = {
                    email: user.email || 'user@test.com',
                    name: user.full_name,
                    phone: user.phone_number,
                };
            } else {
                if (!guestInfo?.email || !guestInfo?.guest_id)
                    throw new Error('Thiếu thông tin khách hàng');
                redisOwnerId = guestInfo.guest_id;
                contact = {
                    email: guestInfo.email,
                    name: guestInfo.name,
                    phone: guestInfo.phone,
                };
            }

            // 2. take ticket price
            const tripInfo = await tripRepository.getById(tripId);
            if (!tripInfo) throw new Error('Chuyến xe không tồn tại');
            const price = parseFloat(tripInfo.price_base);

            await client.query('BEGIN');
            const bookingCode = generateBookingCode();

            // 3. loop seats & insert
            for (const seatNum of seats) {
                // check lock
                const key = `lock:trip:${tripId}:seat:${seatNum}`;
                const holder = await seatRepository.getSeatHolder(key);
                if (!holder) throw new Error(`Ghế ${seatNum} hết hạn giữ chỗ.`);
                if (holder !== redisOwnerId)
                    throw new Error(`Ghế ${seatNum} bị người khác giữ.`);

                // check db
                const isSold = await bookingRepository.checkSeatsAvailability(
                    client,
                    tripId,
                    [seatNum],
                );
                if (isSold.length > 0)
                    throw new Error(`Ghế ${seatNum} đã bán.`);

                // insert
                await bookingRepository.createBookingRecord(client, {
                    tripId,
                    userId,
                    passengerName: contact.name,
                    passengerPhone: contact.phone,
                    seatNumber: seatNum,
                    totalPrice: price,
                    bookingCode,
                    contactEmail: contact.email,
                    bookingStatus: 'PENDING',
                });
            }

            await client.query('COMMIT');

            // clean up redis
            for (const s of seats)
                await seatRepository.removeLock(
                    `lock:trip:${tripId}:seat:${s}`,
                );

            // async email & pdf
            this._sendTicketEmail({
                ...contact,
                bookingCode,
                seats,
                tripInfo,
                total_price: price * seats.length,
            });

            return {
                booking_code: bookingCode,
                total_amount: price * seats.length,
            };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    async _sendTicketEmail(data) {
        try {
            const fullData = {
                booking_code: data.bookingCode,
                passenger_name: data.name,
                passenger_phone: data.phone,
                contact_email: data.email,
                from: data.tripInfo.from_loc,
                to: data.tripInfo.to_loc,
                departure_time: data.tripInfo.departure_time,
                license_plate: data.tripInfo.license_plate,
                seats: data.seats,
                total_price: data.total_price,
            };
            const pdf = await generateTicketPDF(fullData);
            await emailService.sendTicketEmail(
                data.email,
                data.bookingCode,
                pdf,
                fullData,
            );
        } catch (e) {
            console.error('Email Error:', e);
        }
    }

    async deleteTrip(id) {
        const soldSeats = await tripRepository.getSoldSeats(id);
        if (soldSeats.length > 0) {
            throw new Error('Không thể xóa chuyến xe đã có người đặt vé.');
        }
        await tripRepository.delete(id);
    }
}

module.exports = new TripService();
