const pool = require('../config/db');

exports.getLocations = async (req, res) => {
    try {
        const { keyword } = req.query;
        let query = 'SELECT * FROM locations';
        const params = [];

        if (keyword) {
            query += ' WHERE name ILIKE $1';
            params.push(`%${keyword}%`);
        }

        query += ' ORDER BY name ASC';

        const result = await pool.query(query, params);
        res.json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};
