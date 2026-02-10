const mongoose = require('mongoose');

const parkingSpotSchema = new mongoose.Schema({
    spotId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
    },
    capacity: { type: Number, required: true },
    currentCount: { type: Number, default: 0 },
    icon: { type: String, default: '📍' },
}, { timestamps: true });

module.exports = mongoose.model('ParkingSpot', parkingSpotSchema);
