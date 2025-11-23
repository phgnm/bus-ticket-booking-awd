const express = require('express');
const router = express.Router();
const {
    authenticateJWT,
    authorizeRole,
} = require('../middlewares/authMiddleware');

// API for admin widget
router.get(
    '/admin/stats',
    authenticateJWT,
    authorizeRole('admin'),
    (req, res) => {
        res.json({
            success: true,
            data: {
                revenue: 123456789,
                totalBookings: 9876,
                activeBuses: 123,
            },
        });
    },
);

// API for user widget
router.get(
    '/user/history',
    authenticateJWT,
    authorizeRole(['user', 'admin']),
    (req, res) => {
        res.json({
            success: true,
            data: [
                {
                    trip: 'HCM - Da Lat',
                    date: '2023-11-20',
                    status: 'Completed',
                },
                {
                    trip: 'HCM - Vung Tau',
                    date: '2023-12-01',
                    status: 'Upcoming',
                },
            ],
        });
    },
);

module.exports = router;
