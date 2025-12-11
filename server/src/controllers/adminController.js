const pool = require('../config/db');

// == BUS MANAGEMENT ==
exports.getBuses = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM buses ORDER BY id ASC');
        res.json({
            success: true,
            data: result.rows,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            msg: 'Server Error',
        });
    }
};

exports.createBus = async (req, res) => {
    const {
        license_plate,
        brand,
        seat_capacity,
        type,
        seat_layout,
        amenities,
        images,
    } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO buses (license_plate, brand, seat_capacity, type, seat_layout, amenities, images) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [
                license_plate,
                brand,
                seat_capacity,
                type,
                seat_layout,
                JSON.stringify(amenities),
                JSON.stringify(images),
            ],
        );
        res.status(201).json({
            success: true,
            data: result.rows[0],
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({
                msg: 'Biển số xe đã tồn tại',
            });
        }
        console.error(err);
        res.status(500).json({
            msg: 'Server error',
        });
    }
};

exports.deleteBus = async (req, res) => {
    try {
        const { id } = req.params;

        const checkTrip = await pool.query(
            "SELECT * FROM trips WHERE bus_id = $1 AND status != 'CANCELLED'",
            [id],
        );
        if (checkTrip.rows.length > 0) {
            return res.status(400).json({
                msg: 'Không thể xóa xe đang có lịch chạy',
            });
        }

        await pool.query('DELETE FROM buses WHERE id = $1', [id]);
        res.json({
            success: true,
            msg: 'Đã xóa xe thành công',
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// == ROUTE MANAGEMENT ==
exports.createRoute = async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            route_from,
            route_to,
            distance,
            estimated_duration,
            price_base,
            points,
        } = req.body;

        await client.query('BEGIN');

        const routeResult = await client.query(
            `INSERT INTO routes (route_from, route_to, distance, estimated_duration, price_base)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [route_from, route_to, distance, estimated_duration, price_base],
        );
        const routeId = routeResult.rows[0].id;

        if (points && points.length > 0) {
            for (const p of points) {
                await client.query(
                    `INSERT INTO route_points (route_id, point_id, type, order_index, time_offset) 
                     VALUES ($1, $2, $3, $4, $5)`,
                    [routeId, p.point_id, p.type, p.order_index, p.time_offset],
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json({
            success: true,
            data: routeResult.rows[0],
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({
            msg: 'Lỗi khi tạo tuyến đường',
        });
    } finally {
        client.release();
    }
};

exports.getRoutes = async (req, res) => {
    try {
        const query = `
            SELECT r.*, 
                   f.name as from_name, 
                   t.name as to_name 
            FROM routes r
            JOIN locations f ON r.route_from = f.id
            JOIN locations t ON r.route_to = t.id
        `;
        const result = await pool.query(query);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            msg: 'Server Error',
        });
    }
};

// === TRIP MANAGEMENT ==
exports.createTrip = async (req, res) => {
    try {
        const { route_id, bus_id, departure_time } = req.body;

        // take information about route
        const routeData = await pool.query(
            'SELECT estimated_duration FROM routes WHERE id = $1',
            [route_id],
        );
        if (routeData.rows.length === 0) {
            return res.status(404).json({
                msg: 'Tuyến đường không tồn tại',
            });
        }
        const durationMinutes = routeData.rows[0].estimated_duration;

        // calculate new estimated time
        const newStart = new Date(departure_time);
        const newEnd = new Date(newStart.getTime() + durationMinutes * 60000);

        // conflict check
        const conflictQuery = `
            SELECT t.id, t.departure_time, r.estimated_duration
            FROM trips t
            JOIN routes r ON t.route_id = r.id
            WHERE t.bus_id = $1 
            AND t.status != 'CANCELLED'
            AND (
                t.departure_time < $3 
                AND 
                (t.departure_time + (r.estimated_duration * INTERVAL '1 minute')) > $2
            )
        `;

        const conflicts = await pool.query(conflictQuery, [
            bus_id,
            newStart,
            newEnd,
        ]);

        if (conflicts.rows.length > 0) {
            return res.status(409).json({
                msg: 'Xe đang bận trong khung giờ này!',
                conflict_trip: conflicts.rows[0],
            });
        }

        // if no conflicts are found, insert
        const result = await pool.query(
            `INSERT INTO trips (route_id, bus_id, departure_time, status)
             VALUES ($1, $2, $3, 'SCHEDULED') RETURNING *`,
            [route_id, bus_id, newStart],
        );

        res.status(201).json({
            success: true,
            data: result.rows[0],
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};
