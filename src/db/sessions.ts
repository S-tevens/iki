import * as SQLite from 'expo-sqlite';
import { MAX_MINUTES } from '../theme';

const db = SQLite.openDatabaseSync('iki.db');

db.execSync(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purpose TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    day TEXT NOT NULL,
    duration_sec INTEGER NOT NULL,
    completed INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_day ON sessions(day);
`);

export function dayKey(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export async function logSession(purpose: string, startedAt: number, durationSec: number, completed: boolean) {
  const secs = Math.min(Math.round(durationSec), MAX_MINUTES * 60);
  if (secs < 30) return;
  await db.runAsync(
    'INSERT INTO sessions (purpose, started_at, day, duration_sec, completed) VALUES (?, ?, ?, ?, ?)',
    purpose,
    startedAt,
    dayKey(new Date(startedAt)),
    secs,
    completed ? 1 : 0,
  );
}

export type DayStat = { day: string; minutes: number; purposes: string[] };

export async function monthStats(year: number, month: number): Promise<Record<string, DayStat>> {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}-%`;
  const rows = await db.getAllAsync<{ day: string; secs: number; purposes: string }>(
    `SELECT day, SUM(duration_sec) AS secs, GROUP_CONCAT(DISTINCT purpose) AS purposes
     FROM sessions WHERE day LIKE ? GROUP BY day`,
    prefix,
  );
  const out: Record<string, DayStat> = {};
  for (const r of rows) {
    out[r.day] = { day: r.day, minutes: Math.round(r.secs / 60), purposes: r.purposes ? r.purposes.split(',') : [] };
  }
  return out;
}

export async function recentPurposes(limit = 4): Promise<string[]> {
  const rows = await db.getAllAsync<{ purpose: string }>(
    'SELECT purpose FROM sessions GROUP BY purpose ORDER BY MAX(started_at) DESC LIMIT ?',
    limit,
  );
  return rows.map((r) => r.purpose);
}
