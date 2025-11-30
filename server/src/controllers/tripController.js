const pool = require('../config/db');
const redisClient = require('../config/redis');

exports.searchTrips = async (req, res) => {
    try {
        const {
            from,
            to,
            date,
            page = 1,
            limit = 10,
            sort_by = 'time',
            order = 'asc',
            min_price,
            max_price,
            bus_type,
            amenities,
        } = req.query;

        if (!from || !to || !date) {
            return res.status(400).json({
                msg: 'Vui lòng cung cấp điểm đi, điểm đến và ngày khởi hành',
            });
        }

        // Cache Key
        const cacheKey = `trips:${JSON.stringify({
            from,
            to,
            date,
            page,
            limit,
            sort_by,
            order,
            min_price,
            max_price,
            bus_type,
            amenities,
        })}`;

        // Check Redis Cache
        if (redisClient.isOpen) {
            try {
                const cachedData = await redisClient.get(cacheKey);
                if (cachedData) {
                    return res.json(JSON.parse(cachedData));
                }
            } catch (err) {
                console.error('Redis cache error:', err);
            }
        }

        // join clause to connect tables
        const joinClause = `
            FROM trips t
            JOIN routes r ON t.route_id = r.id
            JOIN buses b ON t.bus_id = b.id
            JOIN locations lf ON r.route_from = lf.id
            JOIN locations lt ON r.route_to = lt.id
            LEFT JOIN (
                SELECT trip_id, COUNT(*) as sold_tickets
                FROM bookings 
                WHERE booking_status != 'CANCELLED'
                GROUP BY trip_id
            ) booked ON t.id = booked.trip_id
        `;

        // mandatory where conditions
        const whereConditions = [
            `t.status = 'SCHEDULED'`,
            `r.route_from = $1`,
            `r.route_to = $2`,
            `DATE(t.departure_time) = $3`,
            `(b.seat_capacity - COALESCE(booked.sold_tickets, 0)) > 0`,
        ];

        // queryParams array
        const queryParams = [from, to, date];
        let paramIndex = 4; // starts from $r since $1, $2, $3 are occupied above

        // price filters
        if (min_price) {
            whereConditions.push(`r.price_base >= $${paramIndex++}`);
            queryParams.push(min_price);
        }
        if (max_price) {
            whereConditions.push(`r.price_base <= $${paramIndex++}`);
            queryParams.push(max_price);
        }

        // bus filters
        if (bus_type) {
            whereConditions.push(`b.type = $${paramIndex++}`);
            queryParams.push(bus_type);
        }

        // bus amenities filter
        if (amenities) {
            const amenitiesArray = Array.isArray(amenities)
                ? amenities
                : amenities.split(',');
            whereConditions.push(`b.amenities @> $${paramIndex++}::jsonb`);
            queryParams.push(JSON.stringify(amenitiesArray));
        }

        // finalized where clause
        const whereClause = 'WHERE ' + whereConditions.join(' AND ');

        // count total trips
        const countSql = `SELECT COUNT(*) as total ${joinClause} ${whereClause}`;

        // detail data retrieving
        let sortColumn = 't.departure_time';
        if (sort_by === 'price') sortColumn = 'r.price_base';
        if (sort_by === 'duration') sortColumn = 'r.estimated_duration';
        const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        const limitParamIndex = paramIndex++;
        const offsetParamIndex = paramIndex++;
        const dataParams = [...queryParams, limit, (page - 1) * limit];

        const dataSql = `
            SELECT 
                t.id as trip_id,
                t.departure_time,
                t.status,
                r.id as route_id,
                r.price_base,
                r.estimated_duration,
                r.distance,
                b.id as bus_id,
                b.brand,
                b.license_plate,
                b.type as bus_type,
                b.seat_capacity,
                b.amenities,
                b.images,
                lf.name as from_location_name,
                lt.name as to_location_name,
                (b.seat_capacity - COALESCE(booked.sold_tickets, 0)) as available_seats
            ${joinClause}
            ${whereClause}
            ORDER BY ${sortColumn} ${sortOrder}
            LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
        `;

        const [countResult, dataResult] = await Promise.all([
            pool.query(countSql, queryParams),
            pool.query(dataSql, dataParams),
        ]);

        // return result
        const totalTrips = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(totalTrips / limit);

        const responseData = {
            success: true,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total_trips: totalTrips,
                total_pages: totalPages,
            },
            data: dataResult.rows,
        };

        // Set Cache
        if (redisClient.isOpen) {
            try {
                await redisClient.set(
                    cacheKey,
                    JSON.stringify(responseData),
                    {
                        EX: 300, // 5 minutes
                    },
                );
            } catch (err) {
                console.error('Redis cache set error:', err);
            }
        }

        res.json(responseData);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Lỗi server khi tìm kiếm chuyến xe' });
    }
};
