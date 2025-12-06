const express = require('express');
const router = express.Router();
const seatController = require('../controllers/seatController');

router.post('/:tripId/lock', seatController.lockSeat);
router.post('/:tripId/unlock', seatController.unlockSeat);

module.exports = router;
