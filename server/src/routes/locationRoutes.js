const express = require('express');
// Location routes
const router = express.Router();
const locationController = require('../controllers/locationController');

/**
 * @swagger
 * tags:
 *   name: Locations
 *   description: Location search for autocomplete
 */

/**
 * @swagger
 * /locations:
 *   get:
 *     summary: Get all locations or search by keyword
 *     tags: [Locations]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Search keyword for location name
 *     responses:
 *       200:
 *         description: List of locations
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
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       type:
 *                         type: string
 *                       thumbnail:
 *                         type: string
 *       500:
 *         description: Server error
 */
router.get('/', locationController.getLocations);

module.exports = router;
