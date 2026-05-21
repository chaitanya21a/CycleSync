const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RFIDCard = require('../models/RFIDCard');
const { auth } = require('../middleware/auth');

const router = express.Router();

const buildAuthResponse = (user, token, authMethod = 'password') => ({
    token,
    authMethod,
    user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        role: user.role,
    },
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, studentId, phone } = req.body;

        // Validate college email
        const domains = (process.env.COLLEGE_EMAIL_DOMAINS || '.edu').split(',');
        const isCollegeEmail = domains.some(d => email.toLowerCase().endsWith(d.trim()));
        if (!isCollegeEmail) {
            return res.status(400).json({ error: 'Please use a valid college email address' });
        }

        // Check existing user
        const existingUser = await User.findOne({ $or: [{ email }, { studentId }] });
        if (existingUser) {
            return res.status(400).json({ error: 'Email or Student ID already registered' });
        }

        const user = await User.create({ name, email, password, studentId, phone });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE || '7d',
        });

        res.status(201).json(buildAuthResponse(user, token, 'password'));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (user.isBanned) {
            return res.status(403).json({ error: 'Account is banned', reason: user.banReason });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE || '7d',
        });

        res.json(buildAuthResponse(user, token, 'password'));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/auth/rfid
router.post('/rfid', async (req, res) => {
    try {
        const tagUid = String(req.body.tagUid || '').trim().toUpperCase();
        if (!tagUid) {
            return res.status(400).json({ error: 'RFID tag UID is required' });
        }

        let user;
        const card = await RFIDCard.findOne({ tagUid, isActive: true, isBlocked: false }).populate('user');
        if (card?.user) {
            user = card.user;
            card.lastUsedAt = new Date();
            await card.save();
        } else {
            // Backward-compatible fallback if RFID UID was directly stored on User.
            user = await User.findOne({ rfidTagId: tagUid });
        }

        if (!user) {
            return res.status(401).json({ error: 'RFID card not recognized' });
        }

        if (user.isBanned) {
            return res.status(403).json({ error: 'Account is banned', reason: user.banReason });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE || '7d',
        });

        res.json(buildAuthResponse(user, token, 'rfid'));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        user.checkDailyReset();
        await user.save();
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
