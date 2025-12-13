const pool = require('../config/db');

// Query helper
const buildWhereClause = (queryParams, paramOffset = 1) => {
    const conditions = [];
    const values = [];
    let idx = paramOffset;

    // filter by time
    if (queryParams.startDate && queryParams.endDate) {
        conditions.push(`b.created_at >= $${idx++}::TIMESTAMP`);
        conditions.push(`b.created_at <= $${idx++}::TIMESTAMP`);
        values.push(queryParams.startDate + ' 00:00:00');
        values.push(queryParams.endDate + ' 23:59:59');
    }

    // filter by route
    if (queryParams.route_id) {
        conditions.push(`t.route_id = $${idx++}`);
        values.push(queryParams.route_id);
    }

    // filter by bus
    if (queryParams.bus_id) {
        conditions.push(`t.bus_id = $${idx++}`);
        values.push(queryParams.bus_id);
    }

    // filter by location
    if (queryParams.location_id) {
        conditions.push(`(r.route_from = $${idx++} OR r.route_to = $${idx})`);
        values.push(queryParams.location_id);
        idx++;
    }

    return {
        whereSql:
            conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : '',
        values,
        nextIdx: idx,
    };
};
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

// DASHBOARD MANAGEMENT
exports.getDashboardStats = async (req, res) => {
    try {
        // get filter from client
        const { startDate, endDate, route_id, bus_id, location_id } = req.query;

        // interval
        let start = startDate
            ? new Date(startDate)
            : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        let end = endDate ? new Date(endDate) : new Date();

        // chart format
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        let chartFormat = 'DD/MM';
        let truncType = 'day';

        if (diffDays <= 2) {
            chartFormat = 'HH24:00'; // Xem theo giờ nếu lọc < 2 ngày
            truncType = 'hour';
        } else if (diffDays > 60) {
            chartFormat = 'MM/YYYY'; // Xem theo tháng nếu lọc > 2 tháng
            truncType = 'month';
        }

        // dynamic queries
        const filterParams = {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            route_id,
            bus_id,
            location_id,
        };

        const { whereSql, values } = buildWhereClause(filterParams, 1);

        // execute query
        const [
            generalStats,
            chartStats,
            topRoutes,
            busPerformance,
            occupancyStats,
        ] = await Promise.all([
            // general query
            pool.query(
                `
                SELECT 
                    COALESCE(SUM(CASE WHEN b.booking_status = 'PAID' THEN b.total_price ELSE 0 END), 0) as total_revenue,
                    COUNT(CASE WHEN b.booking_status = 'PAID' THEN 1 END) as total_bookings,
                    COUNT(CASE WHEN b.booking_status = 'CANCELLED' THEN 1 END) as cancelled_bookings
                FROM bookings b
                LEFT JOIN trips t ON b.trip_id = t.id
                LEFT JOIN routes r ON t.route_id = r.id
                WHERE 1=1 ${whereSql}
            `,
                values,
            ),

            // revenue chart
            pool.query(
                `
                SELECT 
                    TO_CHAR(b.created_at, '${chartFormat}') as date, 
                    COALESCE(SUM(b.total_price), 0) as value
                FROM bookings b
                LEFT JOIN trips t ON b.trip_id = t.id
                LEFT JOIN routes r ON t.route_id = r.id
                WHERE b.booking_status = 'PAID' ${whereSql}
                GROUP BY TO_CHAR(b.created_at, '${chartFormat}'), DATE_TRUNC('${truncType}', b.created_at)
                ORDER BY DATE_TRUNC('${truncType}', b.created_at) ASC
            `,
                values,
            ),

            // top routes
            pool.query(
                `
                SELECT 
                    CONCAT(lf.name, ' - ', lt.name) as route_name,
                    COUNT(b.id) as ticket_count,
                    COALESCE(SUM(b.total_price), 0) as revenue
                FROM bookings b
                JOIN trips t ON b.trip_id = t.id
                JOIN routes r ON t.route_id = r.id
                JOIN locations lf ON r.route_from = lf.id
                JOIN locations lt ON r.route_to = lt.id
                WHERE b.booking_status = 'PAID' ${whereSql}
                GROUP BY lf.name, lt.name
                ORDER BY revenue DESC
                LIMIT 5
            `,
                values,
            ),

            // bus performance
            pool.query(
                `
                SELECT 
                    bus.license_plate,
                    COUNT(DISTINCT t.id) as trip_count,
                    COALESCE(SUM(b.total_price), 0) as revenue
                FROM buses bus
                JOIN trips t ON bus.id = t.bus_id
                JOIN bookings b ON t.id = b.trip_id
                JOIN routes r ON t.route_id = r.id -- Join thêm để filter theo location/route nếu cần
                WHERE b.booking_status = 'PAID' ${whereSql}
                GROUP BY bus.license_plate
                ORDER BY revenue DESC
                LIMIT 5
            `,
                values,
            ),

            // occupancy rate
            pool.query(
                `
               WITH FilteredTrips AS (
                    SELECT t.id, t.bus_id, bus.seat_capacity
                    FROM trips t
                    JOIN routes r ON t.route_id = r.id
                    JOIN buses bus ON t.bus_id = bus.id
                    WHERE t.status != 'CANCELLED'
                    AND t.departure_time >= $1::TIMESTAMP 
                    AND t.departure_time <= $2::TIMESTAMP
                    ${route_id ? `AND t.route_id = ${route_id}` : ''}
                    ${bus_id ? `AND t.bus_id = ${bus_id}` : ''}
                    ${location_id ? `AND (r.route_from = ${location_id} OR r.route_to = ${location_id})` : ''}
               ),
               Supply AS (
                    SELECT COALESCE(SUM(seat_capacity), 0) as total_capacity FROM FilteredTrips
               ),
               Demand AS (
                    SELECT COUNT(*) as sold_seats
                    FROM bookings b
                    WHERE b.booking_status = 'PAID'
                    AND b.trip_id IN (SELECT id FROM FilteredTrips)
               )
               SELECT 
                    d.sold_seats,
                    s.total_capacity,
                    CASE WHEN s.total_capacity > 0 
                         THEN ROUND((d.sold_seats::decimal / s.total_capacity) * 100, 2)
                         ELSE 0 
                    END as rate
               FROM Supply s, Demand d
            `,
                [
                    filterParams.startDate + ' 00:00:00',
                    filterParams.endDate + ' 23:59:59',
                ],
            ),
        ]);

        const stats = generalStats.rows[0];
        const totalOps =
            parseInt(stats.total_bookings) + parseInt(stats.cancelled_bookings);
        const cancelRate =
            totalOps > 0
                ? (
                      (parseInt(stats.cancelled_bookings) / totalOps) *
                      100
                  ).toFixed(1)
                : 0;

        res.json({
            success: true,
            filter: filterParams,
            data: {
                revenue: parseFloat(stats.total_revenue),
                totalBookings: parseInt(stats.total_bookings),
                activeBuses: 0,
                occupancyRate: parseFloat(occupancyStats.rows[0]?.rate || 0),
                cancelRate: parseFloat(cancelRate),

                revenueChart: chartStats.rows,
                topRoutes: topRoutes.rows,
                busPerformance: busPerformance.rows,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            msg: 'Lỗi khi lấy thống kê',
        });
    }
};
