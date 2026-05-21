const mongoose = require('mongoose');

const rfidCardSchema = new mongoose.Schema({
    tagUid: { type: String, required: true, unique: true, trim: true, uppercase: true },
    studentId: { type: String, required: true, trim: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    isActive: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false },
    lastUsedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('RFIDCard', rfidCardSchema);
