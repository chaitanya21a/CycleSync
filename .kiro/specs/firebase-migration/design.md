# Design Document — Firebase Migration

## Overview

This migration replaces the CycleSync Express/MongoDB backend with a fully serverless architecture. The React Native (Expo) app communicates directly with Firebase using the Firebase JS SDK. Firebase Authentication handles identity, and Firebase Realtime Database is the sole data store. The `backend/` directory is deleted entirely. The Arduino hardware (ESP32 + FirebaseESP32 library) already writes directly to Firebase and is unchanged.

---

## Architecture

### Before (Current)

```
React Native App
      │
      │  REST API (HTTP/JWT)
      ▼
Express Server (Node.js)
      │
      │  Mongoose ODM
      ▼
MongoDB Atlas
```

### After (Target)

```
React Native App
      │
      ├── Firebase Auth SDK  ──►  Firebase Authentication
      │
      └── Firebase RTDB SDK  ──►  Firebase Realtime Database
                                          ▲
                                          │  FirebaseESP32 library
                                    Arduino (ESP32)
                                    [no changes needed]
```

The app is the only client. There is no server process to run, no JWT to manage, and no Mongoose models. All data access goes through `services/firebaseService.js`, which wraps the Firebase Realtime Database SDK. All auth state flows through `context/AuthContext.jsx`, which wraps the Firebase Auth SDK.

---

## Components and Interfaces

### 1. `services/firebaseConfig.js` — Firebase Initialisation

Single module that initialises the Firebase app once and exports the `auth` and `db` instances used everywhere else.

```javascript
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: '...',
  authDomain: '...',
  databaseURL: '...',
  projectId: '...',
  storageBucket: '...',
  messagingSenderId: '...',
  appId: '...',
};

// Guard against double-initialisation (hot reload, test environments)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db   = getDatabase(app);
```

**Validates: Requirements 1.1, 1.2, 1.3**

---

### 2. `services/firebaseService.js` — Database Service Layer

Replaces `services/api.js`. All Firebase Realtime Database reads and writes live here. Components never import from `firebase/database` directly — they call these functions.

#### Exported functions

| Function | Description |
|---|---|
| `getStudentByEmail(email)` | Query `students` node for record matching `email`; returns `{ rfidUid, student }` or `null` |
| `getRideHistory(rfidUid)` | Read `usage_logs/{rfidUid}/history`; returns array of `{ sessionId, ...session }` |
| `getActiveSession(rfidUid)` | Read `last_session_id`, then the session; returns session object or `null` |
| `endRideSession(rfidUid, sessionId, endTime, durationMinutes)` | Multi-path update: writes `endTime`/`durationMinutes`, updates `dailyUsage`, sets `hasFine`/`isBanned` if thresholds met |
| `getAllStudents()` | Read entire `students` node; returns array of `{ rfidUid, ...student }` |
| `banStudent(rfidUid)` | Set `isBanned: true`, `isAllowed: false` |
| `unbanStudent(rfidUid)` | Set `isBanned: false`, `isAllowed: true` |
| `assignRfidToStudent(oldKey, newRfidUid, studentData)` | Write student under new key, remove old key if different |
| `getAllRideSessions()` | Read entire `usage_logs` node; returns flat array of sessions with `rfidUid` and `sessionId` |
| `clearStudentFine(rfidUid)` | Set `hasFine: false` |
| `checkAndResetDailyUsage(rfidUid, dailyUsage)` | If `dailyUsage.date !== today`, write `{ date: today, minutes: 0 }` |

#### Implementation sketch

```javascript
import { db } from './firebaseConfig';
import {
  ref, get, update, remove, query, orderByChild, equalTo
} from 'firebase/database';

const today = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

// ── Student reads ──────────────────────────────────────────────────────────

export async function getStudentByEmail(email) {
  const q = query(ref(db, 'students'), orderByChild('email'), equalTo(email));
  const snap = await get(q);
  if (!snap.exists()) return null;
  const entries = Object.entries(snap.val());
  const [rfidUid, student] = entries[0];
  return { rfidUid, student };
}

export async function getAllStudents() {
  const snap = await get(ref(db, 'students'));
  if (!snap.exists()) return [];
  return Object.entries(snap.val()).map(([rfidUid, student]) => ({ rfidUid, ...student }));
}

// ── Ride history ───────────────────────────────────────────────────────────

export async function getRideHistory(rfidUid) {
  const snap = await get(ref(db, `usage_logs/${rfidUid}/history`));
  if (!snap.exists()) return [];
  return Object.entries(snap.val()).map(([sessionId, session]) => ({ sessionId, ...session }));
}

export async function getAllRideSessions() {
  const snap = await get(ref(db, 'usage_logs'));
  if (!snap.exists()) return [];
  const sessions = [];
  for (const [rfidUid, log] of Object.entries(snap.val())) {
    if (log.history) {
      for (const [sessionId, session] of Object.entries(log.history)) {
        sessions.push({ rfidUid, sessionId, ...session });
      }
    }
  }
  return sessions;
}

// ── Active session ─────────────────────────────────────────────────────────

export async function getActiveSession(rfidUid) {
  const lastIdSnap = await get(ref(db, `usage_logs/${rfidUid}/last_session_id`));
  if (!lastIdSnap.exists()) return null;
  const sessionId = lastIdSnap.val();
  const sessionSnap = await get(ref(db, `usage_logs/${rfidUid}/history/${sessionId}`));
  if (!sessionSnap.exists()) return null;
  const session = sessionSnap.val();
  if (session.endTime) return null; // completed
  return { sessionId, ...session };
}

// ── End ride (atomic multi-path update) ───────────────────────────────────

export async function endRideSession(rfidUid, sessionId, endTime, durationMinutes) {
  // Read current student state first
  const studentSnap = await get(ref(db, `students/${rfidUid}`));
  const student = studentSnap.val() || {};

  const currentMinutes = student.dailyUsage?.minutes ?? 0;
  const currentViolations = student.violationCount ?? 0;
  const isOvertime = durationMinutes > 20;
  const newViolations = isOvertime ? currentViolations + 1 : currentViolations;

  const updates = {
    [`usage_logs/${rfidUid}/history/${sessionId}/endTime`]: endTime,
    [`usage_logs/${rfidUid}/history/${sessionId}/durationMinutes`]: durationMinutes,
    [`students/${rfidUid}/dailyUsage/minutes`]: currentMinutes + durationMinutes,
  };

  if (isOvertime) {
    updates[`students/${rfidUid}/hasFine`] = true;
    updates[`students/${rfidUid}/violationCount`] = newViolations;
  }
  if (newViolations >= 5) {
    updates[`students/${rfidUid}/isBanned`] = true;
  }

  await update(ref(db), updates);
}

// ── Admin writes ───────────────────────────────────────────────────────────

export async function banStudent(rfidUid) {
  await update(ref(db, `students/${rfidUid}`), { isBanned: true, isAllowed: false });
}

export async function unbanStudent(rfidUid) {
  await update(ref(db, `students/${rfidUid}`), { isBanned: false, isAllowed: true });
}

export async function clearStudentFine(rfidUid) {
  await update(ref(db, `students/${rfidUid}`), { hasFine: false });
}

export async function assignRfidToStudent(oldKey, newRfidUid, studentData) {
  const updates = { [`students/${newRfidUid}`]: studentData };
  if (oldKey && oldKey !== newRfidUid) {
    updates[`students/${oldKey}`] = null; // Firebase delete via null
  }
  await update(ref(db), updates);
}

// ── Daily usage reset ──────────────────────────────────────────────────────

export async function checkAndResetDailyUsage(rfidUid, dailyUsage) {
  const todayStr = today();
  if (!dailyUsage || dailyUsage.date !== todayStr) {
    const reset = { date: todayStr, minutes: 0 };
    await update(ref(db, `students/${rfidUid}/dailyUsage`), reset);
    return reset;
  }
  return dailyUsage;
}
```

---

### 3. `context/AuthContext.jsx` — Authentication Context

Replaces the current mock/JWT implementation. Uses `onAuthStateChanged` as the single source of truth for auth state. Exposes `login`, `signup`, `logout`, and the resolved `user` object (augmented with the student's Firebase DB profile).

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, db } from '../services/firebaseConfig';
import { getStudentByEmail, checkAndResetDailyUsage } from '../services/firebaseService';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Subscribe — Firebase calls this immediately with the current session
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Hydrate with DB profile
        const result = await getStudentByEmail(firebaseUser.email);
        if (result) {
          const { rfidUid, student } = result;
          const dailyUsage = await checkAndResetDailyUsage(rfidUid, student.dailyUsage);
          setUser({ ...student, rfidUid, dailyUsage, firebaseUid: firebaseUser.uid });
        } else {
          setUser({ email: firebaseUser.email, firebaseUid: firebaseUser.uid });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return unsubscribe; // cleanup on unmount
  }, []);

  const signup = async ({ name, email, studentId, phone, password }) => {
    const domain = email.split('@')[1] ?? '';
    if (!domain.endsWith('.edu') && !domain.endsWith('.ac.in')) {
      throw new Error('Please use your college email address');
    }
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
    // Write initial profile — key is firebaseUser.uid until admin assigns RFID
    const profile = {
      name, email, studentId, phone,
      role: 'user',
      isAllowed: true,
      hasFine: false,
      totalRides: 0,
      violationCount: 0,
      isBanned: false,
      dailyUsage: { date: '', minutes: 0 },
    };
    await set(ref(db, `students/${firebaseUser.uid}`), profile);
    // onAuthStateChanged will fire and hydrate user state automatically
  };

  const login = async (email, password) => {
    const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
    const role = firebaseUser.email.toLowerCase().includes('admin') ? 'admin' : 'user';
    return { role };
  };

  const logout = async () => {
    await signOut(auth);
    // onAuthStateChanged fires with null → setUser(null)
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

**Key changes from current implementation:**
- Removes all mock data fallbacks and JWT token handling
- Removes `activeRide`, `startRide`, `endRide` from context (ride state is now read from Firebase DB directly in the ride screen)
- `isLoading` is `true` until `onAuthStateChanged` fires its first value
- `logout` calls `signOut(auth)` — no local state to clear manually

---

### 4. Screen-level changes

#### `app/(auth)/login.jsx`
- `login()` from AuthContext now calls Firebase directly — no changes to the component's call site
- Remove the RFID login path (RFID is a hardware-only flow; the Arduino writes to Firebase directly; the app does not need an RFID login screen)
- On success, check `result.role` and navigate to `/(admin)` or `/(tabs)` as before

#### `app/(auth)/signup.jsx`
- `signup()` from AuthContext now calls Firebase — no changes to the component's call site
- Email domain validation moves into AuthContext (already present in component; keep as a pre-flight check in the component too for immediate UX feedback)

#### `app/(tabs)/index.jsx` (Home)
- Replace `STATS` mock data with a `getAllStudents()` count or a dedicated stats read
- Read `user.isBanned` / `user.isAllowed` from context to show suspension banner and disable scan button
- Read `user.dailyUsage` from context (already reset-checked on login)

#### `app/(tabs)/history.jsx`
- Replace mock ride history with `getRideHistory(user.rfidUid)`

#### `app/ride/[id].jsx` (Active Ride)
- On mount, call `getActiveSession(user.rfidUid)` to restore session state if app was backgrounded
- On "End Ride", call `endRideSession(user.rfidUid, sessionId, endTime, durationMinutes)` instead of `endRide()` from context

#### `app/(admin)/users.jsx`
- Replace mock data with `getAllStudents()`
- Wire "Ban" → `banStudent(rfidUid)`, "Unban" → `unbanStudent(rfidUid)`, "Clear Fine" → `clearStudentFine(rfidUid)`, "Assign RFID" → `assignRfidToStudent(...)`

#### `app/(admin)/rides.jsx`
- Replace mock data with `getAllRideSessions()`

---

## Interfaces

### FirebaseService public API

```typescript
// Student
getStudentByEmail(email: string): Promise<{ rfidUid: string; student: Student } | null>
getAllStudents(): Promise<Array<{ rfidUid: string } & Student>>

// Ride history
getRideHistory(rfidUid: string): Promise<Array<{ sessionId: string } & Session>>
getAllRideSessions(): Promise<Array<{ rfidUid: string; sessionId: string } & Session>>

// Active session
getActiveSession(rfidUid: string): Promise<({ sessionId: string } & Session) | null>

// End ride
endRideSession(
  rfidUid: string,
  sessionId: string,
  endTime: string,          // "YYYY-MM-DD HH:mm:ss"
  durationMinutes: number
): Promise<void>

// Admin
banStudent(rfidUid: string): Promise<void>
unbanStudent(rfidUid: string): Promise<void>
clearStudentFine(rfidUid: string): Promise<void>
assignRfidToStudent(
  oldKey: string,
  newRfidUid: string,
  studentData: Student
): Promise<void>

// Daily usage
checkAndResetDailyUsage(
  rfidUid: string,
  dailyUsage: { date: string; minutes: number }
): Promise<{ date: string; minutes: number }>
```

### Type definitions

```typescript
interface Student {
  name: string;
  email: string;
  studentId: string;
  phone: string;
  role: 'user' | 'admin';
  isAllowed: boolean;
  hasFine: boolean;
  totalRides: number;
  violationCount: number;
  isBanned: boolean;
  dailyUsage: { date: string; minutes: number };
}

interface Session {
  startTime: string;
  endTime?: string | null;
  durationMinutes?: number;
}
```

---

## Data Models

### Firebase Realtime Database Schema

```
students/
  {rfidUid}/
    name:           string
    email:          string
    studentId:      string
    phone:          string
    role:           "user" | "admin"
    isAllowed:      boolean
    hasFine:        boolean
    totalRides:     number
    violationCount: number
    isBanned:       boolean
    dailyUsage/
      date:         string   // "YYYY-MM-DD"
      minutes:      number

usage_logs/
  {rfidUid}/
    last_session_id: string  // Firebase push key
    history/
      {sessionId}/
        startTime:       string   // "YYYY-MM-DD HH:mm:ss"
        endTime:         string?  // null/absent = active ride
        durationMinutes: number?
```

### AuthContext user object (in-memory)

```javascript
{
  // From Firebase DB students/{rfidUid}
  rfidUid:        string,   // the DB key (RFID UID or Firebase UID for new users)
  name:           string,
  email:          string,
  studentId:      string,
  phone:          string,
  role:           "user" | "admin",
  isAllowed:      boolean,
  hasFine:        boolean,
  totalRides:     number,
  violationCount: number,
  isBanned:       boolean,
  dailyUsage:     { date: string, minutes: number },
  // From Firebase Auth
  firebaseUid:    string,
}
```

---

## Error Handling

| Scenario | Handling |
|---|---|
| Firebase Auth: email already in use | `createUserWithEmailAndPassword` throws; AuthContext re-throws; component displays `error.message` |
| Firebase Auth: wrong password / user not found | `signInWithEmailAndPassword` throws; component displays `error.message` |
| Invalid college email domain | AuthContext throws `"Please use your college email address"` before calling Firebase |
| `getStudentByEmail` returns null | Component shows "Profile not found" message; no crash |
| `getRideHistory` returns empty | Component shows "No rides yet." empty state |
| `getActiveSession` returns null | Home screen shows no active-ride banner |
| Firebase DB write fails (network) | `endRideSession` / admin writes throw; calling component catches and shows an alert |
| `onAuthStateChanged` not yet fired | `isLoading = true`; root layout renders a loading screen and blocks navigation |
| Admin assigns duplicate RFID UID | Firebase write overwrites the existing record at that key; admin should verify before assigning |

---

## Migration Steps (Implementation Order)

1. Install Firebase JS SDK: `npm install firebase`
2. Create `services/firebaseConfig.js` with project credentials
3. Create `services/firebaseService.js` with all exported functions
4. Rewrite `context/AuthContext.jsx` to use Firebase Auth + `onAuthStateChanged`
5. Update `app/(auth)/login.jsx` and `app/(auth)/signup.jsx` to use new AuthContext API
6. Update `app/(tabs)/index.jsx`, `history.jsx`, `profile.jsx` to read from Firebase
7. Update `app/ride/[id].jsx` to call `endRideSession`
8. Update all `app/(admin)/` screens to use FirebaseService
9. Remove `services/api.js`
10. Delete `backend/` directory
11. Remove unused dependencies (`jsonwebtoken`, `bcryptjs`, `mongoose`, `express`) from root `package.json` if present

---

## Testing Strategy

**Dual testing approach** — unit/example tests cover specific scenarios and error conditions; property-based tests cover universal invariants across generated inputs.

### Unit / example tests

- Firebase Auth error propagation (wrong password, email already in use)
- Navigation after login (admin vs user routing with specific emails)
- Loading state during async sign-in
- `onAuthStateChanged` cleanup on unmount
- `endRideSession` produces a single multi-path update object
- Admin ban/unban updates local state without full reload

### Property-based tests

Each property below maps to a test that runs a minimum of 100 iterations with randomly generated inputs. Tests use mocked Firebase SDK calls so no real network requests are made.

- **College email validation** — generate random invalid domains, verify rejection
- **Signup profile completeness** — generate random valid user data, verify all fields present with correct defaults
- **Login routing** — generate random emails with/without "admin", verify correct navigation target
- **Auth state propagation** — generate sequences of auth state changes, verify context reflects latest
- **getStudentByEmail round-trip** — generate random student records, verify lookup returns correct record
- **getRideHistory completeness** — generate random session sets, verify all returned
- **Active session detection** — generate sessions with/without endTime, verify correct active/inactive classification
- **Daily usage accumulation** — generate random (existing, delta) pairs, verify sum
- **Overtime fine threshold** — generate durations above/below 20 min, verify hasFine set correctly
- **Ban threshold** — generate violation counts at/above/below 5, verify isBanned set correctly
- **Ban/unban round-trip** — verify state after ban then unban equals pre-ban state
- **RFID assignment** — verify new key exists and old key is removed
- **Empty RFID rejection** — generate empty/whitespace strings, verify rejection
- **getAllRideSessions flat array** — generate multi-user session trees, verify flat output
- **Daily usage reset** — generate stale dates, verify reset to today with 0 minutes
- **Suspension UI** — generate students with isBanned=true or isAllowed=false, verify scan disabled

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Notes on property consolidation

Before listing properties, redundancies are resolved:

- Requirements 3.2 and 3.3 (admin vs user routing) are complementary and can be expressed as a single routing property.
- Requirements 7.2 and 7.3 (active session detection) are complementary and expressed as one property.
- Requirements 10.1 and 10.2 (ban/unban) are inverses and expressed as one round-trip property.
- Requirements 16.1 and 16.2 (isBanned and isAllowed) are combined into one suspension property.
- Requirements 8.3 and 8.4 (fine and ban thresholds) are kept separate because they test different thresholds.

---

### Property 1: College email validation rejects non-college domains

*For any* string used as an email address whose domain does not end in `.edu` or `.ac.in`, the signup function SHALL reject it with the error "Please use your college email address" and SHALL NOT call `createUserWithEmailAndPassword`.

**Validates: Requirements 2.3**

---

### Property 2: Signup writes a complete student profile

*For any* valid signup input (name, email, studentId, phone, password), when `createUserWithEmailAndPassword` succeeds, the student record written to `students/{uid}` SHALL contain all required fields (`name`, `email`, `studentId`, `phone`, `role`, `isAllowed`, `hasFine`, `totalRides`, `violationCount`, `isBanned`, `dailyUsage`) with their correct default values.

**Validates: Requirements 2.2**

---

### Property 3: Login routes by email content

*For any* email address, after a successful `signInWithEmailAndPassword` call, the app SHALL navigate to `/(admin)` if the email contains the substring `"admin"`, and to `/(tabs)` otherwise.

**Validates: Requirements 3.2, 3.3**

---

### Property 4: Auth state changes are reflected in context

*For any* sequence of auth state changes emitted by `onAuthStateChanged`, the `user` value exposed by AuthContext SHALL always equal the most recently emitted value (hydrated with the DB profile, or `null` if signed out).

**Validates: Requirements 4.1**

---

### Property 5: getStudentByEmail is a round-trip lookup

*For any* student record stored in the `students` node with a given email, calling `getStudentByEmail(email)` SHALL return that record and its RFID UID key.

**Validates: Requirements 5.1, 5.2**

---

### Property 6: getRideHistory returns all sessions

*For any* RFID UID with sessions stored under `usage_logs/{rfidUid}/history`, calling `getRideHistory(rfidUid)` SHALL return an array containing every session, each including its `sessionId`, `startTime`, `endTime`, and `durationMinutes`.

**Validates: Requirements 6.1, 6.2**

---

### Property 7: Active session detection is correct

*For any* session object, `getActiveSession` SHALL return the session if and only if its `endTime` field is absent or `null`; it SHALL return `null` for any session where `endTime` is a non-null string.

**Validates: Requirements 7.2, 7.3**

---

### Property 8: End ride accumulates daily usage correctly

*For any* existing `dailyUsage.minutes` value and any `durationMinutes` value, after `endRideSession` completes, the student's `dailyUsage.minutes` in Firebase DB SHALL equal the sum of the two values.

**Validates: Requirements 8.2**

---

### Property 9: Overtime threshold triggers fine

*For any* `durationMinutes` value greater than 20, `endRideSession` SHALL set `hasFine` to `true` in the student's record.

**Validates: Requirements 8.3**

---

### Property 10: Violation threshold triggers ban

*For any* student whose `violationCount` reaches 5 or more after a fine is applied, `endRideSession` SHALL set `isBanned` to `true` in the student's record.

**Validates: Requirements 8.4**

---

### Property 11: Ban/unban is a round-trip

*For any* RFID UID, calling `banStudent` followed by `unbanStudent` SHALL result in `isBanned = false` and `isAllowed = true` in the student's record — restoring the pre-ban state.

**Validates: Requirements 10.1, 10.2**

---

### Property 12: RFID assignment moves the record

*For any* (oldKey, newRfidUid, studentData) triple where `oldKey !== newRfidUid`, after `assignRfidToStudent` completes, the student record SHALL exist under `newRfidUid` and SHALL NOT exist under `oldKey`.

**Validates: Requirements 11.1**

---

### Property 13: Empty RFID UID is rejected

*For any* string that is empty or composed entirely of whitespace, the RFID assignment SHALL be rejected before calling `assignRfidToStudent`, and no write to Firebase DB SHALL occur.

**Validates: Requirements 11.2, 11.3**

---

### Property 14: getAllRideSessions returns a flat array of all sessions

*For any* set of records stored under `usage_logs`, calling `getAllRideSessions()` SHALL return a flat array where every session from every user is present, each annotated with its `rfidUid` and `sessionId`.

**Validates: Requirements 12.1**

---

### Property 15: Daily usage resets when date changes

*For any* student whose `dailyUsage.date` does not equal today's date in `YYYY-MM-DD` format, calling `checkAndResetDailyUsage` SHALL write `{ date: <today>, minutes: 0 }` to `students/{rfidUid}/dailyUsage` and return the reset value.

**Validates: Requirements 15.1**

---

### Property 16: Suspended students cannot scan

*For any* student object where `isBanned` is `true` OR `isAllowed` is `false`, the home screen SHALL render a suspension message and the QR scan button SHALL be disabled.

**Validates: Requirements 16.1, 16.2**
