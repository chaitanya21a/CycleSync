const express = require('express');
const Fine = require('../models/Fine');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/fines — user's fines
router.get('/', auth, async (req, res) => {
    try {
        const filter = { user: req.user._id };
        if (req.query.status) filter.status = req.query.status;

        const fines = await Fine.find(filter)
            .populate('ride', 'bicycleId startTime endTime duration')
            .sort({ createdAt: -1 });

        res.json(fines);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/fines/:id/pay
router.post('/:id/pay', auth, async (req, res) => {
    try {
        const fine = await Fine.findOne({ _id: req.params.id, user: req.user._id });
        if (!fine) {
            return res.status(404).json({ error: 'Fine not found' });
        }
        if (fine.status !== 'pending') {
            return res.status(400).json({ error: `Fine is already ${fine.status}` });
        }

        fine.status = 'paid';
        await fine.save();

        // Update user pending fines
        const user = await User.findById(req.user._id);
        user.pendingFines = Math.max(0, user.pendingFines - fine.amount);
        await user.save();

        res.json({ fine, message: 'Fine paid successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
