# Requirements Document

## Introduction

CycleSync is a smart campus bicycle-sharing app built with React Native (Expo). The current architecture uses a Node.js/Express backend with MongoDB Atlas and JWT-based authentication. This migration replaces the entire backend with Firebase — specifically Firebase Authentication (email/password) and Firebase Realtime Database — resulting in a fully serverless architecture where the React Native app communicates directly with Firebase via the Firebase JS SDK. The Express/MongoDB backend folder is removed. The Arduino hardware (ESP32 + FirebaseESP32 library) already writes directly to Firebase and requires no changes.

---

## Glossary

- **App**: The CycleSync React Native (Expo) application.
- **Firebase Auth**: Firebase Authentication service used for email/password sign-in and sign-up.
- **Firebase DB**: Firebase Realtime Database used as the sole data store.
- **Firebase SDK**: The `firebase` JavaScript SDK installed in the React Native project.
- **FirebaseService**: The new `services/firebaseService.js` module that encapsulates all Firebase DB read/write operations.
- **FirebaseConfig**: The `services/firebaseConfig.js` module that initialises the Firebase app with project credentials.
- **AuthContext**: The React Context (`context/AuthContext.jsx`) that manages authentication state and exposes auth helpers to the component tree.
- **Student**: A registered campus user who rents bicycles.
- **Admin**: A privileged user who manages the fleet, users, rides, and fines via in-app admin screens.
- **RFID UID**: The hexadecimal identifier stored on a student's physical RFID card (e.g. `8EFFD206`), used as the primary key in the `students` and `usage_logs` Firebase DB nodes.
- **Session**: A single bicycle ride, stored as a child node under `usage_logs/{rfidUid}/history/{sessionId}`.
- **Arduino**: The ESP32 microcontroller unit attached to each bicycle; it writes ride session data directly to Firebase DB using the FirebaseESP32 library. No changes are made to the Arduino sketch.
- **Backend**: The existing `backend/` directory containing the Express server, Mongoose models, and routes — to be removed as part of this migration.

---

## Requirements

### Requirement 1 — Firebase SDK Initialisation

**User Story:** As a developer, I want a single Firebase initialisation module, so that all parts of the app share one Firebase app instance without re-initialising.

#### Acceptance Criteria

1. THE App SHALL contain a `services/firebaseConfig.js` file that initialises the Firebase app using `initializeApp` from the Firebase JS SDK with the project's `apiKey`, `authDomain`, `databaseURL`, `projectId`, `storageBucket`, `messagingSenderId`, and `appId` values.
2. THE `services/firebaseConfig.js` file SHALL export the initialised Firebase Auth instance and the Firebase Realtime Database instance for use by other modules.
3. IF the Firebase app has already been initialised, THEN THE `services/firebaseConfig.js` SHALL reuse the existing app instance rather than calling `initializeApp` a second time.

---

### Requirement 2 — Firebase Authentication: Sign-Up

**User Story:** As a Student, I want to create an account using my college email and password, so that I can access the bicycle-sharing service.

#### Acceptance Criteria

1. WHEN a Student submits the sign-up form with a valid college email (ending in `.edu` or `.ac.in`) and a password of at least 6 characters, THE App SHALL call `createUserWithEmailAndPassword` from Firebase Auth to create the account.
2. WHEN Firebase Auth successfully creates the account, THE App SHALL write a user profile record to `students/{rfidUid}` in Firebase DB containing `name`, `email`, `studentId`, `phone`, `role` (default `"user"`), `isAllowed` (default `true`), `hasFine` (default `false`), `totalRides` (default `0`), `violationCount` (default `0`), `isBanned` (default `false`), and `dailyUsage` (default `{ date: "", minutes: 0 }`).
3. IF the submitted email domain is not `.edu` or `.ac.in`, THEN THE App SHALL display the error message "Please use your college email address" and SHALL NOT call Firebase Auth.
4. IF Firebase Auth returns an error during sign-up (e.g. email already in use), THEN THE App SHALL display the Firebase error message to the Student.
5. WHEN sign-up succeeds, THE App SHALL automatically sign the Student in and navigate to the user home screen.

---

### Requirement 3 — Firebase Authentication: Sign-In

**User Story:** As a Student or Admin, I want to sign in with my email and password, so that I can access my account.

#### Acceptance Criteria

1. WHEN a user submits the login form with a non-empty email and password, THE App SHALL call `signInWithEmailAndPassword` from Firebase Auth.
2. WHEN Firebase Auth returns a signed-in user whose email contains the substring `"admin"`, THE App SHALL navigate to the admin dashboard screen.
3. WHEN Firebase Auth returns a signed-in user whose email does not contain `"admin"`, THE App SHALL navigate to the user home tab screen.
4. IF Firebase Auth returns an authentication error, THEN THE App SHALL display the error message to the user and SHALL NOT navigate away from the login screen.
5. WHILE a sign-in request is in progress, THE App SHALL display a loading indicator and SHALL disable the sign-in button.

---

### Requirement 4 — Firebase Authentication: Session Persistence and Sign-Out

**User Story:** As a Student, I want my session to persist across app restarts, so that I do not have to sign in every time I open the app.

#### Acceptance Criteria

1. THE AuthContext SHALL subscribe to `onAuthStateChanged` from Firebase Auth on mount and SHALL update the authenticated user state whenever the Firebase Auth session changes.
2. WHILE the `onAuthStateChanged` listener has not yet emitted its first value, THE App SHALL display a loading screen and SHALL NOT render protected routes.
3. WHEN a user taps the sign-out button, THE App SHALL call `signOut` from Firebase Auth, which SHALL clear the local session and navigate to the login screen.
4. WHEN the AuthContext unmounts, THE App SHALL unsubscribe from the `onAuthStateChanged` listener to prevent memory leaks.

---

### Requirement 5 — Firebase Realtime Database: Student Profile Reads

**User Story:** As a Student, I want my profile data (name, daily usage, fine status) to be loaded from Firebase, so that the home screen and profile screen reflect real data.

#### Acceptance Criteria

1. WHEN the authenticated user's Firebase Auth UID is available, THE FirebaseService SHALL read the student record from `students/{rfidUid}` in Firebase DB using `get` from the Firebase Realtime Database SDK.
2. THE App SHALL derive the student's `rfidUid` by querying `students` for the record whose `email` field matches the authenticated user's email.
3. IF no matching student record exists in Firebase DB, THEN THE App SHALL display a "Profile not found" message and SHALL NOT crash.
4. THE FirebaseService SHALL expose a `getStudentByEmail(email)` function that returns the student record and the student's RFID UID key.

---

### Requirement 6 — Firebase Realtime Database: Ride History Reads

**User Story:** As a Student, I want to view my past rides, so that I can track my usage history.

#### Acceptance Criteria

1. WHEN the history screen mounts and the student's RFID UID is known, THE FirebaseService SHALL read `usage_logs/{rfidUid}/history` from Firebase DB and return all session records.
2. THE App SHALL display each session record with its `startTime`, `endTime`, and `durationMinutes` fields.
3. IF `usage_logs/{rfidUid}/history` does not exist or is empty, THEN THE App SHALL display an empty-state message such as "No rides yet."
4. THE FirebaseService SHALL expose a `getRideHistory(rfidUid)` function that returns an array of session objects, each including the Firebase push key as the session ID.

---

### Requirement 7 — Firebase Realtime Database: Active Ride Detection

**User Story:** As a Student, I want the app to detect whether I currently have an active ride, so that the home screen shows the correct ride-in-progress banner.

#### Acceptance Criteria

1. WHEN the home screen mounts, THE FirebaseService SHALL read `usage_logs/{rfidUid}/last_session_id` from Firebase DB to retrieve the most recent session key.
2. WHEN the most recent session key is available, THE FirebaseService SHALL read `usage_logs/{rfidUid}/history/{sessionId}` and SHALL determine the session is active if the `endTime` field is absent or null.
3. IF the most recent session has a non-null `endTime`, THEN THE App SHALL treat the student as having no active ride.
4. THE FirebaseService SHALL expose a `getActiveSession(rfidUid)` function that returns the active session object and its key, or `null` if no active session exists.

---

### Requirement 8 — Firebase Realtime Database: End Ride Write

**User Story:** As a Student, I want to end my ride by selecting a parking spot, so that the session is recorded in Firebase with the correct end time and duration.

#### Acceptance Criteria

1. WHEN a Student taps "End Ride" and a parking spot is selected, THE FirebaseService SHALL write `endTime` (formatted as `"YYYY-MM-DD HH:mm:ss"`) and `durationMinutes` (integer) to `usage_logs/{rfidUid}/history/{sessionId}` in Firebase DB using `update`.
2. WHEN the ride end write succeeds, THE App SHALL update the student's `dailyUsage.minutes` in `students/{rfidUid}` by adding the session's `durationMinutes` to the existing value.
3. IF the session duration exceeds 20 minutes, THEN THE App SHALL set `hasFine` to `true` in `students/{rfidUid}` in Firebase DB.
4. IF the student's `violationCount` reaches 5 or more after the fine is applied, THEN THE App SHALL set `isBanned` to `true` in `students/{rfidUid}` in Firebase DB.
5. THE FirebaseService SHALL expose an `endRideSession(rfidUid, sessionId, endTime, durationMinutes)` function that performs all writes described in criteria 1–4 atomically using a Firebase DB multi-path update.

---

### Requirement 9 — Admin: Read All Students

**User Story:** As an Admin, I want to view all registered students in the admin users screen, so that I can manage accounts and assign RFID tags.

#### Acceptance Criteria

1. WHEN the admin users screen mounts, THE FirebaseService SHALL read all records under the `students` node in Firebase DB using `get`.
2. THE App SHALL display each student's `name`, `email`, `studentId`, `totalRides`, `violationCount`, `hasFine`, and `isBanned` fields.
3. THE FirebaseService SHALL expose a `getAllStudents()` function that returns an array of student objects, each including the RFID UID key.

---

### Requirement 10 — Admin: Ban and Unban a Student

**User Story:** As an Admin, I want to ban or unban a student, so that I can prevent policy violators from renting bicycles.

#### Acceptance Criteria

1. WHEN an Admin taps "Ban User" for a student, THE FirebaseService SHALL set `isBanned` to `true` and `isAllowed` to `false` in `students/{rfidUid}` in Firebase DB.
2. WHEN an Admin taps "Unban User" for a student, THE FirebaseService SHALL set `isBanned` to `false` and `isAllowed` to `true` in `students/{rfidUid}` in Firebase DB.
3. WHEN the ban or unban write succeeds, THE App SHALL update the displayed student card immediately to reflect the new status without requiring a full screen reload.

---

### Requirement 11 — Admin: Assign RFID UID to a Student

**User Story:** As an Admin, I want to assign an RFID UID to a student account, so that the Arduino can identify the student when they tap their card.

#### Acceptance Criteria

1. WHEN an Admin enters an RFID UID and taps "Assign RFID" for a student, THE FirebaseService SHALL write the RFID UID as the key for a new or updated record under `students` in Firebase DB, copying the student's existing profile data to the new key if the key has changed.
2. THE App SHALL validate that the entered RFID UID is a non-empty string before calling FirebaseService.
3. IF the RFID UID field is empty when the Admin taps "Assign RFID", THEN THE App SHALL display the error "Enter RFID UID before assigning" and SHALL NOT write to Firebase DB.
4. THE FirebaseService SHALL expose an `assignRfidToStudent(oldKey, newRfidUid, studentData)` function that writes the student record under the new key and removes the old key if it differs.

---

### Requirement 12 — Admin: Read All Ride Sessions

**User Story:** As an Admin, I want to view all ride sessions across all students, so that I can monitor fleet usage.

#### Acceptance Criteria

1. WHEN the admin rides screen mounts, THE FirebaseService SHALL read all records under `usage_logs` in Firebase DB using `get`.
2. THE App SHALL display each session with the student's RFID UID, `startTime`, `endTime`, and `durationMinutes`.
3. THE FirebaseService SHALL expose a `getAllRideSessions()` function that returns a flat array of session objects, each including the RFID UID and session key.

---

### Requirement 13 — Admin: Clear Student Fine

**User Story:** As an Admin, I want to mark a student's fine as cleared, so that the student can resume renting bicycles.

#### Acceptance Criteria

1. WHEN an Admin clears a fine for a student, THE FirebaseService SHALL set `hasFine` to `false` in `students/{rfidUid}` in Firebase DB.
2. WHEN the fine-clear write succeeds, THE App SHALL update the displayed student card to show no pending fine without requiring a full screen reload.
3. THE FirebaseService SHALL expose a `clearStudentFine(rfidUid)` function that performs the write described in criterion 1.

---

### Requirement 14 — Backend Removal

**User Story:** As a developer, I want the Express/MongoDB backend removed from the project, so that the codebase no longer contains unused server code.

#### Acceptance Criteria

1. THE `backend/` directory SHALL be deleted from the project.
2. THE `services/api.js` file SHALL be replaced by `services/firebaseService.js`; no component SHALL import from `services/api.js` after migration.
3. THE root `package.json` SHALL include `firebase` as a dependency; no component SHALL reference `jsonwebtoken`, `bcryptjs`, `mongoose`, or `express` packages.
4. THE `context/AuthContext.jsx` SHALL import authentication functions exclusively from the Firebase Auth SDK and SHALL NOT reference `services/api.js` or any JWT token logic.

---

### Requirement 15 — Daily Usage Reset

**User Story:** As a Student, I want my daily usage counter to reset at midnight, so that I get a fresh 60-minute allowance each day.

#### Acceptance Criteria

1. WHEN the App reads a student's `dailyUsage` record from Firebase DB and the `dailyUsage.date` field does not equal today's date in `YYYY-MM-DD` format, THE FirebaseService SHALL write `{ date: <today>, minutes: 0 }` to `students/{rfidUid}/dailyUsage` in Firebase DB before returning the student record to the caller.
2. THE FirebaseService SHALL expose a `checkAndResetDailyUsage(rfidUid, dailyUsage)` function that performs the check and conditional reset described in criterion 1.

---

### Requirement 16 — Banned User Ride Prevention

**User Story:** As a Student who has been banned, I want to be prevented from starting a new ride, so that the system enforces the campus policy.

#### Acceptance Criteria

1. WHILE a student's `isBanned` field in Firebase DB is `true`, THE App SHALL display a "Your account has been suspended" message on the home screen and SHALL disable the QR scan button.
2. WHILE a student's `isAllowed` field in Firebase DB is `false`, THE App SHALL display the same suspension message and SHALL disable the QR scan button.
