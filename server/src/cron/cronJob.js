const cron = require('node-cron');
const pool = require('../config/db');
const { sendReminderEmail } = require('../utils/emailService');

const initCronJobs = (io) => {
    console.log('⏰ Cron Jobs initialized...');

    // JOB 1: Auto cancel unpaid bookings
    cron.schedule('* * * * *', async () => {
        const client = await pool.connect();
        try {
            // Find all 'PENDING_PAYMENT' that has been over 15 mins
            const query = `
                UPDATE bookings 
                SET booking_status = 'CANCELLED' 
                WHERE booking_status = 'PENDING_PAYMENT' 
                AND created_at < NOW() - INTERVAL '15 minutes'
                RETURNING booking_code, seat_number, trip_id
            `;

            const result = await client.query(query);

            if (result.rows.length > 0) {
                console.log(
                    `♻️ Auto-cancelled ${result.rows.length} expired bookings.`,
                );

                if (io) {
                    const seatsByTrip = {};

                    // grouping seats by trips
                    result.rows.forEach((row) => {
                        if (!seatsByTrip[row.trip_id]) {
                            seatsByTrip[row.trip_id] = [];
                        }
                        seatsByTrip[row.trip_id].push(row.seat_number);
                    });

                    // emit event for each trip
                    Object.keys(seatsByTrip).forEach((tripId) => {
                        io.emit('seats_released', {
                            trip_id: tripId,
                            seats: seatsByTrip[tripId],
                        });

                        console.log(
                            `📡 Socket emitted 'seats_released' for trip ${tripId}:`,
                            seatsByTrip[tripId],
                        );
                    });
                }
            }
        } catch (err) {
            console.error('❌ Error in Auto-Cancel Job:', err);
        } finally {
            client.release();
        }
    });

    // JOB 2: Send trip reminder
    cron.schedule('*/10 * * * *', async () => {
        const client = await pool.connect();
        try {
            const query = `
                SELECT 
                    b.id, b.contact_email, b.passenger_name, b.seat_number,
                    t.departure_time, 
                    lf.name as from_loc, lt.name as to_loc,
                    bus.license_plate
                FROM bookings b
                JOIN trips t ON b.trip_id = t.id
                JOIN routes r ON t.route_id = r.id
                JOIN locations lf ON r.route_from = lf.id
                JOIN locations lt ON r.route_to = lt.id
                JOIN buses bus ON t.bus_id = bus.id
                WHERE b.booking_status = 'PAID'
                AND t.departure_time >= NOW() + INTERVAL '24 hours' 
                AND t.departure_time < NOW() + INTERVAL '24 hours 10 minutes'
            `;

            const result = await client.query(query);

            if (result.rows.length > 0) {
                console.log(
                    `🔔 Sending reminders for ${result.rows.length} bookings...`,
                );

                const emailPromises = result.rows.map((booking) => {
                    const tripInfo = {
                        from: booking.from_loc,
                        to: booking.to_loc,
                        departure_time: booking.departure_time,
                        license_plate: booking.license_plate,
                        seats: booking.seat_number,
                    };
                    return sendReminderEmail(
                        booking.contact_email,
                        booking.passenger_name,
                        tripInfo,
                    );
                });

                await Promise.all(emailPromises);
            }
        } catch (err) {
            console.error('❌ Error in Reminder Job:', err);
        } finally {
            client.release();
        }
    });
};

module.exports = initCronJobs;
