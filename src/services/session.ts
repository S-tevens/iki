import notifee, { Event, EventType } from '@notifee/react-native';
import { logSession } from '../db/sessions';
import { elapsedMs, MAX_MS, useTimer } from '../store/timer';
import { hideTimerNotification, requestNotificationPermission, showDoneNotification, showTimerNotification } from './notification';
import { setRain } from './rain';

const get = () => useTimer.getState();

async function sync() {
  const s = get();
  setRain(s.status === 'running' && !s.muted);
  if (s.status === 'running' || s.status === 'paused') {
    await showTimerNotification({ status: s.status, purpose: s.purpose, elapsedMs: elapsedMs(s) });
  } else {
    stopServiceLoop?.();
    await hideTimerNotification();
  }
}

export async function startSession(purpose: string) {
  await requestNotificationPermission();
  const now = Date.now();
  get().set({ status: 'running', purpose: purpose.trim(), startedAt: now, baseMs: 0, runSince: now });
  await sync();
}

export async function pauseSession() {
  const s = get();
  if (s.status !== 'running') return;
  s.set({ status: 'paused', baseMs: elapsedMs(s), runSince: 0 });
  await sync();
}

export async function resumeSession() {
  const s = get();
  if (s.status !== 'paused') return;
  s.set({ status: 'running', runSince: Date.now() });
  await sync();
}

export async function restartSession() {
  const s = get();
  if (s.status !== 'running' && s.status !== 'paused') return;
  await logSession(s.purpose, s.startedAt, elapsedMs(s) / 1000, false);
  await startSession(s.purpose);
}

export async function stopSession() {
  const s = get();
  if (s.status === 'running' || s.status === 'paused') {
    await logSession(s.purpose, s.startedAt, elapsedMs(s) / 1000, false);
  }
  s.set({ status: 'idle', baseMs: 0, runSince: 0 });
  await sync();
}

// Only fires when the 2 hour cap is reached; a session normally ends with stopSession.
export async function completeSession() {
  const s = get();
  if (s.status !== 'running') return;
  s.set({ status: 'finished', baseMs: MAX_MS, runSince: 0 });
  await Promise.all([
    logSession(s.purpose, s.startedAt, MAX_MS / 1000, true),
    sync(),
    showDoneNotification(s.purpose, MAX_MS / 60000),
  ]);
}

export function dismissFinished() {
  get().set({ status: 'idle', baseMs: 0, runSince: 0 });
}

export async function toggleMute() {
  get().set({ muted: !get().muted });
  await sync();
}

async function hydrated() {
  if (!useTimer.persist.hasHydrated()) await useTimer.persist.rehydrate();
}

// Called on app launch: closes out a session that hit the cap while the app was dead, or restores its notification.
export async function recoverSession() {
  await hydrated();
  const s = get();
  if (s.status === 'running' && elapsedMs(s) >= MAX_MS) await completeSession();
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

// Runs while the foreground service is alive so the cap applies even with no screen mounted.
export function registerBackgroundHandlers() {
  notifee.onBackgroundEvent(handleNotificationEvent);
  notifee.registerForegroundService(
    () =>
      new Promise<void>((resolve) => {
        const id = setInterval(() => {
          const s = get();
          if (s.status === 'running' && elapsedMs(s) >= MAX_MS) completeSession();
        }, 1000);
        stopServiceLoop = () => {
          clearInterval(id);
          stopServiceLoop = null;
          resolve();
        };
      }),
  );
}
