import React, { createContext, useContext, useState, useEffect } from 'react';
import { USER_PROFILE } from '../constants/mockData';
import api from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeRide, setActiveRide] = useState(null);

    useEffect(() => {
        // Simulate checking for stored auth token
        setTimeout(() => {
            setIsLoading(false);
        }, 1500);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.login(email, password);
            api.setToken(response.token);
            setUser(response.user);
            return { success: true, role: response.user.role };
        } catch (error) {
            // Fallback keeps current demo behavior if API is unreachable.
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (email && password) {
                        const isAdminUser = email.toLowerCase().includes('admin');
                        const userData = {
                            ...USER_PROFILE,
                            email,
                            role: isAdminUser ? 'admin' : 'user',
                            name: isAdminUser ? 'Admin' : USER_PROFILE.name,
                        };
                        setUser(userData);
                        resolve({ success: true, role: userData.role });
                    } else {
                        reject(new Error('Invalid credentials'));
                    }
                }, 1000);
            });
        }
    };

    const loginWithRfid = async (tagUid) => {
        if (!tagUid) {
            throw new Error('RFID tag UID is required');
        }
        try {
            const response = await api.loginWithRfid(tagUid);
            api.setToken(response.token);
            setUser(response.user);
            return { success: true, role: response.user.role };
        } catch (error) {
            throw new Error(error.message || 'RFID authentication failed');
        }
    };

    const signup = async (userData) => {
        // Mock signup
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const emailDomain = userData.email.split('@')[1];
                if (!emailDomain || !emailDomain.endsWith('.edu') && !emailDomain.endsWith('.ac.in')) {
                    reject(new Error('Please use your college email address'));
                    return;
                }
                setUser({
                    ...USER_PROFILE,
                    ...userData,
                    totalRides: 0,
                    totalFines: 0,
                    pendingFines: 0,
                    dailyUsage: 0,
                });
                resolve({ success: true });
            }, 1000);
        });
    };

    const logout = () => {
        setUser(null);
        setActiveRide(null);
    };

    const startRide = (bicycleId) => {
        const ride = {
            id: `R-${Date.now()}`,
            bicycleId,
            startTime: new Date().toISOString(),
            duration: 0,
            status: 'active',
        };
        setActiveRide(ride);
        return ride;
    };

    const endRide = (endLocation, locationData) => {
        if (activeRide) {
            const endTime = new Date();
            const startTime = new Date(activeRide.startTime);
            const duration = Math.round((endTime - startTime) / 60000);
            const completedRide = {
                ...activeRide,
                endTime: endTime.toISOString(),
                endLocation,
                duration,
                status: 'completed',
                location: locationData || null,
            };
            setActiveRide(null);
            return completedRide;
        }
        return null;
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                activeRide,
                login,
                loginWithRfid,
                signup,
                logout,
                startRide,
                endRide,
                setUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
