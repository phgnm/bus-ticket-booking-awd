const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');

/**
 * @swagger
 * tags:
 *   name: Trips
 *   description: Public trip search
 */

/**
 * @swagger
 * /trips:
 *   get:
 *     summary: Search for trips
 *     tags: [Trips]
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: integer
 *         required: true
 *         description: Origin Location ID
 *       - in: query
 *         name: to
 *         schema:
 *           type: integer
 *         required: true
 *         description: Destination Location ID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Departure date (YYYY-MM-DD)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [time, price, duration]
 *           default: time
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *       - in: query
 *         name: min_price
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: bus_type
 *         schema:
 *           type: string
 *         description: Filter by bus type
 *       - in: query
 *         name: amenities
 *         schema:
 *           type: string
 *         description: Filter by amenities (comma separated or multiple)
 *     responses:
 *       200:
 *         description: List of trips
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total_trips:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       trip_id:
 *                         type: integer
 *                       departure_time:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                       route_id:
 *                         type: integer
 *                       price_base:
 *                         type: number
 *                       estimated_duration:
 *                         type: integer
 *                       distance:
 *                         type: number
 *                       bus_id:
 *                         type: integer
 *                       brand:
 *                         type: string
 *                       license_plate:
 *                         type: string
 *                       bus_type:
 *                         type: string
 *                       seat_capacity:
 *                         type: integer
 *                       amenities:
 *                         type: array
 *                         items:
 *                           type: string
 *                       images:
 *                         type: array
 *                         items:
 *                           type: string
 *                       from_location_name:
 *                         type: string
 *                       to_location_name:
 *                         type: string
 *                       available_seats:
 *                         type: integer
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Server error
 */
router.get('/', tripController.searchTrips);

module.exports = router;
