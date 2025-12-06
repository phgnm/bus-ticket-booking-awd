const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

router.get('/lookup', bookingController.lookupBooking);

module.exports = router;