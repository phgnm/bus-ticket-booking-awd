const express = require('express');
const router = express.Router();
const {
    authenticateJWT,
    authorizeRole,
} = require('../middlewares/authMiddleware');
const adminController = require('../controllers/adminController');

router.use(authenticateJWT, authorizeRole('admin'));

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management (Buses, Routes, Trips)
 */

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     revenue:
 *                       type: number
 *                     totalBookings:
 *                       type: number
 *                     activeBuses:
 *                       type: number
 */
// API for admin widget
router.get('/admin/stats', (req, res) => {
    res.json({
        success: true,
        data: {
            revenue: 123456789,
            totalBookings: 9876,
            activeBuses: 123,
        },
    });
});

/**
 * @swagger
 * /admin/buses:
 *   get:
 *     summary: Get all buses
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of buses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/admin/buses', adminController.getBuses);

/**
 * @swagger
 * /admin/buses:
 *   post:
 *     summary: Create a new bus
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - license_plate
 *               - brand
 *               - seat_capacity
 *               - type
 *               - seat_layout
 *               - amenities
 *               - images
 *             properties:
 *               license_plate:
 *                 type: string
 *               brand:
 *                 type: string
 *               seat_capacity:
 *                 type: integer
 *               type:
 *                 type: string
 *               seat_layout:
 *                 type: object
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Bus created successfully
 *       400:
 *         description: License plate already exists
 *       500:
 *         description: Server error
 */
router.post('/admin/buses', adminController.createBus);

/**
 * @swagger
 * /admin/buses/{id}:
 *   delete:
 *     summary: Delete a bus
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Bus ID
 *     responses:
 *       200:
 *         description: Bus deleted successfully
 *       400:
 *         description: Cannot delete bus with active trips
 *       500:
 *         description: Server error
 */
router.delete('/admin/buses/:id', adminController.deleteBus);

/**
 * @swagger
 * /admin/routes:
 *   get:
 *     summary: Get all routes
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of routes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/admin/routes', adminController.getRoutes);

/**
 * @swagger
 * /admin/routes:
 *   post:
 *     summary: Create a new route
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - route_from
 *               - route_to
 *               - distance
 *               - estimated_duration
 *               - price_base
 *             properties:
 *               route_from:
 *                 type: integer
 *                 description: Location ID for start point
 *               route_to:
 *                 type: integer
 *                 description: Location ID for end point
 *               distance:
 *                 type: number
 *               estimated_duration:
 *                 type: integer
 *                 description: Duration in minutes
 *               price_base:
 *                 type: number
 *               points:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     point_id:
 *                       type: integer
 *                     type:
 *                       type: string
 *                       enum: [PICKUP, DROPOFF]
 *                     order_index:
 *                       type: integer
 *                     time_offset:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Route created successfully
 *       500:
 *         description: Server error
 */
router.post('/admin/routes', adminController.createRoute);

/**
 * @swagger
 * /admin/trips:
 *   post:
 *     summary: Create a new trip
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - route_id
 *               - bus_id
 *               - departure_time
 *             properties:
 *               route_id:
 *                 type: integer
 *               bus_id:
 *                 type: integer
 *               departure_time:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Trip created successfully
 *       404:
 *         description: Route not found
 *       409:
 *         description: Bus is busy in this time frame
 *       500:
 *         description: Server error
 */
router.post('/admin/trips', adminController.createTrip);

module.exports = router;
