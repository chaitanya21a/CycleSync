const mongoose = require('mongoose');

const bicycleSchema = new mongoose.Schema({
    bicycleId: { type: String, required: true, unique: true },
    qrCode: { type: String, required: true, unique: true },
    status: { type: String, enum: ['available', 'in_use', 'maintenance'], default: 'available' },
    condition: { type: String, enum: ['good', 'damaged', 'needs_repair'], default: 'good' },
    currentLocation: {
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 },
    },
    nearestSpot: { type: String, default: '' },
    currentRider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    lastUsed: { type: Date, default: Date.now },
    lastMaintenance: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Bicycle', bicycleSchema);
