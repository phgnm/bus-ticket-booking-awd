const pool = require('../config/db');
const { generateBookingCode } = require('../utils/bookingCode');
const { generateTicketPDF } = require('../utils/ticketGenerator');
const { sendTicketEmail } = require('../utils/emailService');

exports.lookupBooking = async (req, res) => {
    try {
        const { code, email } = req.query;

        if (!code || !email) {
            return res.status(400).json({ msg: 'Vui lòng cung cấp Mã vé và Email' });
        }

        const query = `
            SELECT 
                b.booking_code,
                b.contact_email,
                b.passenger_name,
                b.passenger_phone,
                b.total_price,
                b.booking_status,
                t.departure_time,
                bus.license_plate,
                bus.brand as bus_brand,
                lf.name as from_location,
                lt.name as to_location,
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

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Không tìm thấy thông tin vé phù hợp' });
        }

        const bookingData = result.rows[0];
        const finalPrice = parseFloat(bookingData.total_price) * bookingData.seats.length;

        res.json({
            success: true,
            data: {
                ...bookingData,
                total_price: finalPrice
            }
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Lỗi server khi tra cứu vé' });
    }
};

exports.createBooking = async (req, res) => {
    const client = await pool.connect();
    try {
        const { trip_id, seats, passenger_info } = req.body;
        // passenger_info: { name, phone, email }

        // Basic validation
        if (!trip_id || !seats || !Array.isArray(seats) || seats.length === 0 || !passenger_info) {
            return res.status(400).json({ msg: 'Thiếu thông tin đặt vé' });
        }

        // Start transaction
        await client.query('BEGIN');

        // 1. Check if seats are available
        const seatCheck = await client.query(
            `SELECT seat_number FROM bookings WHERE trip_id = $1 AND seat_number = ANY($2) FOR UPDATE`,
            [trip_id, seats]
        );

        if (seatCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({
                msg: 'Một số ghế đã bị đặt',
                unavailable_seats: seatCheck.rows.map(r => r.seat_number)
            });
        }

        // 2. Get Trip Info (Price)
        const tripRes = await client.query(
            `SELECT r.price_base, lf.name as from_loc, lt.name as to_loc, t.departure_time, b.license_plate
             FROM trips t
             JOIN routes r ON t.route_id = r.id
             JOIN locations lf ON r.route_from = lf.id
             JOIN locations lt ON r.route_to = lt.id
             JOIN buses b ON t.bus_id = b.id
             WHERE t.id = $1`,
            [trip_id]
        );

        if (tripRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ msg: 'Chuyến xe không tồn tại' });
        }

        const tripInfo = tripRes.rows[0];
        const bookingCode = generateBookingCode();
        const totalPrice = tripInfo.price_base; // Price per seat

        // 3. Insert Bookings
        for (const seat of seats) {
            await client.query(
                `INSERT INTO bookings
                (trip_id, passenger_name, passenger_phone, seat_number, total_price, booking_code, contact_email, booking_status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'CONFIRMED')`,
                [trip_id, passenger_info.name, passenger_info.phone, seat, totalPrice, bookingCode, passenger_info.email]
            );
        }

        await client.query('COMMIT');

        // 4. Emit socket event for real-time update
        const io = req.app.get('io');
        if (io) {
            io.emit('seats_booked', { trip_id, seats });
        }

        // 5. Generate PDF & Send Email (Async)
        // Gather full booking data for ticket
        const fullBookingData = {
            booking_code: bookingCode,
            passenger_name: passenger_info.name,
            passenger_phone: passenger_info.phone,
            contact_email: passenger_info.email,
            from: tripInfo.from_loc,
            to: tripInfo.to_loc,
            departure_time: tripInfo.departure_time,
            license_plate: tripInfo.license_plate,
            seats: seats,
            total_price: totalPrice * seats.length
        };

        // Don't await email to prevent blocking response?
        // Or await to ensure it sent? Requirements say "Implement... email delivery".
        // Usually good to await or handle error.
        try {
            const pdfBuffer = await generateTicketPDF(fullBookingData);
            await sendTicketEmail(passenger_info.email, bookingCode, pdfBuffer, fullBookingData);
        } catch (emailErr) {
            console.error('Failed to send email:', emailErr);
            // Don't fail the request, booking is already confirmed.
        }

        res.status(201).json({
            success: true,
            msg: 'Đặt vé thành công',
            data: {
                booking_code: bookingCode,
                seats: seats,
                total_price: fullBookingData.total_price
            }
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ msg: 'Lỗi server khi đặt vé' });
    } finally {
        client.release();
    }
};
