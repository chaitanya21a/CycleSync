const mongoose = require('mongoose');

const fineSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true },
    reason: {
        type: String,
        enum: ['wrong_parking', 'overtime', 'damage', 'out_of_campus'],
        required: true,
    },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid', 'waived'], default: 'pending' },
    description: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Fine', fineSchema);
