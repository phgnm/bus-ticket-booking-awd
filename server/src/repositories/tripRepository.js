const pool = require('../config/db');

class TripRepository {
    async create(tripData) {
        const { route_id, bus_id, departure_time } = tripData;
        const result = await pool.query(
            `INSERT INTO trips (route_id, bus_id, departure_time, status)
             VALUES ($1, $2, $3, 'SCHEDULED') RETURNING *`,
            [route_id, bus_id, departure_time],
        );
        return result.rows[0];
    }

    async findConflicts(busId, startTime, endTime) {
        const query = `
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
        const result = await pool.query(query, [busId, startTime, endTime]);
        return result.rows;
    }

    async getById(id) {
        const query = `
            SELECT t.*, r.price_base, 
                   lf.name as from_loc, lt.name as to_loc, 
                   b.license_plate, t.departure_time
            FROM trips t
            JOIN routes r ON t.route_id = r.id
            JOIN locations lf ON r.route_from = lf.id
            JOIN locations lt ON r.route_to = lt.id
            JOIN buses b ON t.bus_id = b.id
            WHERE t.id = $1
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    async getSoldSeats(tripId) {
        const query =
            "SELECT seat_number FROM bookings WHERE trip_id = $1 AND booking_status NOT IN ('CANCELLED', 'REFUNDED')";
        const result = await pool.query(query, [tripId]);
        return result.rows.map((row) => row.seat_number);
    }

    async searchWithFilters({
        from,
        to,
        date,
        min_price,
        max_price,
        bus_type,
        amenities,
        limit,
        offset,
        sort_by = 'time',
        order = 'asc',
    }) {
        const joinClause = `
            FROM trips t
            JOIN routes r ON t.route_id = r.id
            JOIN buses b ON t.bus_id = b.id
            JOIN locations lf ON r.route_from = lf.id
            JOIN locations lt ON r.route_to = lt.id
            LEFT JOIN (
                SELECT trip_id, COUNT(*) as sold_tickets
                FROM bookings WHERE booking_status != 'CANCELLED' GROUP BY trip_id
            ) booked ON t.id = booked.trip_id
        `;

        const conditions = [
            `t.status = 'SCHEDULED'`,
            `r.route_from = $1`,
            `r.route_to = $2`,
            `DATE(t.departure_time) = $3`,
            `(b.seat_capacity - COALESCE(booked.sold_tickets, 0)) > 0`,
        ];
        const params = [from, to, date];
        let idx = 4;

        if (min_price) {
            conditions.push(`r.price_base >= $${idx++}`);
            params.push(min_price);
        }
        if (max_price) {
            conditions.push(`r.price_base <= $${idx++}`);
            params.push(max_price);
        }
        if (bus_type) {
            conditions.push(`b.type = $${idx++}`);
            params.push(bus_type);
        }
        if (amenities) {
            const arr = Array.isArray(amenities)
                ? amenities
                : amenities.split(',');
            conditions.push(`b.amenities @> $${idx++}::jsonb`);
            params.push(JSON.stringify(arr));
        }

        const whereSql = 'WHERE ' + conditions.join(' AND ');

        // sort
        let sortColumn = 't.departure_time';
        if (sort_by === 'price') sortColumn = 'r.price_base';
        if (sort_by === 'duration') sortColumn = 'r.estimated_duration';
        const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        const countResult = await pool.query(
            `SELECT COUNT(*) as total ${joinClause} ${whereSql}`,
            params,
        );

        // data Query
        const dataSql = `
            SELECT t.id as trip_id, t.departure_time, t.status, r.id as route_id, r.price_base, 
                   r.estimated_duration, r.distance, b.id as bus_id, b.brand, b.license_plate, 
                   b.type as bus_type, b.seat_capacity, b.amenities, b.images,
                   lf.name as from_location_name, lt.name as to_location_name,
                   (b.seat_capacity - COALESCE(booked.sold_tickets, 0)) as available_seats
            ${joinClause} ${whereSql}
            ORDER BY ${sortColumn} ${sortOrder}
            LIMIT $${idx++} OFFSET $${idx++}
        `;

        const dataResult = await pool.query(dataSql, [
            ...params,
            limit,
            offset,
        ]);

        return {
            total: parseInt(countResult.rows[0].total),
            trips: dataResult.rows,
        };
    }

    async delete(id) {
        await pool.query('DELETE FROM trips WHERE id = $1', [id]);
    }

    async findAllForAdmin({ limit, offset }) {
        const query = `
            SELECT t.id, t.departure_time, t.status, 
                   r.price_base,
                   lf.name as from_name, lt.name as to_name,
                   b.license_plate, b.brand
            FROM trips t
            JOIN routes r ON t.route_id = r.id
            JOIN locations lf ON r.route_from = lf.id
            JOIN locations lt ON r.route_to = lt.id
            JOIN buses b ON t.bus_id = b.id
            ORDER BY t.departure_time DESC
            LIMIT $1 OFFSET $2
        `;
        
        const countQuery = `SELECT COUNT(*) as total FROM trips`;

        const [dataResult, countResult] = await Promise.all([
            pool.query(query, [limit, offset]),
            pool.query(countQuery)
        ]);

        return {
            trips: dataResult.rows,
            total: parseInt(countResult.rows[0].total)
        };
    }
}

module.exports = new TripRepository();
