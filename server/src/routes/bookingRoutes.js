const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Booking management
 */

/**
 * @swagger
 * /bookings/lookup:
 *   get:
 *     summary: Lookup booking by code and email
 *     tags: [Bookings]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: Booking code (e.g., VEX-ABCDE)
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *           format: email
 *         required: true
 *         description: Passenger email
 *     responses:
 *       200:
 *         description: Booking details retrieved successfully
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
 *                     booking_code:
 *                       type: string
 *                     passenger_name:
 *                       type: string
 *                     seats:
 *                       type: array
 *                       items:
 *                         type: string
 *                     total_price:
 *                       type: number
 *       400:
 *         description: Missing code or email
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.get('/lookup', bookingController.lookupBooking);

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trip_id
 *               - seats
 *               - passenger_info
 *             properties:
 *               trip_id:
 *                 type: integer
 *               seats:
 *                 type: array
 *                 items:
 *                   type: string
 *               passenger_info:
 *                 type: object
 *                 required:
 *                   - name
 *                   - phone
 *                   - email
 *                 properties:
 *                   name:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   email:
 *                     type: string
 *                     format: email
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 msg:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     booking_code:
 *                       type: string
 *                     seats:
 *                       type: array
 *                       items:
 *                         type: string
 *                     total_price:
 *                       type: number
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Trip not found
 *       409:
 *         description: Seat already booked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                 unavailable_seats:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Server error
 */
router.post('/', authMiddleware.optionalAuthenticateJWT, bookingController.createBooking);

/**
 * @swagger
 * /bookings/payment-webhook:
 *   post:
 *     summary: Receive payment webhook from PayOS
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               desc:
 *                 type: string
 *               data:
 *                 type: object
 *                 properties:
 *                   orderCode:
 *                     type: integer
 *                   amount:
 *                     type: integer
 *                   description:
 *                     type: string
 *                   accountNumber:
 *                     type: string
 *                   reference:
 *                     type: string
 *                   transactionDateTime:
 *                     type: string
 *                   currency:
 *                     type: string
 *                   paymentLinkId:
 *                     type: string
 *                   code:
 *                     type: string
 *                   desc:
 *                     type: string
 *                   counterAccountBankId:
 *                     type: string
 *                   counterAccountBankName:
 *                     type: string
 *                   counterAccountName:
 *                     type: string
 *                   counterAccountNumber:
 *                     type: string
 *                   virtualAccountName:
 *                     type: string
 *                   virtualAccountNumber:
 *                     type: string
 *               signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Webhook received successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       500:
 *         description: Server error
 */
router.post('/payment-webhook', paymentController.receiveWebHook);

/**
 * @swagger
 * /bookings/my-bookings:
 *   get:
 *     summary: Get booking history of the current user
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookings
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
 *                     properties:
 *                       booking_id:
 *                         type: integer
 *                       booking_code:
 *                         type: string
 *                       trip_id:
 *                         type: integer
 *                       route_name:
 *                         type: string
 *                       departure_time:
 *                         type: string
 *                         format: date-time
 *                       seats:
 *                         type: array
 *                         items:
 *                           type: string
 *                       total_price:
 *                         type: number
 *                       status:
 *                         type: string
 *                         enum: [PENDING, CONFIRMED, CANCELLED]
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/my-bookings', authMiddleware.authenticateJWT, bookingController.getMyBookings);

/**
 * @swagger
 * /bookings/cancel/{id}:
 *   post:
 *     summary: Cancel a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 msg:
 *                   type: string
 *       400:
 *         description: Cannot cancel booking (e.g., too late or already cancelled)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not your booking)
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.post('/cancel/:id', authMiddleware.authenticateJWT, bookingController.cancelBooking);

/**
 * @swagger
 * /bookings/change-seat/{id}:
 *   put:
 *     summary: Change seats for a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newSeats
 *             properties:
 *               newSeats:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of new seat names
 *     responses:
 *       200:
 *         description: Seats changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 msg:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     old_seats:
 *                       type: array
 *                       items:
 *                         type: string
 *                     new_seats:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Invalid seats or validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.put('/change-seat/:id', authMiddleware.authenticateJWT, bookingController.changeSeat);
module.exports = router;
