import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MAX_MINUTES } from '../theme';

export type Status = 'idle' | 'running' | 'paused' | 'finished';

type TimerState = {
  status: Status;
  purpose: string;
  durationMs: number;
  startedAt: number;
  endAt: number;
  remainingMs: number;
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
      durationMs: 25 * 60 * 1000,
      startedAt: 0,
      endAt: 0,
      remainingMs: 0,
      muted: false,
      restartPrompt: false,
      set: (patch) => set(patch),
    }),
    {
      name: 'iki-timer',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ restartPrompt, set, ...rest }) => rest,
    },
  ),
);

export function remainingMs(s: Pick<TimerState, 'status' | 'endAt' | 'remainingMs'>, now = Date.now()) {
  if (s.status === 'running') return Math.max(0, s.endAt - now);
  if (s.status === 'paused') return s.remainingMs;
  return 0;
}

export function formatClock(ms: number) {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(h ? 2 : 1, '0');
  const ss = String(s).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
