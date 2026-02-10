// Generate 100 bicycles with mock data
const generateBicycles = () => {
    const statuses = ['available', 'in_use', 'maintenance'];
    const conditions = ['good', 'good', 'good', 'good', 'damaged', 'needs_repair'];

    // Campus locations around IIT Delhi (example coordinates)
    const parkingSpots = [
        { name: 'Main Gate Parking', lat: 28.5459, lng: 77.1926 },
        { name: 'Library Parking', lat: 28.5465, lng: 77.1935 },
        { name: 'Hostel Block A', lat: 28.5472, lng: 77.1918 },
        { name: 'Cafeteria Stand', lat: 28.5455, lng: 77.1942 },
        { name: 'Sports Complex', lat: 28.5480, lng: 77.1950 },
        { name: 'Academic Block', lat: 28.5448, lng: 77.1930 },
        { name: 'Admin Building', lat: 28.5462, lng: 77.1912 },
        { name: 'Workshop Area', lat: 28.5475, lng: 77.1960 },
    ];

    const bicycles = [];
    for (let i = 1; i <= 100; i++) {
        const spot = parkingSpots[Math.floor(Math.random() * parkingSpots.length)];
        const status = i <= 72 ? 'available' : i <= 90 ? 'in_use' : 'maintenance';
        bicycles.push({
            id: `CYCLE-${String(i).padStart(3, '0')}`,
            qrCode: `CS-${String(i).padStart(3, '0')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            status,
            condition: conditions[Math.floor(Math.random() * conditions.length)],
            currentLocation: {
                lat: spot.lat + (Math.random() - 0.5) * 0.002,
                lng: spot.lng + (Math.random() - 0.5) * 0.002,
            },
            nearestSpot: spot.name,
            lastUsed: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
            batteryLevel: Math.floor(Math.random() * 40) + 60,
        });
    }
    return bicycles;
};

export const BICYCLES = generateBicycles();

export const PARKING_SPOTS = [
    {
        id: 'PS-001',
        name: 'Institute Main Gate',
        location: { lat: 28.5459, lng: 77.1926 },
        capacity: 20,
        currentCount: 12,
        icon: '🚪',
    },
    {
        id: 'PS-002',
        name: 'Mega Girls Hostel',
        location: { lat: 28.5465, lng: 77.1935 },
        capacity: 15,
        currentCount: 8,
        icon: '📚',
    },
    {
        id: 'PS-003',
        name: 'Saraswati Girls Hostel',
        location: { lat: 28.5472, lng: 77.1918 },
        capacity: 25,
        currentCount: 18,
        icon: '🏠',
    },
    {
        id: 'PS-004',
        name: 'Mega Boys Hostel',
        location: { lat: 28.5455, lng: 77.1942 },
        capacity: 10,
        currentCount: 6,
        icon: '🍽️',
    },
    {
        id: 'PS-005',
        name: 'Krishna Boys Hostel',
        location: { lat: 28.5480, lng: 77.1950 },
        capacity: 15,
        currentCount: 4,
        icon: '⚽',
    },
    {
        id: 'PS-006',
        name: 'Civil Engineering Department',
        location: { lat: 28.5448, lng: 77.1930 },
        capacity: 20,
        currentCount: 14,
        icon: '🎓',
    },
    {
        id: 'PS-007',
        name: 'Chemical Engineering Department',
        location: { lat: 28.5462, lng: 77.1912 },
        capacity: 10,
        currentCount: 3,
        icon: '🏢',
    },
    {
        id: 'PS-008',
        name: 'IT Park',
        location: { lat: 28.5475, lng: 77.1960 },
        capacity: 12,
        currentCount: 7,
        icon: '🔧',
    },
];

export const RIDE_HISTORY = [
    {
        id: 'R-001',
        bicycleId: 'CYCLE-023',
        startTime: '2026-02-10T09:30:00',
        endTime: '2026-02-10T09:48:00',
        duration: 18,
        startLocation: 'Institute Main Gate',
        endLocation: 'Mega Girls Hostel',
        status: 'completed',
        fine: null,
    },
    {
        id: 'R-002',
        bicycleId: 'CYCLE-045',
        startTime: '2026-02-09T14:15:00',
        endTime: '2026-02-09T14:40:00',
        duration: 25,
        startLocation: 'Saraswati Girls Hostel',
        endLocation: 'Mega Boys Hostel',
        status: 'completed',
        fine: {
            reason: 'overtime',
            amount: 50,
            status: 'pending',
        },
    },
    {
        id: 'R-003',
        bicycleId: 'CYCLE-012',
        startTime: '2026-02-08T11:00:00',
        endTime: '2026-02-08T11:15:00',
        duration: 15,
        startLocation: 'Civil Engineering Department',
        endLocation: 'Krishna Boys Hostel',
        status: 'completed',
        fine: null,
    },
    {
        id: 'R-004',
        bicycleId: 'CYCLE-078',
        startTime: '2026-02-07T16:00:00',
        endTime: '2026-02-07T16:22:00',
        duration: 22,
        startLocation: 'Krishna Boys Hostel',
        endLocation: 'Chemical Engineering Department',
        status: 'completed',
        fine: {
            reason: 'wrong_parking',
            amount: 100,
            status: 'paid',
        },
    },
    {
        id: 'R-005',
        bicycleId: 'CYCLE-056',
        startTime: '2026-02-06T08:45:00',
        endTime: '2026-02-06T09:00:00',
        duration: 15,
        startLocation: 'Mega Girls Hostel',
        endLocation: 'Saraswati Girls Hostel',
        status: 'completed',
        fine: null,
    },
    {
        id: 'R-006',
        bicycleId: 'CYCLE-034',
        startTime: '2026-02-05T13:20:00',
        endTime: '2026-02-05T13:35:00',
        duration: 15,
        startLocation: 'IT Park',
        endLocation: 'Institute Main Gate',
        status: 'completed',
        fine: null,
    },
    {
        id: 'R-007',
        bicycleId: 'CYCLE-067',
        startTime: '2026-02-04T10:10:00',
        endTime: '2026-02-04T10:28:00',
        duration: 18,
        startLocation: 'Mega Boys Hostel',
        endLocation: 'Civil Engineering Department',
        status: 'completed',
        fine: null,
    },
];

export const USER_PROFILE = {
    name: 'Chaitanya Arora',
    email: 'chaitanyaa.ic.22@nitj.ac.in',
    studentId: '22106031',
    phone: '+91 9530643673',
    totalRides: 24,
    totalDistance: '38.5 km',
    totalFines: 150,
    pendingFines: 50,
    dailyUsage: 12, // minutes used today
    maxDailyUsage: 60,
    memberSince: '2025-08-15',
    isBanned: false,
    avatar: null,
};

export const STATS = {
    availableBikes: 72,
    totalBikes: 100,
    inUseBikes: 18,
    maintenanceBikes: 10,
    activeRiders: 18,
    todayRides: 156,
};
