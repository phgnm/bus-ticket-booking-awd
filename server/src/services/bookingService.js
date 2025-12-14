const pool = require('../config/db');
const payos = require('../config/payos');
const bookingRepository = require('../repositories/bookingRepository');
const { generateBookingCode } = require('../utils/bookingCode');

class BookingService {
    async lookupBooking(code, email) {
        const bookingData = await bookingRepository.findBookingByCodeAndEmail(
            code,
            email,
        );
        if (!bookingData) return null;

        const finalPrice =
            parseFloat(bookingData.total_price) * bookingData.seats.length;
        return { ...bookingData, total_price: finalPrice };
    }

    async createBooking({ trip_id, seats, passenger_info }) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. seat checking
            const takenSeats = await bookingRepository.checkSeatsAvailability(
                client,
                trip_id,
                seats,
            );
            if (takenSeats.length > 0) {
                const seatList = takenSeats.map((r) => r.seat_number);
                const error = new Error(`Ghế ${seatList.join(', ')} đã bị đặt`);

                error.unavailableSeats = seatList;
                throw error;
            }

            // 2. take trip information
            const tripInfo = await bookingRepository.getTripInfoForBooking(
                client,
                trip_id,
            );
            if (!tripInfo) throw new Error('Chuyến xe không tồn tại');

            // 3. calculate money & qr
            const bookingCode = generateBookingCode();
            const totalPrice = tripInfo.price_base;
            const totalOrderAmount = totalPrice * seats.length;
            const orderCode = Number(
                String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000),
            );

            // 4. insert seats
            for (const seat of seats) {
                await bookingRepository.createBookingRecord(client, {
                    tripId: trip_id,
                    passengerName: passenger_info.name,
                    passengerPhone: passenger_info.phone,
                    seatNumber: seat,
                    totalPrice: totalPrice,
                    bookingCode: bookingCode,
                    contactEmail: passenger_info.email,
                    orderCode: orderCode,
                });
            }

            await client.query('COMMIT');

            // 5. create payment link
            const paymentData = {
                orderCode: orderCode,
                amount: totalOrderAmount,
                description: `Thanh toan ve ${bookingCode}`,
                cancelUrl: `${process.env.CLIENT_URL}/booking-failed`,
                returnUrl: `${process.env.CLIENT_URL}/booking-success?code=${bookingCode}`,
            };

            const paymentLinkData =
                await payos.paymentRequests.create(paymentData);

            return {
                paymentUrl: paymentLinkData.checkoutUrl,
                booking_code: bookingCode,
            };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
}

module.exports = new BookingService();
