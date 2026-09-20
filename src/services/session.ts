import notifee, { Event, EventType } from '@notifee/react-native';
import { logSession } from '../db/sessions';
import { MAX_MS, remainingMs, useTimer } from '../store/timer';
import { MIN_MINUTES } from '../theme';
import { hideTimerNotification, requestNotificationPermission, showDoneNotification, showTimerNotification } from './notification';
import { setRain } from './rain';

const get = () => useTimer.getState();

async function sync() {
  const s = get();
  setRain(s.status === 'running' && !s.muted);
  if (s.status === 'running' || s.status === 'paused') {
    await showTimerNotification({ status: s.status, purpose: s.purpose, endAt: s.endAt, remainingMs: s.remainingMs });
  } else {
    stopServiceLoop?.();
    await hideTimerNotification();
  }
}

function focusedSec() {
  const s = get();
  return (s.durationMs - remainingMs(s)) / 1000;
}

export async function startSession(purpose: string, durationMs: number) {
  await requestNotificationPermission();
  const ms = Math.min(Math.max(durationMs, MIN_MINUTES * 60 * 1000), MAX_MS);
  const now = Date.now();
  get().set({ status: 'running', purpose: purpose.trim(), durationMs: ms, startedAt: now, endAt: now + ms, remainingMs: ms });
  await sync();
}

export async function pauseSession() {
  const s = get();
  if (s.status !== 'running') return;
  s.set({ status: 'paused', remainingMs: remainingMs(s) });
  await sync();
}

export async function resumeSession() {
  const s = get();
  if (s.status !== 'paused') return;
  s.set({ status: 'running', endAt: Date.now() + s.remainingMs });
  await sync();
}

export async function restartSession() {
  const s = get();
  if (s.status !== 'running' && s.status !== 'paused') return;
  await logSession(s.purpose, s.startedAt, focusedSec(), false);
  await startSession(s.purpose, s.durationMs);
}

export async function stopSession() {
  const s = get();
  if (s.status === 'running' || s.status === 'paused') {
    await logSession(s.purpose, s.startedAt, focusedSec(), false);
  }
  s.set({ status: 'idle' });
  await sync();
}

export async function completeSession() {
  const s = get();
  if (s.status !== 'running') return;
  s.set({ status: 'finished', remainingMs: 0 });
  await Promise.all([
    logSession(s.purpose, s.startedAt, s.durationMs / 1000, true),
    sync(),
    showDoneNotification(s.purpose, Math.round(s.durationMs / 60000)),
  ]);
}

export function dismissFinished() {
  get().set({ status: 'idle' });
}

export async function toggleMute() {
  get().set({ muted: !get().muted });
  await sync();
}

async function hydrated() {
  if (!useTimer.persist.hasHydrated()) await useTimer.persist.rehydrate();
}

// Called on app launch: finishes a session that ran out while the app was dead, or restores its notification.
export async function recoverSession() {
  await hydrated();
  const s = get();
  if (s.status === 'running' && remainingMs(s) === 0) await completeSession();
  else if (s.status === 'running' || s.status === 'paused') await sync();
}

export async function handleNotificationEvent({ type, detail }: Event) {
  if (type !== EventType.ACTION_PRESS) return;
  await hydrated();
  switch (detail.pressAction?.id) {
    case 'pause':
      return pauseSession();
    case 'resume':
      return resumeSession();
    case 'restart':
      get().set({ restartPrompt: true });
  }
}

let stopServiceLoop: (() => void) | null = null;

// Runs while the foreground service is alive so the session completes even if no screen is mounted.
export function registerBackgroundHandlers() {
  notifee.onBackgroundEvent(handleNotificationEvent);
  notifee.registerForegroundService(
    () =>
      new Promise<void>((resolve) => {
        const id = setInterval(() => {
          const s = get();
          if (s.status === 'running' && remainingMs(s) === 0) completeSession();
        }, 1000);
        stopServiceLoop = () => {
          clearInterval(id);
          stopServiceLoop = null;
          resolve();
        };
      }),
  );
}
