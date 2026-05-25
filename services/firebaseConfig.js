import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyDzIsx0GrA3L9E6oVnO5IyDr7rOM0nXEXY',
  authDomain: 'cycle-sync-project.firebaseapp.com',
  databaseURL: 'https://cycle-sync-project-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'cycle-sync-project',
  storageBucket: 'cycle-sync-project.firebasestorage.app',
  messagingSenderId: '134000278106',
  appId: '1:134000278106:web:0394ecdf632ebab9597663',
  measurementId: 'G-ZBL64TMZET',
};

// Guard against double-initialisation (hot reload, test environments)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db   = getDatabase(app);
