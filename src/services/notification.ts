import notifee, { AndroidForegroundServiceType, AndroidImportance } from '@notifee/react-native';
import { colors, DISTRACTIONS } from '../theme';
import { formatClock } from '../store/timer';

const TIMER_CHANNEL = 'focus-timer';
const DONE_CHANNEL = 'focus-done';
const TIMER_ID = 'focus-timer';

let channelsReady: Promise<unknown> | null = null;

function ensureChannels() {
  channelsReady ??= Promise.all([
    notifee.createChannel({ id: TIMER_CHANNEL, name: 'Focus timer', importance: AndroidImportance.LOW, vibration: false }),
    notifee.createChannel({ id: DONE_CHANNEL, name: 'Session complete', importance: AndroidImportance.HIGH }),
  ]);
  return channelsReady;
}

export function requestNotificationPermission() {
  return notifee.requestPermission();
}

type TimerView = { status: 'running' | 'paused'; purpose: string; elapsedMs: number };

export async function showTimerNotification(t: TimerView) {
  await ensureChannels();
  const running = t.status === 'running';
  await notifee.displayNotification({
    id: TIMER_ID,
    title: running ? t.purpose : `${t.purpose} · paused`,
    body: running ? `Stay off ${DISTRACTIONS.join(', ')}` : `${formatClock(t.elapsedMs)} focused`,
    android: {
      channelId: TIMER_CHANNEL,
      asForegroundService: true,
      foregroundServiceTypes: [AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_SPECIAL_USE],
      ongoing: true,
      onlyAlertOnce: true,
      smallIcon: 'ic_notification',
      largeIcon: require('../../assets/icon.png'),
      circularLargeIcon: true,
      color: colors.primary,
      showTimestamp: false,
      showChronometer: running,
      chronometerDirection: 'up',
      timestamp: running ? Date.now() - t.elapsedMs : undefined,
      pressAction: { id: 'default', launchActivity: 'default' },
      actions: [
        running
          ? { title: 'Pause', pressAction: { id: 'pause' } }
          : { title: 'Play', pressAction: { id: 'resume' } },
        // Opens the app so the restart confirmation can be shown there.
        { title: 'Restart', pressAction: { id: 'restart', launchActivity: 'default' } },
      ],
    },
  });
}

export async function hideTimerNotification() {
  await notifee.stopForegroundService();
  await notifee.cancelNotification(TIMER_ID);
}

export async function showDoneNotification(purpose: string, minutes: number) {
  await ensureChannels();
  await notifee.displayNotification({
    title: 'Session complete',
    body: `${minutes} min of ${purpose}. Nice work.`,
    android: {
      channelId: DONE_CHANNEL,
      smallIcon: 'ic_notification',
      color: colors.primary,
      pressAction: { id: 'default', launchActivity: 'default' },
    },
  });
}
