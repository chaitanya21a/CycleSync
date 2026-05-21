const mongoose = require('mongoose');

const bicycleSchema = new mongoose.Schema({
    bicycleId: { type: String, required: true, unique: true },
    qrCode: { type: String, required: true, unique: true },
    status: { type: String, enum: ['available', 'in_use', 'maintenance'], default: 'available' },
    lockCommand: { type: String, enum: ['none', 'lock', 'unlock'], default: 'none' },
    lastCommandAck: {
        command: { type: String, enum: ['none', 'lock', 'unlock'], default: 'none' },
        at: { type: Date, default: null },
        ok: { type: Boolean, default: true },
    },
    condition: { type: String, enum: ['good', 'damaged', 'needs_repair'], default: 'good' },
    currentLocation: {
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 },
    },
    nearestSpot: { type: String, default: '' },
    currentRider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    currentRfidUid: { type: String, default: null, trim: true },
    rideStartedAt: { type: Date, default: null },
    deviceOnline: { type: Boolean, default: false },
    lastSync: { type: Date, default: null },
    lastUsed: { type: Date, default: Date.now },
    lastMaintenance: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Bicycle', bicycleSchema);
