const express = require('express');
const Ride = require('../models/Ride');
const Bicycle = require('../models/Bicycle');
const Fine = require('../models/Fine');
const User = require('../models/User');
const ParkingSpot = require('../models/ParkingSpot');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Helper: calculate distance between two points (km)
function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// POST /api/rides/start
router.post('/start', auth, async (req, res) => {
    try {
        const { qrCode, bicycleId } = req.body;
        const user = await User.findById(req.user._id);

        // Check if banned
        if (user.isBanned) {
            return res.status(403).json({ error: 'Your account is banned', reason: user.banReason });
        }

        // Check no active ride
        const activeRide = await Ride.findOne({ user: user._id, status: 'active' });
        if (activeRide) {
            return res.status(400).json({ error: 'You already have an active ride' });
        }

        // Check daily limit
        user.checkDailyReset();
        if (user.dailyUsage.minutes >= user.maxDailyUsage) {
            return res.status(400).json({
                error: `Daily limit reached (${user.maxDailyUsage} min). Try again tomorrow.`,
            });
        }

        // Find bicycle
        const query = qrCode ? { qrCode } : { bicycleId };
        const bicycle = await Bicycle.findOne(query);
        if (!bicycle) {
            return res.status(404).json({ error: 'Bicycle not found' });
        }
        if (bicycle.status !== 'available') {
            return res.status(400).json({ error: `Bicycle is currently ${bicycle.status}` });
        }

        // Start ride
        const ride = await Ride.create({
            user: user._id,
            bicycle: bicycle._id,
            bicycleId: bicycle.bicycleId,
            startTime: new Date(),
            startLocation: bicycle.nearestSpot || 'Unknown',
        });

        // Update bicycle
        bicycle.status = 'in_use';
        bicycle.currentRider = user._id;
        await bicycle.save();

        await user.save();

        res.status(201).json({
            ride,
            bicycle: { bicycleId: bicycle.bicycleId, qrCode: bicycle.qrCode },
            remainingMinutes: user.maxDailyUsage - user.dailyUsage.minutes,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/rides/end
router.post('/end', auth, async (req, res) => {
    try {
        const { endLocation, lat, lng } = req.body;
        const user = await User.findById(req.user._id);

        const ride = await Ride.findOne({ user: user._id, status: 'active' }).populate('bicycle');
        if (!ride) {
            return res.status(400).json({ error: 'No active ride found' });
        }

        // Calculate duration
        const endTime = new Date();
        const duration = Math.ceil((endTime - ride.startTime) / 60000);

        ride.endTime = endTime;
        ride.duration = duration;
        ride.endLocation = endLocation || 'Unknown';
        ride.status = 'completed';

        const finesCreated = [];

        // Check overtime (> 20 min)
        if (duration > 20) {
            const fine = await Fine.create({
                user: user._id,
                ride: ride._id,
                reason: 'overtime',
                amount: 50,
                description: `Ride exceeded 20 min limit (${duration} min)`,
            });
            finesCreated.push(fine);
            ride.fines.push(fine._id);
            user.totalFines += 50;
            user.pendingFines += 50;
            user.violationCount += 1;
        }

        // Check wrong parking (> 200m from nearest spot)
        if (lat && lng) {
            const spots = await ParkingSpot.find();
            const nearSpot = spots.some(s => getDistance(lat, lng, s.location.lat, s.location.lng) < 0.2);
            if (!nearSpot) {
                const fine = await Fine.create({
                    user: user._id,
                    ride: ride._id,
                    reason: 'wrong_parking',
                    amount: 100,
                    description: 'Bicycle not parked at a designated spot',
                });
                finesCreated.push(fine);
                ride.fines.push(fine._id);
                user.totalFines += 100;
                user.pendingFines += 100;
                user.violationCount += 1;
            }
        }

        // Update daily usage
        user.checkDailyReset();
        user.dailyUsage.minutes += duration;
        user.totalRides += 1;

        // Auto-ban if too many violations
        if (user.violationCount >= 5 && !user.isBanned) {
            user.isBanned = true;
            user.banReason = 'Too many violations (5+)';
        }

        await ride.save();

        // Release bicycle
        const bicycle = await Bicycle.findById(ride.bicycle._id || ride.bicycle);
        bicycle.status = 'available';
        bicycle.currentRider = null;
        bicycle.lastUsed = endTime;
        if (lat && lng) {
            bicycle.currentLocation = { lat, lng };
        }
        await bicycle.save();

        await user.save();

        res.json({
            ride,
            duration,
            fines: finesCreated,
            dailyUsageMinutes: user.dailyUsage.minutes,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/rides/active
router.get('/active', auth, async (req, res) => {
    try {
        const ride = await Ride.findOne({ user: req.user._id, status: 'active' })
            .populate('bicycle', 'bicycleId qrCode currentLocation nearestSpot');
        res.json(ride || null);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/rides/history
router.get('/history', auth, async (req, res) => {
    try {
        const rides = await Ride.find({ user: req.user._id, status: { $ne: 'active' } })
            .populate('fines')
            .sort({ startTime: -1 })
            .limit(50);
        res.json(rides);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
