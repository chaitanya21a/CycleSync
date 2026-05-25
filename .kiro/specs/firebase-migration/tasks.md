# Implementation Plan: Firebase Migration

## Overview

Replace the Express/MongoDB backend with Firebase Authentication and Firebase Realtime Database. The React Native (Expo) app will communicate directly with Firebase via the JS SDK. All mock data and JWT logic is removed. The Arduino hardware is unchanged. Implementation proceeds in dependency order: SDK setup → service layer → auth context → screens → cleanup.

## Tasks

- [x] 1. Install Firebase SDK and create firebaseConfig.js
  - Run `npm install firebase` in the project root to add the Firebase JS SDK
  - Create `services/firebaseConfig.js` that calls `initializeApp` with the project credentials (`apiKey`, `authDomain`, `databaseURL`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`)
  - Guard against double-initialisation using `getApps().length === 0 ? initializeApp(...) : getApp()`
  - Export named `auth` (from `getAuth`) and `db` (from `getDatabase`) instances
  - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 1.1 Write property test for Firebase initialisation guard
    - **Property: Calling initializeApp twice does not throw — the guard returns the existing app**
    - Mock `getApps` to return a non-empty array and verify `initializeApp` is NOT called a second time
    - **Validates: Requirements 1.3**

- [x] 2. Create services/firebaseService.js — student and ride reads
  - Create `services/firebaseService.js`; import `db` from `firebaseConfig`
  - Implement `getStudentByEmail(email)`: query `students` node with `orderByChild('email').equalTo(email)`; return `{ rfidUid, student }` or `null`
  - Implement `getAllStudents()`: read entire `students` node; return array of `{ rfidUid, ...student }`
  - Implement `getRideHistory(rfidUid)`: read `usage_logs/{rfidUid}/history`; return array of `{ sessionId, ...session }`
  - Implement `getAllRideSessions()`: read entire `usage_logs` node; flatten into array of `{ rfidUid, sessionId, ...session }`
  - Implement `getActiveSession(rfidUid)`: read `last_session_id`, then the session; return session if `endTime` is absent/null, else `null`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.4, 7.1, 7.2, 7.3, 7.4, 9.1, 9.3, 12.1, 12.3_

  - [ ]* 2.1 Write property test for getStudentByEmail round-trip
    - **Property 5: getStudentByEmail is a round-trip lookup**
    - Generate random student records, mock `get` to return them, verify the returned `rfidUid` and `student` match
    - **Validates: Requirements 5.1, 5.2**

  - [ ]* 2.2 Write property test for getRideHistory completeness
    - **Property 6: getRideHistory returns all sessions**
    - Generate random session sets under a given rfidUid, verify every session is present in the returned array with correct fields
    - **Validates: Requirements 6.1, 6.2**

  - [ ]* 2.3 Write property test for active session detection
    - **Property 7: Active session detection is correct**
    - Generate sessions with and without `endTime`; verify `getActiveSession` returns the session only when `endTime` is absent/null
    - **Validates: Requirements 7.2, 7.3**

  - [ ]* 2.4 Write property test for getAllRideSessions flat array
    - **Property 14: getAllRideSessions returns a flat array of all sessions**
    - Generate multi-user session trees; verify every session appears in the flat output annotated with `rfidUid` and `sessionId`
    - **Validates: Requirements 12.1**

- [x] 3. Create services/firebaseService.js — write operations
  - Implement `endRideSession(rfidUid, sessionId, endTime, durationMinutes)`: read current student state, compute new `violationCount` and `dailyUsage.minutes`, perform a single multi-path `update` covering session fields, `dailyUsage`, `hasFine`, `violationCount`, and `isBanned` (if threshold reached)
  - Implement `banStudent(rfidUid)`: set `isBanned: true, isAllowed: false`
  - Implement `unbanStudent(rfidUid)`: set `isBanned: false, isAllowed: true`
  - Implement `clearStudentFine(rfidUid)`: set `hasFine: false`
  - Implement `assignRfidToStudent(oldKey, newRfidUid, studentData)`: write student under `newRfidUid`, delete `oldKey` if different (set to `null`)
  - Implement `checkAndResetDailyUsage(rfidUid, dailyUsage)`: if `dailyUsage.date !== today`, write `{ date: today, minutes: 0 }` and return reset value
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 10.1, 10.2, 11.1, 11.4, 13.1, 13.3, 15.1, 15.2_

  - [ ]* 3.1 Write property test for daily usage accumulation
    - **Property 8: End ride accumulates daily usage correctly**
    - Generate arbitrary `(existingMinutes, durationMinutes)` pairs; mock Firebase reads/writes; verify `dailyUsage.minutes` equals the sum
    - **Validates: Requirements 8.2**

  - [ ]* 3.2 Write property test for overtime fine threshold
    - **Property 9: Overtime threshold triggers fine**
    - Generate `durationMinutes > 20`; verify `hasFine` is set to `true` in the update object
    - **Validates: Requirements 8.3**

  - [ ]* 3.3 Write property test for violation ban threshold
    - **Property 10: Violation threshold triggers ban**
    - Generate students whose `violationCount` reaches 5 after increment; verify `isBanned` is set to `true`
    - **Validates: Requirements 8.4**

  - [ ]* 3.4 Write property test for ban/unban round-trip
    - **Property 11: Ban/unban is a round-trip**
    - Call `banStudent` then `unbanStudent` on a mocked DB; verify final state is `isBanned: false, isAllowed: true`
    - **Validates: Requirements 10.1, 10.2**

  - [ ]* 3.5 Write property test for RFID assignment record move
    - **Property 12: RFID assignment moves the record**
    - Generate `(oldKey, newRfidUid, studentData)` triples where keys differ; verify new key exists and old key is set to `null`
    - **Validates: Requirements 11.1**

  - [ ]* 3.6 Write property test for daily usage reset
    - **Property 15: Daily usage resets when date changes**
    - Generate stale `dailyUsage.date` values; verify `checkAndResetDailyUsage` writes `{ date: today, minutes: 0 }` and returns the reset value
    - **Validates: Requirements 15.1**

- [x] 4. Checkpoint — service layer complete
  - Ensure all FirebaseService functions are exported and importable
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Rewrite context/AuthContext.jsx
  - Remove all mock data imports (`USER_PROFILE`, `api`) and JWT/token logic
  - Remove `activeRide`, `startRide`, `endRide` from context (ride state moves to the ride screen)
  - Remove `loginWithRfid` (RFID is hardware-only)
  - Subscribe to `onAuthStateChanged` in `useEffect`; on sign-in, call `getStudentByEmail` to hydrate the user object with DB profile; call `checkAndResetDailyUsage`; set `isLoading: false` after first emission
  - Implement `signup({ name, email, studentId, phone, password })`: validate college email domain, call `createUserWithEmailAndPassword`, write initial student profile to `students/{uid}` via `set`
  - Implement `login(email, password)`: call `signInWithEmailAndPassword`; derive role from email substring `"admin"`; return `{ role }`
  - Implement `logout()`: call `signOut(auth)`
  - Return `unsubscribe` from `useEffect` to prevent memory leaks
  - Expose `{ user, isLoading, login, signup, logout, setUser }` on context
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 5.2, 14.4_

  - [ ]* 5.1 Write property test for college email validation
    - **Property 1: College email validation rejects non-college domains**
    - Generate random email addresses with invalid domains; verify `signup` throws "Please use your college email address" and `createUserWithEmailAndPassword` is NOT called
    - **Validates: Requirements 2.3**

  - [ ]* 5.2 Write property test for signup profile completeness
    - **Property 2: Signup writes a complete student profile**
    - Generate random valid signup inputs; mock `createUserWithEmailAndPassword`; verify the `set` call receives all required fields with correct defaults
    - **Validates: Requirements 2.2**

  - [ ]* 5.3 Write property test for login routing by email
    - **Property 3: Login routes by email content**
    - Generate emails with and without the substring `"admin"`; verify `login` returns `role: "admin"` or `role: "user"` accordingly
    - **Validates: Requirements 3.2, 3.3**

  - [ ]* 5.4 Write property test for auth state propagation
    - **Property 4: Auth state changes are reflected in context**
    - Emit sequences of auth state changes via a mocked `onAuthStateChanged`; verify `user` always reflects the most recent emission
    - **Validates: Requirements 4.1**

- [x] 6. Update app/(auth)/login.jsx
  - Remove `loginWithRfid` import and the entire RFID login section (input field, divider, button)
  - The `handleLogin` function already calls `login(email, password)` and routes on `result.role` — no logic changes needed
  - Add loading indicator and disabled state on the sign-in button while `isLoading` is true (Requirement 3.5)
  - Display Firebase error messages from the `catch` block (already present)
  - _Requirements: 3.1, 3.4, 3.5, 14.2_

- [x] 7. Update app/(auth)/signup.jsx
  - The `signup()` call site is unchanged; ensure the component still shows the Firebase error message on failure
  - Keep the client-side email domain pre-flight check for immediate UX feedback
  - On success, navigate to `/(tabs)` (signup auto-signs in via `onAuthStateChanged`)
  - _Requirements: 2.1, 2.3, 2.4, 2.5_

- [x] 8. Update app/(tabs)/index.jsx (Home screen)
  - Remove `activeRide` from `useAuth()` destructuring (no longer in context)
  - Call `getActiveSession(user.rfidUid)` on mount to check for an active ride; store result in local state
  - Replace `STATS` mock import with a `getAllStudents()` call to derive fleet counts, or remove the fleet stats section if data is unavailable
  - Read `user.isBanned` and `user.isAllowed` from context; if either condition is true, render a "Your account has been suspended" banner and disable the Scan QR quick-action button
  - Read `user.dailyUsage.minutes` from context for the daily usage card
  - _Requirements: 7.1, 7.2, 7.3, 16.1, 16.2_

  - [ ]* 8.1 Write property test for suspension UI
    - **Property 16: Suspended students cannot scan**
    - Generate student objects with `isBanned: true` or `isAllowed: false`; render the home screen with mocked context; verify the suspension message is shown and the scan button is disabled
    - **Validates: Requirements 16.1, 16.2**

- [x] 9. Update app/(tabs)/history.jsx
  - Remove `RIDE_HISTORY` mock import
  - On mount, call `getRideHistory(user.rfidUid)` and store sessions in local state
  - Map session fields (`startTime`, `endTime`, `durationMinutes`) to the existing `RideCard` component props
  - Show "No rides yet." empty state when the returned array is empty
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 10. Update app/(tabs)/scan.jsx
  - Remove `startRide` from `useAuth()` destructuring (no longer in context)
  - Remove `activeRide` check from context; replace with local state populated by `getActiveSession(user.rfidUid)` on mount
  - On successful QR scan, write the new session to Firebase (the Arduino handles the actual unlock; the app navigates to the ride screen)
  - Disable the scan button and show the suspension banner when `user.isBanned || !user.isAllowed`
  - _Requirements: 7.4, 16.1, 16.2_

- [x] 11. Update app/(tabs)/profile.jsx
  - Remove `logout` mock; `logout()` from context now calls `signOut(auth)` — no call-site changes needed
  - Read `user.dailyUsage.minutes` for the usage stats display
  - Remove any references to `user.pendingFines` (not in the Firebase schema); derive fine status from `user.hasFine`
  - _Requirements: 4.3, 5.1_

- [x] 12. Update app/ride/[id].jsx (Active Ride screen)
  - On mount, call `getActiveSession(user.rfidUid)` to restore session state if the app was backgrounded; store `sessionId` in local state
  - Replace the `endRide(spot, currentLocation)` context call with `endRideSession(user.rfidUid, sessionId, endTime, durationMinutes)` from FirebaseService
  - Format `endTime` as `"YYYY-MM-DD HH:mm:ss"` before passing to `endRideSession`
  - Compute `durationMinutes` from `elapsedSeconds` at the moment the user taps "End Ride"
  - _Requirements: 7.4, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 13. Checkpoint — user-facing screens complete
  - Ensure all tabs and auth screens compile without errors
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Update app/(admin)/users.jsx
  - Remove `MOCK_USERS` constant and `api` import
  - On mount, call `getAllStudents()` and store in local state
  - Wire "Ban User" button → `banStudent(rfidUid)`, update local state on success
  - Wire "Unban User" button → `unbanStudent(rfidUid)`, update local state on success
  - Wire "Assign RFID" button → validate non-empty input, then call `assignRfidToStudent(user.rfidUid, newRfidUid, studentData)`, update local state on success
  - Wire "Clear Fine" action → `clearStudentFine(rfidUid)`, update local state on success
  - Show "Enter RFID UID before assigning" error when the RFID field is empty
  - _Requirements: 9.1, 9.2, 9.3, 10.1, 10.2, 10.3, 11.1, 11.2, 11.3, 11.4, 13.1, 13.2, 13.3_

  - [ ]* 14.1 Write property test for empty RFID rejection
    - **Property 13: Empty RFID UID is rejected**
    - Generate empty strings and whitespace-only strings; verify the validation fires, the error message is shown, and `assignRfidToStudent` is NOT called
    - **Validates: Requirements 11.2, 11.3**

- [x] 15. Update app/(admin)/rides.jsx
  - Remove `ADMIN_RIDES` / `RIDE_HISTORY` mock imports
  - On mount, call `getAllRideSessions()` and store in local state
  - Map `rfidUid`, `startTime`, `endTime`, `durationMinutes` fields to the existing ride card UI
  - _Requirements: 12.1, 12.2, 12.3_

- [x] 16. Update app/(admin)/fines.jsx
  - Remove `MOCK_FINES` constant
  - Derive fines list from `getAllStudents()` filtered to students where `hasFine: true`
  - Wire "Waive" / "Clear Fine" → `clearStudentFine(rfidUid)`, update local state on success
  - _Requirements: 13.1, 13.2, 13.3_

- [x] 17. Remove backend and legacy service files
  - Delete `services/api.js`
  - Delete the entire `backend/` directory
  - Search for any remaining `import api from '../services/api'` or `import api from '../../services/api'` references and remove them
  - Verify `context/AuthContext.jsx` no longer imports from `services/api` or references JWT tokens
  - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [x] 18. Final checkpoint — full migration complete
  - Run `npx expo start` and verify the app launches without errors
  - Confirm login, signup, ride history, active ride, and all admin screens load real Firebase data
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests should mock the Firebase SDK (`firebase/database`, `firebase/auth`) — no real network calls
- The Arduino hardware writes directly to Firebase and requires no changes
- `services/firebaseConfig.js` must be populated with real Firebase project credentials before the app can connect
- Tasks 2 and 3 both write to `services/firebaseService.js` — implement them sequentially
- The `fines.jsx` admin screen has no direct Firebase node; fines are derived from the `students` node (`hasFine` field)
- Admin screens for `bicycles.jsx` and `qr-codes.jsx` are not listed because they currently use only mock/static data with no backend calls to migrate

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4"] },
    { "id": 2, "tasks": ["3.1", "3.2", "3.3", "3.4", "3.5", "3.6"] },
    { "id": 3, "tasks": ["5.1", "5.2", "5.3", "5.4"] },
    { "id": 4, "tasks": ["8.1", "14.1"] }
  ]
}
```
