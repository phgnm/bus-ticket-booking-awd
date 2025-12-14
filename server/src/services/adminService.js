const pool = require('../config/db');
const busRepo = require('../repositories/busRepository');
const routeRepo = require('../repositories/routeRepository');
const tripRepo = require('../repositories/tripRepository');
const statsRepo = require('../repositories/statsRepository');

class AdminService {
    // --- BUS ---
    async getBuses() {
        return await busRepo.getAll();
    }

    async createBus(busData) {
        try {
            return await busRepo.create(busData);
        } catch (err) {
            if (err.code === '23505') throw new Error('Biển số xe đã tồn tại');
            throw err;
        }
    }

    async deleteBus(id) {
        const hasTrips = await busRepo.hasActiveTrips(id);
        if (hasTrips) throw new Error('Không thể xóa xe đang có lịch chạy');
        return await busRepo.delete(id);
    }

    // --- ROUTE ---
    async getRoutes() {
        return await routeRepo.getAll();
    }

    async createRoute(routeData) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const newRoute = await routeRepo.createRoute(client, routeData);

            if (routeData.points && routeData.points.length > 0) {
                await routeRepo.addRoutePoints(
                    client,
                    newRoute.id,
                    routeData.points,
                );
            }

            await client.query('COMMIT');
            return newRoute;
        } catch (err) {
            await client.query('ROLLBACK');

            if (err.code === '23503') {
                const error = new Error(
                    'Địa điểm đi hoặc đến không tồn tại trong hệ thống',
                );
                error.code = 'INVALID_LOCATION';
                throw error;
            }
            throw err;
        } finally {
            client.release();
        }
    }

    // --- TRIP ---
    async createTrip(tripData) {
        const { route_id, bus_id, departure_time } = tripData;

        // get route info
        const route = await routeRepo.getById(route_id);
        if (!route) throw new Error('Tuyến đường không tồn tại');

        // calculate time
        const durationMinutes = route.estimated_duration;
        const newStart = new Date(departure_time);
        const newEnd = new Date(newStart.getTime() + durationMinutes * 60000);

        // check conflict
        const conflicts = await tripRepo.findConflicts(
            bus_id,
            newStart,
            newEnd,
        );
        if (conflicts.length > 0) {
            const error = new Error('Xe đang bận trong khung giờ này!');
            error.conflictTrip = conflicts[0];
            throw error;
        }

        return await tripRepo.create({
            route_id,
            bus_id,
            departure_time: newStart,
        });
    }

    // --- STATS ---
    async getDashboardStats(query) {
        const { startDate, endDate, route_id, bus_id, location_id } = query;

        let start = startDate
            ? new Date(startDate)
            : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        let end = endDate ? new Date(endDate) : new Date();
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

        let chartFormat = 'DD/MM';
        let truncType = 'day';
        if (diffDays <= 2) {
            chartFormat = 'HH24:00';
            truncType = 'hour';
        } else if (diffDays > 60) {
            chartFormat = 'MM/YYYY';
            truncType = 'month';
        }

        const filterParams = {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            route_id,
            bus_id,
            location_id,
        };

        const data = await statsRepo.getDashboardStats(
            filterParams,
            chartFormat,
            truncType,
        );

        const stats = data.general;
        const totalOps =
            parseInt(stats.total_bookings) + parseInt(stats.cancelled_bookings);
        const cancelRate =
            totalOps > 0
                ? (
                      (parseInt(stats.cancelled_bookings) / totalOps) *
                      100
                  ).toFixed(1)
                : 0;

        return {
            filter: filterParams,
            data: {
                revenue: parseFloat(stats.total_revenue),
                totalBookings: parseInt(stats.total_bookings),
                activeBuses: 0,
                occupancyRate: parseFloat(data.occupancy?.rate || 0),
                cancelRate: parseFloat(cancelRate),
                revenueChart: data.chart,
                topRoutes: data.topRoutes,
                busPerformance: data.busPerf,
            },
        };
    }
}

module.exports = new AdminService();
