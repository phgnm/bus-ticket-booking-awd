const bookingService = require('../services/bookingService');

exports.lookupBooking = async (req, res) => {
    try {
        const { code, email } = req.query;

        if (!code || !email) {
            return res
                .status(400)
                .json({ msg: 'Vui lòng cung cấp Mã vé và Email' });
        }

        const data = await bookingService.lookupBooking(code, email);

        if (!data)
            return res.status(404).json({
                msg: 'Thiếu mã vé hoặc email',
            });

        res.json({
            success: true,
            data,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Lỗi server khi tra cứu vé' });
    }
};

exports.createBooking = async (req, res) => {
    try {
        const { trip_id, seats, passenger_info } = req.body;
        // passenger_info: { name, phone, email }

        // basic validation
        if (!trip_id || !seats || !passenger_info) {
            return res.status(400).json({ msg: 'Thiếu thông tin đặt vé' });
        }

        const result = await bookingService.createBooking({
            trip_id,
            seats,
            passenger_info,
        });

        // frontend need to redirect checkoutURL here
        res.status(200).json({
            success: true,
            msg: 'Đang chuyển hướng thanh toán...',
            ...result,
        });
    } catch (err) {
        if (err.message.includes('đã bị đặt')) {
            return res.status(409).json({
                msg: err.message,
                unavailable_seats: err.unavailableSeats || [],
            });
        }
        if (err.message === 'Chuyến xe không tồn tại') {
            return res.status(404).json({ msg: err.message });
        }
        res.status(500).json({ msg: 'Lỗi server khi đặt vé' });
    }
};
