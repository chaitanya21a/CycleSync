require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB Atlas
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Serve admin dashboard static files
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bicycles', require('./routes/bicycles'));
app.use('/api/rides', require('./routes/rides'));
app.use('/api/fines', require('./routes/fines'));
app.use('/api/parking-spots', require('./routes/parkingSpots'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 CycleSync API running on http://localhost:${PORT}`);
    console.log(`📊 Admin Dashboard at http://localhost:${PORT}/admin`);
});
