const express = require('express');
const router = express.Router();
const {
    authenticateJWT,
    authorizeRole,
} = require('../middlewares/authMiddleware');
const adminController = require('../controllers/adminController');

router.use(authenticateJWT, authorizeRole('admin'));

// API for admin widget
router.get(
    '/admin/stats',
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

// == BUSES CRUD ==
router.get('/admin/buses', adminController.getBuses);
router.post('/admin/buses', adminController.createBus);
router.delete('/admin/buses/:id', adminController.deleteBus);

// == ROUTES CRUD ==
router.get('/admin/routes', adminController.getRoutes);
router.post('/admin/routes', adminController.createRoute);

// == TRIPS CRUD ==
router.post('/admin/trips', adminController.createTrip);

module.exports = router;
