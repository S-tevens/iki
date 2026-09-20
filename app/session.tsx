import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArtSlideshow } from '../src/components/ArtSlideshow';
import { TimerRing } from '../src/components/TimerRing';
import {
  completeSession,
  dismissFinished,
  pauseSession,
  restartSession,
  resumeSession,
  stopSession,
  toggleMute,
} from '../src/services/session';
import { elapsedMs, MAX_MS, useTimer } from '../src/store/timer';
import { colors, fonts, space } from '../src/theme';

export default function Session() {
  const insets = useSafeAreaInsets();
  const { status, purpose, baseMs, runSince, muted, restartPrompt } = useTimer();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (status !== 'running') return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [status]);

  const elapsed = elapsedMs({ status, baseMs, runSince }, now);

  useEffect(() => {
    if (status === 'running' && elapsed >= MAX_MS) completeSession();
  }, [status, elapsed]);

  useEffect(() => {
    if (status === 'idle') router.replace('/');
  }, [status]);

  const confirmRestart = () =>
    Alert.alert('Restart session?', 'The timer goes back to zero. Time so far is still saved.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Restart', style: 'destructive', onPress: restartSession },
    ]);

  const confirmStop = () =>
    Alert.alert('End session?', 'Your focused time will be saved.', [
      { text: 'Keep going', style: 'cancel' },
      { text: 'End', style: 'destructive', onPress: stopSession },
    ]);

  useEffect(() => {
    if (!restartPrompt) return;
    useTimer.getState().set({ restartPrompt: false });
    if (status === 'running' || status === 'paused') confirmRestart();
  }, [restartPrompt]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (status === 'finished') dismissFinished();
      else confirmStop();
      return true;
    });
    return () => sub.remove();
  }, [status]);

  const finished = status === 'finished';

  return (
    <View style={styles.root}>
      <ArtSlideshow active={status === 'running'} />

      <View style={[styles.top, { paddingTop: insets.top + space.md }]}>
        <Pressable hitSlop={12} onPress={finished ? dismissFinished : confirmStop} style={styles.iconBtn}>
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.purpose} numberOfLines={1}>
          {purpose}
        </Text>
        <Pressable hitSlop={12} onPress={toggleMute} style={styles.iconBtn}>
          <Ionicons name={muted ? 'volume-mute-outline' : 'rainy-outline'} size={22} color={colors.text} />
        </Pressable>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.xl }]}>
        {finished ? (
          <View style={styles.done}>
            <Text style={styles.doneTitle}>Two hours done</Text>
            <Text style={styles.doneSub}>
              {Math.round(elapsed / 60000)} minutes of {purpose}
            </Text>
            <Pressable style={styles.homeBtn} onPress={dismissFinished}>
              <Text style={styles.homeText}>Done</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <TimerRing elapsedMs={elapsed} capMs={MAX_MS} label={status === 'paused' ? 'paused' : 'focus'} />
            <View style={styles.controls}>
              <Pressable onPress={confirmRestart} style={styles.sideBtn} hitSlop={8}>
                <Ionicons name="refresh" size={22} color={colors.text} />
              </Pressable>
              <Pressable onPress={status === 'running' ? pauseSession : resumeSession} style={styles.mainBtn}>
                <Ionicons name={status === 'running' ? 'pause' : 'play'} size={30} color={colors.primary} />
              </Pressable>
              <Pressable onPress={confirmStop} style={styles.sideBtn} hitSlop={8}>
                <Ionicons name="stop" size={20} color={colors.text} />
              </Pressable>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, gap: space.md },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(10,22,51,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  purpose: { flex: 1, textAlign: 'center', fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  bottom: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', gap: space.xl },
  controls: { flexDirection: 'row', alignItems: 'center', gap: space.xl },
  sideBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(238,242,251,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainBtn: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  done: { alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg },
  doneTitle: { fontFamily: fonts.light, fontSize: 36, color: colors.text },
  doneSub: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted, textAlign: 'center' },
  homeBtn: { marginTop: space.lg, backgroundColor: colors.primary, borderRadius: 999, paddingVertical: 16, paddingHorizontal: 56 },
  homeText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
});
