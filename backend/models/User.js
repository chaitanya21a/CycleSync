const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    studentId: { type: String, required: true, unique: true, trim: true },
    phone: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    totalRides: { type: Number, default: 0 },
    totalFines: { type: Number, default: 0 },
    pendingFines: { type: Number, default: 0 },
    violationCount: { type: Number, default: 0 },
    dailyUsage: {
        date: { type: String, default: '' },
        minutes: { type: Number, default: 0 },
    },
    maxDailyUsage: { type: Number, default: 60 },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: '' },
    avatar: { type: String, default: null },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Reset daily usage if date changed
userSchema.methods.checkDailyReset = function () {
    const today = new Date().toISOString().split('T')[0];
    if (this.dailyUsage.date !== today) {
        this.dailyUsage = { date: today, minutes: 0 };
    }
};

module.exports = mongoose.model('User', userSchema);
