const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { authenticateJWT, authorizeRole } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Locations
 *     description: Quản lý địa điểm
 */

router.get('/', locationController.getLocations);

/**
 * @swagger
 * /api/locations:
 *   post:
 *     summary: Tạo địa điểm mới (Admin)
 *     tags:
 *       - Locations
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *     responses:
 *       201:
 *         description: Thành công
 */
router.post(
  '/',
  authenticateJWT,
  authorizeRole('admin'),
  locationController.createLocation
);

/**
 * @swagger
 * /api/locations/{id}:
 *   put:
 *     summary: Cập nhật địa điểm (Admin)
 *     tags:
 *       - Locations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.put(
  '/:id',
  authenticateJWT,
  authorizeRole('admin'),
  locationController.updateLocation
);

/**
 * @swagger
 * /api/locations/{id}:
 *   delete:
 *     summary: Xóa địa điểm (Admin)
 *     tags:
 *       - Locations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.delete(
  '/:id',
  authenticateJWT,
  authorizeRole('admin'),
  locationController.deleteLocation
);

module.exports = router;
