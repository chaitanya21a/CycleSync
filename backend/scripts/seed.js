require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Bicycle = require('../models/Bicycle');
const ParkingSpot = require('../models/ParkingSpot');

const PARKING_SPOTS = [
    { spotId: 'PS-001', name: 'Main Gate Parking', location: { lat: 28.5459, lng: 77.1926 }, capacity: 20, currentCount: 12, icon: '🚪' },
    { spotId: 'PS-002', name: 'Library Parking', location: { lat: 28.5465, lng: 77.1935 }, capacity: 15, currentCount: 8, icon: '📚' },
    { spotId: 'PS-003', name: 'Hostel Block A', location: { lat: 28.5472, lng: 77.1918 }, capacity: 25, currentCount: 18, icon: '🏠' },
    { spotId: 'PS-004', name: 'Cafeteria Stand', location: { lat: 28.5455, lng: 77.1942 }, capacity: 10, currentCount: 6, icon: '🍽️' },
    { spotId: 'PS-005', name: 'Sports Complex', location: { lat: 28.5480, lng: 77.1950 }, capacity: 15, currentCount: 4, icon: '⚽' },
    { spotId: 'PS-006', name: 'Academic Block', location: { lat: 28.5448, lng: 77.1930 }, capacity: 20, currentCount: 14, icon: '🎓' },
    { spotId: 'PS-007', name: 'Admin Building', location: { lat: 28.5462, lng: 77.1912 }, capacity: 10, currentCount: 3, icon: '🏢' },
    { spotId: 'PS-008', name: 'Workshop Area', location: { lat: 28.5475, lng: 77.1960 }, capacity: 12, currentCount: 7, icon: '🔧' },
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');

        // Clear existing data
        await Promise.all([
            User.deleteMany({}),
            Bicycle.deleteMany({}),
            ParkingSpot.deleteMany({}),
        ]);
        console.log('🗑️  Cleared existing data');

        // Create admin user
        const admin = await User.create({
            name: 'Admin',
            email: 'admin@cyclesync.edu',
            password: 'admin123',
            studentId: 'ADMIN001',
            phone: '+91 00000 00000',
            role: 'admin',
        });
        console.log(`👤 Admin created: ${admin.email} / admin123`);

        // Create test student
        const student = await User.create({
            name: 'Tanya Sharma',
            email: 'tanya.sharma@college.edu',
            password: 'test123',
            studentId: 'CS2024001',
            phone: '+91 98765 43210',
            role: 'user',
        });
        console.log(`👤 Test student created: ${student.email} / test123`);

        // Seed 100 bicycles
        const bicycles = [];
        for (let i = 1; i <= 100; i++) {
            const spot = PARKING_SPOTS[Math.floor(Math.random() * PARKING_SPOTS.length)];
            const status = i <= 72 ? 'available' : i <= 90 ? 'in_use' : 'maintenance';
            const conditions = ['good', 'good', 'good', 'good', 'damaged', 'needs_repair'];

            bicycles.push({
                bicycleId: `CYCLE-${String(i).padStart(3, '0')}`,
                qrCode: `CS-${String(i).padStart(3, '0')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                status,
                condition: conditions[Math.floor(Math.random() * conditions.length)],
                currentLocation: {
                    lat: spot.location.lat + (Math.random() - 0.5) * 0.002,
                    lng: spot.location.lng + (Math.random() - 0.5) * 0.002,
                },
                nearestSpot: spot.name,
                lastUsed: new Date(Date.now() - Math.random() * 86400000 * 7),
            });
        }
        await Bicycle.insertMany(bicycles);
        console.log(`🚲 ${bicycles.length} bicycles seeded`);

        // Seed parking spots
        await ParkingSpot.insertMany(PARKING_SPOTS);
        console.log(`📍 ${PARKING_SPOTS.length} parking spots seeded`);

        console.log('\n✅ Database seeded successfully!');
        console.log('---');
        console.log('Admin: admin@cyclesync.edu / admin123');
        console.log('Student: tanya.sharma@college.edu / test123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error.message);
        process.exit(1);
    }
}

seed();
