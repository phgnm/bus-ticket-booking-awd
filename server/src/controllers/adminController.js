const adminService = require('../services/adminService');

// == BUS ==
exports.getBuses = async (req, res) => {
    try {
        const data = await adminService.getBuses();
        res.json({ success: true, data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.createBus = async (req, res) => {
    try {
        const data = await adminService.createBus(req.body);
        res.status(201).json({ success: true, data });
    } catch (err) {
        if (err.message === 'Biển số xe đã tồn tại') {
            return res.status(400).json({ msg: err.message });
        }
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.deleteBus = async (req, res) => {
    try {
        await adminService.deleteBus(req.params.id);
        res.json({ success: true, msg: 'Đã xóa xe thành công' });
    } catch (err) {
        if (err.message === 'Không thể xóa xe đang có lịch chạy') {
            return res.status(400).json({ msg: err.message });
        }
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// == ROUTE ==
exports.getRoutes = async (req, res) => {
    try {
        const data = await adminService.getRoutes();
        res.json({ success: true, data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.createRoute = async (req, res) => {
    try {
        const data = await adminService.createRoute(req.body);
        res.status(201).json({ success: true, data });
    } catch (err) {
        // Handle lỗi địa điểm không tồn tại một cách êm đẹp
        if (err.code === 'INVALID_LOCATION') {
            return res.status(400).json({ msg: err.message });
        }

        console.error(err); // Chỉ log những lỗi 500 thực sự
        res.status(500).json({ msg: 'Lỗi khi tạo tuyến đường' });
    }
};

// == TRIP ==
exports.createTrip = async (req, res) => {
    try {
        const data = await adminService.createTrip(req.body);
        res.status(201).json({ success: true, data });
    } catch (err) {
        if (err.message === 'Tuyến đường không tồn tại') {
            return res.status(404).json({ msg: err.message });
        }
        if (err.message === 'Xe đang bận trong khung giờ này!') {
            return res.status(409).json({
                msg: err.message,
                conflict_trip: err.conflictTrip,
            });
        }
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// == DASHBOARD ==
exports.getDashboardStats = async (req, res) => {
    try {
        const result = await adminService.getDashboardStats(req.query);
        res.json({ success: true, ...result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Lỗi khi lấy thống kê' });
    }
};
