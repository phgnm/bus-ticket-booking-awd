const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const paymentController = require('../controllers/paymentController');

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
router.post('/', bookingController.createBooking);

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

const authMiddleware = require('../middlewares/authMiddleware');

router.get('/my-bookings', authMiddleware.authenticateJWT, bookingController.getMyBookings);

router.post('/cancel/:id', authMiddleware.authenticateJWT, bookingController.cancelBooking);
module.exports = router;
