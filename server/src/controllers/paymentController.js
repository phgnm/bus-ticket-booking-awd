const paymentService = require('../services/paymentService');

exports.receiveWebHook = async (req, res) => {
    try {
        const bookingData = await paymentService.processWebhook(req.body);

        if (bookingData) {
            const io = req.app.get('io');
            if (io) {
                io.emit('seats_booked', {
                    trip_id: bookingData.trip_id,
                    seats: bookingData.seats,
                });
            }
            console.log(
                `✅ Payment processed for: ${bookingData.booking_code}`,
            );
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Lỗi webhook:', err);
        res.json({ success: false });
    }
};
