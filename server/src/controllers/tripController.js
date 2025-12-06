const pool = require('../config/db');
const redisClient = require('../config/redis');
const { generateBookingCode } = require('../utils/bookingCode');
const emailService = require('../utils/emailService');
const { generateTicketPDF } = require('../utils/ticketGenerator');

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
        // Skip cache in test environment to avoid stale data in integration tests
        if (process.env.NODE_ENV !== 'test' && redisClient.isOpen) {
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
        // Skip cache set in test environment as well
        if (process.env.NODE_ENV !== 'test' && redisClient.isOpen) {
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

exports.getSeatStatus = async (req, res) => {
    try{
        const { id } = req.params;

        // take sold seat info from db
        const soldQuery = `
            SELECT seat_number 
            FROM bookings 
            WHERE trip_id = $1 AND booking_status != 'CANCELLED'
        `;
        const soldResult = await pool.query(soldQuery, [id]);
        const soldSeats = soldResult.rows.map(row => row.seat_number);

        // take locked seat list from redis
        const keys = await redisClient.keys(`lock:trip:${id}:seat:*`);

        const lockedSeats = keys.map(key => {
            return key.split(':').pop();
        });

        res.json({
            success: true,
            trip_id: id,
            sold_seats: soldSeats,
            locked_seats: lockedSeats
        });
        
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Lỗi lấy trạng thái ghế' });
    }
};

exports.lockSeat = async (req, res) => {
    try {
        const { id } = req.params; // trip_id
        const { seat_number } = req.body;
        const userId = req.user ? `user:${req.user.id}` : (req.body.guest_id || 'unknown');

        if (!seat_number) {
            return res.status(400).json({ msg: 'Thiếu số ghế' });
        }

        // check db if it's sold
        const checkSold = await pool.query(
            "SELECT * FROM bookings WHERE trip_id = $1 AND seat_number = $2 AND booking_status != 'CANCELLED'",
            [id, seat_number]
        );

        if (checkSold.rows.length > 0) {
            return res.status(409).json({
                msg: 'Ghế này đã được bán!'
            });
        }

        // check & lock redis
        const key = `lock:trip:${id}:seat:${seat_number}`;
        
        const result = await redisClient.set(key, userId, {
            NX: true,
            EX: 600 
        });

        if (!result) {
            return res.status(409).json({
                msg: 'Ghế đang được người khác giữ!'
            });
        }

        res.json({
            success: true,
            mesg: `Đã giữ ghế ${seat_number} trong 10 phút`
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Lỗi server khi giữ ghế' });
    }
};

exports.unlockSeat = async (req, res) => {
    try {
        const { id } = req.params;
        const { seat_number } = req.body;

        // check whether the unlocking and locking person the same one
        const key = `lock:trip:${id}:seat:${seat_number}`;
        
        await redisClient.del(key);

        res.json({
            success: true,
            msg: `Đã hủy giữ ghế ${seat_number}`
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Lỗi server khi hủy giữ ghế' });
    }
};

exports.createBooking = async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params; 
        const { seats, guest_info } = req.body;

        // identify user
        let userId = null;
        let redisOwnerId = null;
        let contactEmail = '';
        let contactName = '';
        let contactPhone = '';

        if (req.user) {
            // case: logged in user
            userId = req.user.id;
            redisOwnerId = `user:${userId}`;

            // take info from users table
            const userRes = await client.query('SELECT email, full_name, phone_number FROM users WHERE id = $1', [userId]);
            const userData = userRes.rows[0];
            contactEmail = userData.email;
            contactName = userData.full_name;
            contactPhone = userData.phone_number || guest_info?.phone;
        } else {
            // case: guest
            if (!guest_info || !guest_info.email || !guest_info.guest_id) {
                return res.status(400).json({ msg: 'Thiếu thông tin khách hàng (Email/GuestID)' });
            }
            redisOwnerId = guest_info.guest_id;
            contactEmail = guest_info.email;
            contactName = guest_info.name;
            contactPhone = guest_info.phone;
        }

        // take ticket price from db
        const tripQuery = `
            SELECT r.price_base 
            FROM trips t
            JOIN routes r ON t.route_id = r.id
            WHERE t.id = $1
        `;
        const tripRes = await client.query(tripQuery, [id]);
        
        if (tripRes.rows.length === 0) 
            return res.status(404).json({ 
                msg: 'Chuyến xe không tồn tại' 
            });
            
        const pricePerTicket = parseFloat(tripRes.rows[0].price_base);
        const totalPrice = pricePerTicket;

        // start transaction
        await client.query('BEGIN');

        const bookingCode = generateBookingCode();
        const bookedSeats = [];

        // loop through each seat to handle
        for (const seatNum of seats) {
            // check redis lock
            const lockKey = `lock:trip:${id}:seat:${seatNum}`;
            const lockOwner = await redisClient.get(lockKey);

            if (!lockOwner) {
                throw new Error(`Ghế ${seatNum} đã hết thời gian giữ chỗ (Hết hạn). Vui lòng chọn lại.`);
            }
            if (lockOwner !== redisOwnerId) {
                throw new Error(`Ghế ${seatNum} đang được giữ bởi người khác.`);
            }

            // check db once more
            const checkSold = await client.query(
                "SELECT * FROM bookings WHERE trip_id = $1 AND seat_number = $2 AND booking_status != 'CANCELLED'",
                [id, seatNum]
            );
            if (checkSold.rows.length > 0) {
                throw new Error(`Ghế ${seatNum} đã được bán trước do91`);
            }

            // insert booking
            const insertQuery = `
                INSERT INTO bookings (
                    trip_id, user_id, passenger_name, passenger_phone, 
                    seat_number, total_price, booking_code, contact_email, booking_status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING')
                RETURNING id;
            `;
            await client.query(insertQuery, [
                id, userId, contactName, contactPhone, 
                seatNum, totalPrice, bookingCode, contactEmail
            ]);

            bookedSeats.push(seatNum);
        }

        // commit transaction
        await client.query('COMMIT');

        // cleanup redis
        seats.forEach(seat => {
            redisClient.del(`lock:trip:${id}:seat:${seat}`);
        });

        try {
            // take trips info
            const tripInfoQuery = `
                SELECT lf.name as from_loc, lt.name as to_loc, b.license_plate, t.departure_time
                FROM trips t
                JOIN routes r ON t.route_id = r.id
                JOIN locations lf ON r.route_from = lf.id
                JOIN locations lt ON r.route_to = lt.id
                JOIN buses b ON t.bus_id = b.id
                WHERE t.id = $1
            `;
            const tripInfoRes = await client.query(tripInfoQuery, [id]);
            const tripInfo = tripInfoRes.rows[0];

            // gather data
            const fullTicketData = {
                booking_code: bookingCode,
                seats: seats,
                from: tripInfo.from_loc,
                to: tripInfo.to_loc,
                departure_time: tripInfo.departure_time,
                license_plate: tripInfo.license_plate,
                passenger_name: contactName,
                passenger_phone: contactPhone,
                contact_email: contactEmail,
                total_price: pricePerTicket * seats.length
            };

            // create pdf
            const pdfBuffer = await generateTicketPDF(fullTicketData);

            //call mail sending service:
            emailService.sendTicketEmail(contactEmail, bookingCode, pdfBuffer, fullTicketData)
                .catch(err => console.error("Background Email Error:", err));
        }
        catch (postProcessErr) {
            console.error('Lỗi hậu xử lý (PDF/Email):', postProcessErr);
            // Không return lỗi vì booking đã thành công (Commit rồi)
        }

        res.status(201).json({
            success: true,
            msg: 'Đặt vé thành công',
            booking_code: bookingCode,
            seats: bookedSeats,
            total_amount: pricePerTicket * seats.length
        });
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('Booking Error:', err.message);
    
        res.status(400).json({ 
            success: false, 
            msg: err.message || 'Lỗi xử lý đặt vé' 
        });
    } 
    finally {
        client.release(); 
    }
}