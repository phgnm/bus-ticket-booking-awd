const pool = require('../config/db');

class BookingRepository {
    // lookup query
    async findBookingByCodeAndEmail(code, email) {
        const query = `
            SELECT b.booking_code, b.contact_email, b.passenger_name, b.passenger_phone,
                b.total_price, b.booking_status, t.departure_time, bus.license_plate,
                bus.brand as bus_brand, lf.name as from_location, lt.name as to_location,
                array_agg(b.seat_number) as seats
            FROM bookings b
            JOIN trips t ON b.trip_id = t.id
            JOIN buses bus ON t.bus_id = bus.id
            JOIN routes r ON t.route_id = r.id
            JOIN locations lf ON r.route_from = lf.id
            JOIN locations lt ON r.route_to = lt.id
            WHERE b.booking_code = $1 AND b.contact_email = $2
            GROUP BY b.booking_code, b.contact_email, b.passenger_name, b.passenger_phone, 
                     b.total_price, b.booking_status, t.departure_time, bus.license_plate, 
                     bus.brand, lf.name, lt.name
        `;
        const result = await pool.query(query, [code, email]);
        return result.rows[0];
    }

    // check seat query
    async checkSeatsAvailability(client, tripId, seats) {
        const query = `
            SELECT seat_number FROM bookings 
            WHERE trip_id = $1 AND seat_number = ANY($2) 
            AND booking_status NOT IN ('CANCELLED', 'REFUNDED') FOR UPDATE
        `;
        const result = await client.query(query, [tripId, seats]);
        return result.rows; // Trả về danh sách ghế đã bị đặt
    }

    // get trip info query
    async getTripInfoForBooking(client, tripId) {
        const query = `
             SELECT r.price_base, lf.name as from_loc, lt.name as to_loc, t.departure_time, b.license_plate
             FROM trips t
             JOIN routes r ON t.route_id = r.id
             JOIN locations lf ON r.route_from = lf.id
             JOIN locations lt ON r.route_to = lt.id
             JOIN buses b ON t.bus_id = b.id
             WHERE t.id = $1
        `;
        const result = await client.query(query, [tripId]);
        return result.rows[0];
    }

    // create booking query
    async createBookingRecord(client, bookingData) {
        const {
            tripId,
            userId, // Thêm userId vào object nhận vào
            passengerName,
            passengerPhone,
            seatNumber,
            totalPrice,
            bookingCode,
            contactEmail,
            orderCode,
        } = bookingData;
        const query = `
        INSERT INTO bookings
        (trip_id, user_id, passenger_name, passenger_phone, seat_number, total_price, booking_code, contact_email, booking_status, transaction_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING_PAYMENT', $9) -- Thêm $2 và dịch chuyển các tham số`;
        await client.query(query, [
            tripId,
            userId, // Truyền userId vào đây
            passengerName,
            passengerPhone,
            seatNumber,
            totalPrice,
            bookingCode,
            contactEmail,
            orderCode,
        ]);
    }

    // update status
    async updateStatus(bookingId, status) {
        const query = `
            UPDATE bookings 
            SET booking_status = $1
            WHERE id = $2
            RETURNING *
        `;
        const result = await pool.query(query, [status, bookingId]);
        return result.rows[0];
    }

    // find booking by userid
    async findByUserId(userId) {
        const query = `
            SELECT b.*, 
                   t.departure_time, 
                   lf.name as from_loc, lt.name as to_loc,
                   bus.brand, bus.license_plate
            FROM bookings b
            JOIN trips t ON b.trip_id = t.id
            JOIN routes r ON t.route_id = r.id
            LEFT JOIN locations lf ON r.route_from = lf.id
            LEFT JOIN locations lt ON r.route_to = lt.id
            JOIN buses bus ON t.bus_id = bus.id
            WHERE b.user_id = $1
            ORDER BY b.id DESC
        `;
        const result = await pool.query(query, [userId]);
        return result.rows;
    }

    // find booking by its id
    async findById(bookingId) {
        const query = `
            SELECT b.*, t.departure_time
            FROM bookings b
            JOIN trips t ON b.trip_id = t.id
            WHERE b.id = $1
        `;

        const result = await pool.query(query, [bookingId]);
        return result.rows[0];
    }

    // update seat number
    async updateSeat(client, bookingId, newSeatNumber) {
        const query = `
            UPDATE bookings 
            SET seat_number = $1
            WHERE id = $2
            RETURNING *
        `;
        const result = await client.query(query, [newSeatNumber, bookingId]);
        return result.rows[0];
    }
}

module.exports = new BookingRepository();
