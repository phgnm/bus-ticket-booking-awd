const pool = require('../config/db');

class RouteRepository {
    async getAll() {
        const query = `
            SELECT r.*, f.name as from_name, t.name as to_name 
            FROM routes r
            JOIN locations f ON r.route_from = f.id
            JOIN locations t ON r.route_to = t.id
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    async getById(id) {
        const result = await pool.query('SELECT * FROM routes WHERE id = $1', [
            id,
        ]);
        return result.rows[0];
    }

    async createRoute(client, routeData) {
        const {
            route_from,
            route_to,
            distance,
            estimated_duration,
            price_base,
        } = routeData;
        const result = await client.query(
            `INSERT INTO routes (route_from, route_to, distance, estimated_duration, price_base)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [route_from, route_to, distance, estimated_duration, price_base],
        );
        return result.rows[0];
    }

    async addRoutePoints(client, routeId, points) {
        for (const p of points) {
            await client.query(
                `INSERT INTO route_points (route_id, point_id, type, order_index, time_offset) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [routeId, p.point_id, p.type, p.order_index, p.time_offset],
            );
        }
    }
}

module.exports = new RouteRepository();
