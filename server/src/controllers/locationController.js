const locationService = require('../services/locationService');

exports.getLocations = async (req, res) => {
    try {
        const { keyword } = req.query;
        const data = await locationService.getLocations(keyword);

        res.json({
            success: true,
            data: data,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.createLocation = async (req, res) => {
    try {
        const data = await locationService.createLocation(req.body);
        res.status(201).json({ success: true, data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Lỗi khi tạo địa điểm' });
    }
};

exports.updateLocation = async (req, res) => {
    try {
        const data = await locationService.updateLocation(req.params.id, req.body);
        res.json({ success: true, data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Lỗi khi cập nhật địa điểm' });
    }
};

exports.deleteLocation = async (req, res) => {
    try {
        await locationService.deleteLocation(req.params.id);
        res.json({ success: true, msg: 'Xóa địa điểm thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Lỗi khi xóa địa điểm' });
    }
};