import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MAX_MINUTES } from '../theme';

export type Status = 'idle' | 'running' | 'paused' | 'finished';

type TimerState = {
  status: Status;
  purpose: string;
  startedAt: number;
  // Focus time banked before the current run segment, plus when that segment began.
  baseMs: number;
  runSince: number;
  muted: boolean;
  restartPrompt: boolean;
  set: (patch: Partial<TimerState>) => void;
};

export const MAX_MS = MAX_MINUTES * 60 * 1000;

export const useTimer = create<TimerState>()(
  persist(
    (set) => ({
      status: 'idle',
      purpose: '',
      startedAt: 0,
      baseMs: 0,
      runSince: 0,
      muted: false,
      restartPrompt: false,
      set: (patch) => set(patch),
    }),
    {
      name: 'iki-timer',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ restartPrompt, set, ...rest }) => rest,
      // v1 stored a countdown; drop any of it that's still on disk.
      migrate: (persisted: any) => ({ ...persisted, status: 'idle', baseMs: 0, runSince: 0, startedAt: 0 }),
    },
  ),
);

export function elapsedMs(s: Pick<TimerState, 'status' | 'baseMs' | 'runSince'>, now = Date.now()) {
  const raw = s.status === 'running' ? s.baseMs + (now - s.runSince) : s.baseMs;
  return Math.min(Math.max(raw, 0), MAX_MS);
}

export function formatClock(ms: number) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(h ? 2 : 1, '0');
  const ss = String(s).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
