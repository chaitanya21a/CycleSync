const express = require('express');
const User = require('../models/User');
const Bicycle = require('../models/Bicycle');
const Ride = require('../models/Ride');
const Fine = require('../models/Fine');
const ParkingSpot = require('../models/ParkingSpot');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// All admin routes require auth + admin role
router.use(auth, adminOnly);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
            totalUsers,
            bannedUsers,
            totalBikes,
            availableBikes,
            inUseBikes,
            maintenanceBikes,
            activeRides,
            todayRides,
            totalFines,
            pendingFines,
        ] = await Promise.all([
            User.countDocuments({ role: 'user' }),
            User.countDocuments({ isBanned: true }),
            Bicycle.countDocuments(),
            Bicycle.countDocuments({ status: 'available' }),
            Bicycle.countDocuments({ status: 'in_use' }),
            Bicycle.countDocuments({ status: 'maintenance' }),
            Ride.countDocuments({ status: 'active' }),
            Ride.countDocuments({ startTime: { $gte: today } }),
            Fine.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
            Fine.aggregate([{ $match: { status: 'pending' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
        ]);

        res.json({
            users: { total: totalUsers, banned: bannedUsers },
            bicycles: { total: totalBikes, available: availableBikes, inUse: inUseBikes, maintenance: maintenanceBikes },
            rides: { active: activeRides, today: todayRides },
            fines: {
                total: totalFines[0]?.total || 0,
                pending: pendingFines[0]?.total || 0,
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
    try {
        const { search, banned } = req.query;
        const filter = { role: 'user' };

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { studentId: { $regex: search, $options: 'i' } },
            ];
        }
        if (banned === 'true') filter.isBanned = true;

        const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/admin/users/:id
router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });

        const rides = await Ride.find({ user: user._id }).populate('fines').sort({ startTime: -1 }).limit(20);
        const fines = await Fine.find({ user: user._id }).sort({ createdAt: -1 });

        res.json({ user, rides, fines });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/admin/users/:id/ban
router.put('/users/:id/ban', async (req, res) => {
    try {
        const { ban, reason } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.isBanned = ban;
        user.banReason = ban ? (reason || 'Banned by admin') : '';
        await user.save();

        res.json({ message: `User ${ban ? 'banned' : 'unbanned'}`, user: { name: user.name, isBanned: user.isBanned } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/admin/rides
router.get('/rides', async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) filter.status = req.query.status;

        const rides = await Ride.find(filter)
            .populate('user', 'name email studentId')
            .populate('fines')
            .sort({ startTime: -1 })
            .limit(100);
        res.json(rides);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/admin/fines
router.get('/fines', async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) filter.status = req.query.status;

        const fines = await Fine.find(filter)
            .populate('user', 'name email studentId')
            .populate('ride', 'bicycleId startTime duration')
            .sort({ createdAt: -1 })
            .limit(100);
        res.json(fines);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/admin/fines/:id
router.put('/fines/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const fine = await Fine.findById(req.params.id);
        if (!fine) return res.status(404).json({ error: 'Fine not found' });

        const oldStatus = fine.status;
        fine.status = status;
        await fine.save();

        // Update user pending fines if waived
        if (oldStatus === 'pending' && (status === 'waived' || status === 'paid')) {
            const user = await User.findById(fine.user);
            user.pendingFines = Math.max(0, user.pendingFines - fine.amount);
            await user.save();
        }

        res.json({ fine, message: `Fine ${status}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/admin/bicycles/:id
router.put('/bicycles/:id', async (req, res) => {
    try {
        const { status, condition } = req.body;
        const bicycle = await Bicycle.findOne({ bicycleId: req.params.id });
        if (!bicycle) return res.status(404).json({ error: 'Bicycle not found' });

        if (status) bicycle.status = status;
        if (condition) bicycle.condition = condition;
        if (status === 'maintenance') bicycle.lastMaintenance = new Date();
        await bicycle.save();

        res.json({ bicycle, message: 'Bicycle updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
