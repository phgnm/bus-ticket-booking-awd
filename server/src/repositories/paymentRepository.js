const pool = require('../config/db');

class PaymentRepository {
    // change to PAID
    async updateBookingStatus(client, orderCode, status) {
        const query = `
            UPDATE bookings 
            SET booking_status = $1 
            WHERE transaction_id = $2 AND booking_status = 'PENDING_PAYMENT'
            RETURNING booking_code
        `;

        const result = await client.query(query, [status, String(orderCode)]);
        return result.rows[0];
    }

    // get full trip information
    async getBookingDetails(client, bookingCode) {
        const query = `
            SELECT 
                b.trip_id, b.passenger_name, b.passenger_phone, b.contact_email,
                t.departure_time, bus.license_plate,
                lf.name as from_loc, lt.name as to_loc,
                array_agg(b.seat_number) as seats,
                SUM(b.total_price) as total_price
            FROM bookings b
            JOIN trips t ON b.trip_id = t.id
            JOIN buses bus ON t.bus_id = bus.id
            JOIN routes r ON t.route_id = r.id
            JOIN locations lf ON r.route_from = lf.id
            JOIN locations lt ON r.route_to = lt.id
            WHERE b.booking_code = $1
            GROUP BY b.trip_id, b.passenger_name, b.passenger_phone, b.contact_email, 
                     t.departure_time, bus.license_plate, lf.name, lt.name
        `;
        const result = await client.query(query, [bookingCode]);
        return result.rows[0];
    }
}

module.exports = new PaymentRepository();
