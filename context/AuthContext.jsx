import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, db } from '../services/firebaseConfig';
import {
  getStudentByEmail,
  checkAndResetDailyUsage,
  setStudentRole,
} from '../services/firebaseService';
import { getFriendlyAuthError } from '../services/authErrors';

const AuthContext = createContext({});

/** Admin if email contains "admin" or DB profile has role "admin". */
export function resolveRole(email, profileRole) {
  const normalized = (email || '').toLowerCase();
  if (profileRole === 'admin' || normalized.includes('admin')) return 'admin';
  return 'user';
}

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const result = await getStudentByEmail(firebaseUser.email);
        if (result) {
          const { rfidUid, student } = result;
          const dailyUsage = await checkAndResetDailyUsage(rfidUid, student.dailyUsage);
          const role = resolveRole(firebaseUser.email, student.role);
          if (role === 'admin' && student.role !== 'admin') {
            await setStudentRole(rfidUid, 'admin');
          }
          setUser({ ...student, rfidUid, dailyUsage, firebaseUid: firebaseUser.uid, role });
        } else {
          const role = resolveRole(firebaseUser.email);
          setUser({ email: firebaseUser.email, firebaseUid: firebaseUser.uid, role });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const signup = async ({ name, email, studentId, phone, password }) => {
    const domain = email.split('@')[1] ?? '';
    if (!domain.endsWith('.edu') && !domain.endsWith('.ac.in')) {
      throw new Error('Please use your college email address');
    }
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      const profile = {
        name, email, studentId, phone,
        role: resolveRole(email),
        isAllowed: true,
        hasFine: false,
        totalRides: 0,
        violationCount: 0,
        isBanned: false,
        dailyUsage: { date: '', minutes: 0 },
      };
      await set(ref(db, `students/${firebaseUser.uid}`), profile);
    } catch (error) {
      throw new Error(getFriendlyAuthError(error));
    }
  };

  const login = async (email, password) => {
    try {
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
      const role = resolveRole(firebaseUser.email);
      return { role };
    } catch (error) {
      throw new Error(getFriendlyAuthError(error));
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
