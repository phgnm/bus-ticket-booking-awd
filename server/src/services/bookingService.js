const pool = require('../config/db');
const payos = require('../config/payos');
const bookingRepository = require('../repositories/bookingRepository');
const emailService = require('../utils/emailService');
const moment = require('moment');
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

    async createBooking({ trip_id, seats, passenger_info, userId }) {
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
                    userId: userId,
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
                returnUrl: `${process.env.CLIENT_URL}/booking-success?bookingCode=${bookingCode}`,
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

    // view history
    async getMyBookings(userId) {
        return await bookingRepository.findByUserId(userId);
    }

    // cancel & refund
    async cancelBooking(bookingId, userId) {
        const booking = await bookingRepository.findById(bookingId);

        if (!booking) throw new Error('Vé không tồn tại');

        // checking possible errors
        if (String(booking.user_id) !== String(userId)) {
            throw new Error('Bạn không thể hủy vé này');
        }

        if (['CANCELLED', 'REFUNDED'].includes(booking.booking_status)) {
            throw new Error('Vé này đã bị hủy trước đó');
        }

        // time reg
        const departureTime = moment(booking.departure_time);
        const now = moment();
        const hoursDiff = departureTime.diff(now, 'hours');

        if (hoursDiff < 24) {
            throw new Error('Chỉ được hủy vé trước giờ khởi hành 24 tiếng. Vui lòng liên hệ tổng đài.');
        }

        // refund logic
        let newStatus = 'CANCELLED';
        let refundStr = null;
        let emailSubject = 'Xác nhận hủy vé';
        let emailBody = `<p>Vé <b>${booking.booking_code}</b> đã được hủy thành công.</p>`;

        if (booking.booking_status === 'PAID') {
            newStatus = 'REFUNDED';
            emailSubject = 'Xác nhận hủy vé và Hoàn tiền';
            // 90% refund
            const refundAmount = parseFloat(booking.total_price) * 0.9;
            refundStr = refundAmount.toLocaleString('vi-VN');
            
            emailBody += `
                <p>Vì bạn đã thanh toán, hệ thống đã ghi nhận yêu cầu hoàn tiền.</p>
                <p>Số tiền hoàn lại (90%): <b>${refundStr} VNĐ</b></p>
                <p>Tiền sẽ được hoàn về tài khoản nguồn trong 5-7 ngày làm việc.</p>
            `;
        }

        // update DB
        const updateBooking = await bookingRepository.updateStatus(bookingId, newStatus);

        if (booking.contact_email) {
            await emailService.sendCancellationEmail(
                booking.contact_email, 
                booking.booking_code, 
                refundStr // Nếu null nghĩa là không hoàn tiền
            );
        }

        return updateBooking;
    }
}

module.exports = new BookingService();
