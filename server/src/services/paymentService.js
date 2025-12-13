const pool = require('../config/db');
const payos = require('../config/payos');
const paymentRepository = require('../repositories/paymentRepository');
const { generateTicketPDF } = require('../utils/ticketGenerator');
const { sendTicketEmail } = require('../utils/emailService');

class PaymentService {
    async processWebhook(webhookBody) {
        // verify webhook Data
        const webhookData = payos.webhooks.verify(webhookBody);

        if (webhookData.code !== '00') {
            return null;
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // update DB
            const updatedBooking = await paymentRepository.updateBookingStatus(
                client,
                webhookData.orderCode,
                'PAID',
            );

            if (!updatedBooking) {
                await client.query('COMMIT');
                return null;
            }

            // get full details
            const tripData = await paymentRepository.getBookingDetails(
                client,
                updatedBooking.booking_code,
            );

            await client.query('COMMIT');

            if (!tripData) return null;

            // prepare clean data
            const fullBookingData = {
                booking_code: updatedBooking.booking_code,
                passenger_name: tripData.passenger_name,
                passenger_phone: tripData.passenger_phone,
                contact_email: tripData.contact_email,
                from: tripData.from_loc,
                to: tripData.to_loc,
                departure_time: tripData.departure_time,
                license_plate: tripData.license_plate,
                seats: tripData.seats,
                total_price: parseFloat(tripData.total_price),
                trip_id: tripData.trip_id,
            };

            // send ticket email
            this._sendEmailInBackground(fullBookingData);

            return fullBookingData;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    async _sendEmailInBackground(bookingData) {
        try {
            const pdfBuffer = await generateTicketPDF(bookingData);
            await sendTicketEmail(
                bookingData.contact_email,
                bookingData.booking_code,
                pdfBuffer,
                bookingData,
            );
            console.log(`✅ Email sent for: ${bookingData.booking_code}`);
        } catch (err) {
            console.error('Background Email Error:', err);
        }
    }
}

module.exports = new PaymentService();
