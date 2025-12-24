const tripService = require('../services/tripService');

exports.getTripById = async (req, res) => {
    try {
        const trip = await tripService.getTripById(req.params.id);
        res.json({ success: true, data: trip });
    } catch (err) {
        if (err.message === 'Trip not found') {
            return res.status(404).json({ msg: 'Chuyến xe không tồn tại' });
        }
        console.error(err);
        res.status(500).json({ msg: 'Lỗi server' });
    }
};

exports.searchTrips = async (req, res) => {
    try {
        const { from, to, date } = req.query;
        if (!from || !to || !date) {
            return res
                .status(400)
                .json({
                    msg: 'Vui lòng cung cấp điểm đi, điểm đến và ngày khởi hành',
                });
        }

        const result = await tripService.searchTrips(req.query);
        res.json({ success: true, ...result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Lỗi server khi tìm kiếm chuyến xe' });
    }
};

exports.getSeatStatus = async (req, res) => {
    try {
        const result = await tripService.getSeatStatus(req.params.id);
        res.json({ success: true, trip_id: req.params.id, ...result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Lỗi lấy trạng thái ghế' });
    }
};

exports.lockSeat = async (req, res) => {
    try {
        const { seat_number } = req.body;
        const userId = req.user
            ? `user:${req.user.id}`
            : req.body.guest_id || 'unknown';

        if (!seat_number) return res.status(400).json({ msg: 'Thiếu số ghế' });

        await tripService.lockSeat(req.params.id, seat_number, userId);
        res.json({
            success: true,
            msg: `Đã giữ ghế ${seat_number} trong 10 phút`,
        });
    } catch (err) {
        if (
            err.message.includes('đã được bán') ||
            err.message.includes('người khác giữ')
        ) {
            return res.status(409).json({ msg: err.message });
        }
        console.error(err);
        res.status(500).json({ msg: 'Lỗi server khi giữ ghế' });
    }
};

exports.unlockSeat = async (req, res) => {
    try {
        await tripService.unlockSeat(req.params.id, req.body.seat_number);
        res.json({
            success: true,
            msg: `Đã hủy giữ ghế ${req.body.seat_number}`,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Lỗi server khi hủy giữ ghế' });
    }
};

exports.createBooking = async (req, res) => {
    try {
        const { seats, guest_info } = req.body;
        const result = await tripService.createDirectBooking(
            req.params.id,
            seats,
            guest_info,
            req.user,
        );

        res.status(201).json({
            success: true,
            msg: 'Đặt vé thành công',
            booking_code: result.booking_code,
            seats: seats,
            total_amount: result.total_amount,
        });
    } catch (err) {
        if (
            err.message.includes('Ghế') ||
            err.message.includes('Thiếu thông tin')
        ) {
            return res.status(400).json({ msg: err.message });
        }
        if (err.message === 'Chuyến xe không tồn tại')
            return res.status(404).json({ msg: err.message });

        console.error(err);
        res.status(500).json({ msg: 'Lỗi xử lý đặt vé' });
    }
};
