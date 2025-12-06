const pool = require('../config/db');

exports.lookupBooking = async (req, res) => {
    try {
        const [ code, email ] = req.query;

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