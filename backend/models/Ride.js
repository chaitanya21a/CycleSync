const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bicycle: { type: mongoose.Schema.Types.ObjectId, ref: 'Bicycle', required: true },
    bicycleId: { type: String, required: true },
    startTime: { type: Date, required: true, default: Date.now },
    endTime: { type: Date, default: null },
    duration: { type: Number, default: 0 },
    startLocation: { type: String, default: '' },
    endLocation: { type: String, default: '' },
    status: { type: String, enum: ['active', 'completed', 'force_ended'], default: 'active' },
    fines: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Fine' }],
}, { timestamps: true });

module.exports = mongoose.model('Ride', rideSchema);
