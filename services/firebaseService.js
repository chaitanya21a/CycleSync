import { db } from './firebaseConfig';
import { ref, get, update } from 'firebase/database';

const today = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

// ── Student reads ──────────────────────────────────────────────────────────

export async function getStudentByEmail(email) {
  const normalized = email.trim().toLowerCase();
  const snap = await get(ref(db, 'students'));
  if (!snap.exists()) return null;
  for (const [rfidUid, student] of Object.entries(snap.val())) {
    if ((student.email || '').trim().toLowerCase() === normalized) {
      return { rfidUid, student };
    }
  }
  return null;
}

export async function getAllStudents() {
  const snap = await get(ref(db, 'students'));
  if (!snap.exists()) return [];
  return Object.entries(snap.val()).map(([rfidUid, student]) => ({ rfidUid, ...student }));
}

function parseSessionTime(t) {
  if (!t) return 0;
  const d = typeof t === 'string' && t.includes(' ')
    ? new Date(t.replace(' ', 'T'))
    : new Date(t);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

/** Aggregated stats for the admin dashboard (students + usage_logs). */
export async function getAdminDashboardStats() {
  const [students, sessions] = await Promise.all([
    getAllStudents(),
    getAllRideSessions(),
  ]);
  const todayStr = today();
  const withFine = students.filter((s) => s.hasFine);
  const recentRides = [...sessions]
    .sort((a, b) => parseSessionTime(b.startTime) - parseSessionTime(a.startTime))
    .slice(0, 5);

  return {
    totalUsers: students.length,
    bannedUsers: students.filter((s) => s.isBanned).length,
    pendingFinesCount: withFine.length,
    pendingFinesAmount: withFine.length * 50,
    todayRides: sessions.filter((s) => (s.startTime || '').startsWith(todayStr)).length,
    activeRides: sessions.filter((s) => !s.endTime).length,
    totalRides: sessions.length,
    recentRides,
  };
}

// ── Ride history ───────────────────────────────────────────────────────────

export async function getRideHistory(rfidUid) {
  const snap = await get(ref(db, `usage_logs/${rfidUid}/history`));
  if (!snap.exists()) return [];
  
  return Object.entries(snap.val()).map(([sessionId, session]) => {
    // Calculate duration if not provided
    let durationMinutes = session.durationMinutes;
    if (!durationMinutes && session.startTime && session.endTime) {
      const start = parseSessionTime(session.startTime);
      const end = parseSessionTime(session.endTime);
      if (start && end) {
        durationMinutes = Math.round((end - start) / 60000); // ms to minutes
      }
    }
    
    return {
      sessionId,
      ...session,
      durationMinutes: durationMinutes || 0,
    };
  });
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

export async function setStudentRole(rfidUid, role) {
  await update(ref(db, `students/${rfidUid}`), { role });
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

// ── Bicycle management ─────────────────────────────────────────────────────

export async function getInUseBicycles() {
  try {
    // Get all active rides (sessions without endTime or with endTime = 'Active...')
    const sessions = await getAllRideSessions();
    
    const inUseBikes = [];
    sessions.forEach((session) => {
      if (!session.endTime || session.endTime === 'Active...') {
        if (session.bicycleId) {
          inUseBikes.push({
            id: session.bicycleId,
            bicycleId: session.bicycleId,
            status: 'in_use',
            startTime: session.startTime,
            riderRfid: session.rfidUid,
            sessionId: session.sessionId,
          });
        }
      }
    });

    return inUseBikes;
  } catch {
    return [];
  }
}
