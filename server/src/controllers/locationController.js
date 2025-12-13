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
