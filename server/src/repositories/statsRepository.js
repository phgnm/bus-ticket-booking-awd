const pool = require('../config/db');

class StatsRepository {
    // Helper function (private logic)
    _buildWhereClause(queryParams, paramOffset = 1) {
        const conditions = [];
        const values = [];
        let idx = paramOffset;

        if (queryParams.startDate && queryParams.endDate) {
            conditions.push(`b.created_at >= $${idx++}::TIMESTAMP`);
            conditions.push(`b.created_at <= $${idx++}::TIMESTAMP`);
            values.push(queryParams.startDate + ' 00:00:00');
            values.push(queryParams.endDate + ' 23:59:59');
        }
        if (queryParams.route_id) {
            conditions.push(`t.route_id = $${idx++}`);
            values.push(queryParams.route_id);
        }
        if (queryParams.bus_id) {
            conditions.push(`t.bus_id = $${idx++}`);
            values.push(queryParams.bus_id);
        }
        if (queryParams.location_id) {
            conditions.push(
                `(r.route_from = $${idx++} OR r.route_to = $${idx})`,
            );
            values.push(queryParams.location_id);
            idx++;
        }

        return {
            whereSql:
                conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : '',
            values,
        };
    }

    async getDashboardStats(filterParams, chartFormat, truncType) {
        const { whereSql, values } = this._buildWhereClause(filterParams, 1);

        const [general, chart, topRoutes, busPerf, occupancy] =
            await Promise.all([
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
                WHERE 1=1 ${whereSql}`,
                    values,
                ),

                // revenue chart
                pool.query(
                    `
                SELECT TO_CHAR(b.created_at, '${chartFormat}') as date, COALESCE(SUM(b.total_price), 0) as value
                FROM bookings b
                LEFT JOIN trips t ON b.trip_id = t.id
                LEFT JOIN routes r ON t.route_id = r.id
                WHERE b.booking_status = 'PAID' ${whereSql}
                GROUP BY TO_CHAR(b.created_at, '${chartFormat}'), DATE_TRUNC('${truncType}', b.created_at)
                ORDER BY DATE_TRUNC('${truncType}', b.created_at) ASC`,
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
                    SELECT t.id, bus.seat_capacity FROM trips t JOIN routes r ON t.route_id = r.id JOIN buses bus ON t.bus_id = bus.id
                    WHERE t.status != 'CANCELLED' AND t.departure_time >= $1::TIMESTAMP AND t.departure_time <= $2::TIMESTAMP
                    ${filterParams.route_id ? `AND t.route_id = ${filterParams.route_id}` : ''}
                    ${filterParams.bus_id ? `AND t.bus_id = ${filterParams.bus_id}` : ''}
                    ${filterParams.location_id ? `AND (r.route_from = ${filterParams.location_id} OR r.route_to = ${filterParams.location_id})` : ''}
                ),
                Supply AS (SELECT COALESCE(SUM(seat_capacity), 0) as total_capacity FROM FilteredTrips),
                Demand AS (SELECT COUNT(*) as sold_seats FROM bookings b WHERE b.booking_status = 'PAID' AND b.trip_id IN (SELECT id FROM FilteredTrips))
                SELECT d.sold_seats, s.total_capacity,
                    CASE WHEN s.total_capacity > 0 THEN ROUND((d.sold_seats::decimal / s.total_capacity) * 100, 2) ELSE 0 END as rate
                FROM Supply s, Demand d`,
                    [
                        filterParams.startDate + ' 00:00:00',
                        filterParams.endDate + ' 23:59:59',
                    ],
                ),
            ]);

        return {
            general: general.rows[0],
            chart: chart.rows,
            topRoutes: topRoutes.rows,
            busPerf: busPerf.rows,
            occupancy: occupancy.rows[0],
        };
    }
}

module.exports = new StatsRepository();
