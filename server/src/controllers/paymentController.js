const pool = require('../config/db');
const payos = require('../config/payos');
const { generateTicketPDF } = require('../utils/ticketGenerator');
const { sendTicketEmail } = require('../utils/emailService');

exports.receiveWebHook = async (req, res) => {
    try {
        // PayOS send webhook data
        const webhookData = payos.webhooks.verify(req.body);

        if (webhookData.code === '00') {
            const orderCode = webhookData.orderCode;

            // Update DB (PENDING -> CONFIRMED)
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                
                // Update status
                const updateRes = await client.query(
                    `UPDATE bookings 
                     SET booking_status = 'PAID' 
                     WHERE transaction_id = $1 AND booking_status = 'PENDING_PAYMENT'
                     RETURNING booking_code, contact_email, passenger_name`, 
                    [String(orderCode)]
                );

                if (updateRes.rows.length > 0) {

                    // 3. Re-query DB
                    const tripQuery = `
                        SELECT 
                            b.trip_id,
                            b.passenger_name,
                            b.passenger_phone,
                            b.contact_email,
                            t.departure_time,
                            bus.license_plate,
                            lf.name as from_loc,
                            lt.name as to_loc,
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
                    
                    const tripRes = await client.query(tripQuery, [bookingCode]);
                    
                    if (tripRes.rows.length > 0) {
                        const tripData = tripRes.rows[0];

                        // 4. Gather full booking data
                        const fullBookingData = {
                            booking_code: bookingCode,
                            passenger_name: tripData.passenger_name,
                            passenger_phone: tripData.passenger_phone,
                            contact_email: tripData.contact_email,
                            from: tripData.from_loc,
                            to: tripData.to_loc,
                            departure_time: tripData.departure_time,
                            license_plate: tripData.license_plate,
                            seats: tripData.seats, 
                            total_price: parseFloat(tripData.total_price) 
                        };

                        // 5. Emit socket event
                        const io = req.app.get('io');
                        if (io) {
                            io.emit('seats_booked', { 
                                trip_id: tripData.trip_id, 
                                seats: tripData.seats 
                            });
                        }

                        // 6. Send Email (Async)
                        generateTicketPDF(fullBookingData)
                            .then(pdfBuffer => {
                                return sendTicketEmail(
                                    fullBookingData.contact_email,
                                    bookingCode,
                                    pdfBuffer,
                                    fullBookingData
                                );
                            })
                            .catch(err => console.error('Background Email Error:', err));
                        
                        console.log(`✅ Payment success for: ${bookingCode}`);
                    }
                }
                
                await client.query('COMMIT');
            } catch (err) {
                await client.query('ROLLBACK');
                console.error("Lỗi xử lý DB trong webhook:", err);
            } finally {
                client.release();
            }
        }
        res.json({ success: true });
    }
    catch (err) {
        console.error("Lỗi webhook:", err);
        res.json({ success: false });
    }
}