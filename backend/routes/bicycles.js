const express = require('express');
const Bicycle = require('../models/Bicycle');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/bicycles — list all (optional status filter)
router.get('/', auth, async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) filter.status = req.query.status;

        const bicycles = await Bicycle.find(filter)
            .populate('currentRider', 'name email')
            .sort({ bicycleId: 1 });

        res.json(bicycles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/bicycles/stats — quick counts
router.get('/stats', auth, async (req, res) => {
    try {
        const [available, inUse, maintenance, total] = await Promise.all([
            Bicycle.countDocuments({ status: 'available' }),
            Bicycle.countDocuments({ status: 'in_use' }),
            Bicycle.countDocuments({ status: 'maintenance' }),
            Bicycle.countDocuments(),
        ]);

        res.json({ available, inUse, maintenance, total });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/bicycles/:id
router.get('/:id', auth, async (req, res) => {
    try {
        const bicycle = await Bicycle.findOne({ bicycleId: req.params.id })
            .populate('currentRider', 'name email');
        if (!bicycle) {
            return res.status(404).json({ error: 'Bicycle not found' });
        }
        res.json(bicycle);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
