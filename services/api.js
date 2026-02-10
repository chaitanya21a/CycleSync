// API service — currently uses mock data, will connect to backend later
const API_BASE = 'http://localhost:5000/api';

class ApiService {
    constructor() {
        this.token = null;
    }

    setToken(token) {
        this.token = token;
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(this.token && { Authorization: `Bearer ${this.token}` }),
            ...options.headers,
        };

        try {
            const response = await fetch(url, { ...options, headers });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Request failed');
            return data;
        } catch (error) {
            console.warn('API request failed, using mock data:', error.message);
            throw error;
        }
    }

    // Auth
    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    async signup(userData) {
        return this.request('/auth/signup', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    // Bicycles
    async getBicycles() {
        return this.request('/bicycles');
    }

    async getBicycle(id) {
        return this.request(`/bicycles/${id}`);
    }

    // Rides
    async startRide(qrCode) {
        return this.request('/rides/start', {
            method: 'POST',
            body: JSON.stringify({ qrCode }),
        });
    }

    async endRide(rideId, endLocation) {
        return this.request('/rides/end', {
            method: 'POST',
            body: JSON.stringify({ rideId, endLocation }),
        });
    }

    async getActiveRide() {
        return this.request('/rides/active');
    }

    async getRideHistory() {
        return this.request('/rides/history');
    }

    // Fines
    async getFines() {
        return this.request('/fines');
    }

    // Parking Spots
    async getParkingSpots() {
        return this.request('/parking-spots');
    }
}

export default new ApiService();
