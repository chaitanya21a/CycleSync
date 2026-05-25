import { ref, get, update } from 'firebase/database';
import { db } from './firebaseConfig';

const today = () => new Date().toISOString().slice(0, 10);

/** Format Date as Firebase session time: "YYYY-MM-DD HH:mm:ss" */
function formatSessionTime(date) {
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

function sessionAt(daysAgo, hour, minute) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function endAfter(startDate, durationMinutes) {
  const end = new Date(startDate);
  end.setMinutes(end.getMinutes() + durationMinutes);
  return formatSessionTime(end);
}

/**
 * Writes mock usage_logs + student stats for one rfidUid (Firebase RTDB schema).
 * Skips if history already exists.
 */
export async function seedMockRideData(rfidUid) {
  if (!rfidUid) throw new Error('rfidUid is required');

  const historyRef = ref(db, `usage_logs/${rfidUid}/history`);
  const existing = await get(historyRef);
  if (existing.exists() && Object.keys(existing.val()).length > 0) {
    return { skipped: true, reason: 'history already exists' };
  }

  const s1Start = sessionAt(2, 10, 0);
  const s2Start = sessionAt(1, 14, 30);
  const s3Start = sessionAt(0, 9, 15);

  const session1 = {
    startTime: formatSessionTime(s1Start),
    endTime: endAfter(s1Start, 15),
    durationMinutes: 15,
  };
  const session2 = {
    startTime: formatSessionTime(s2Start),
    endTime: endAfter(s2Start, 25),
    durationMinutes: 25,
  };
  const session3 = {
    startTime: formatSessionTime(s3Start),
    endTime: endAfter(s3Start, 18),
    durationMinutes: 18,
  };

  const lastSessionId = 'mock-session-003';

  await update(ref(db), {
    [`usage_logs/${rfidUid}/last_session_id`]: lastSessionId,
    [`usage_logs/${rfidUid}/history/mock-session-001`]: session1,
    [`usage_logs/${rfidUid}/history/mock-session-002`]: session2,
    [`usage_logs/${rfidUid}/history/mock-session-003`]: session3,
    [`students/${rfidUid}/totalRides`]: 3,
    [`students/${rfidUid}/dailyUsage`]: { date: today(), minutes: 18 },
    [`students/${rfidUid}/hasFine`]: true,
    [`students/${rfidUid}/violationCount`]: 1,
  });

  return {
    skipped: false,
    sessions: [
      { sessionId: 'mock-session-001', ...session1 },
      { sessionId: 'mock-session-002', ...session2 },
      { sessionId: 'mock-session-003', ...session3 },
    ],
  };
}

/** Seeds the only student in /students when exactly one exists. */
export async function seedMockRideDataForOnlyStudent() {
  const snap = await get(ref(db, 'students'));
  if (!snap.exists()) throw new Error('No students in Firebase');
  const entries = Object.entries(snap.val());
  if (entries.length !== 1) {
    throw new Error(`Expected 1 student, found ${entries.length}. Pass rfidUid to seedMockRideData instead.`);
  }
  const [rfidUid] = entries[0];
  return seedMockRideData(rfidUid);
}
