const express = require('express');
const ParkingSpot = require('../models/ParkingSpot');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/parking-spots
router.get('/', auth, async (req, res) => {
    try {
        const spots = await ParkingSpot.find().sort({ name: 1 });
        res.json(spots);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
