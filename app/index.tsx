import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatMinutes, Heatmap } from '../src/components/Heatmap';
import { DayStat, dayKey, monthStats } from '../src/db/sessions';
import { colors, fonts, space } from '../src/theme';

export default function Home() {
  const insets = useSafeAreaInsets();
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [stats, setStats] = useState<Record<string, DayStat>>({});
  const [todayMin, setTodayMin] = useState(0);

  useFocusEffect(
    useCallback(() => {
      monthStats(cursor.year, cursor.month).then(setStats);
      const t = new Date();
      monthStats(t.getFullYear(), t.getMonth()).then((s) => setTodayMin(s[dayKey(t)]?.minutes ?? 0));
    }, [cursor]),
  );

  const shift = (delta: number) =>
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  const canNext = cursor.year < now.getFullYear() || (cursor.year === now.getFullYear() && cursor.month < now.getMonth());

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.xl }]}
    >
      <View style={styles.brand}>
        <Image source={require('../assets/icon.png')} style={styles.logo} />
        <Text style={styles.wordmark}>iki</Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>TODAY</Text>
        <Text style={styles.heroValue}>{formatMinutes(todayMin)}</Text>
        <Text style={styles.heroSub}>{todayMin ? 'of deep focus' : 'Nothing yet. Start small.'}</Text>
      </View>

      <Pressable style={({ pressed }) => [styles.start, pressed && { opacity: 0.85 }]} onPress={() => router.push('/setup')}>
        <Text style={styles.startText}>Start focus</Text>
      </Pressable>

      <Heatmap year={cursor.year} month={cursor.month} stats={stats} onPrev={() => shift(-1)} onNext={() => shift(1)} canNext={canNext} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: space.lg, gap: space.lg },
  brand: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  logo: { width: 32, height: 32, borderRadius: 10 },
  wordmark: { fontFamily: fonts.semibold, fontSize: 20, color: colors.text, letterSpacing: 1 },
  hero: { paddingVertical: space.lg },
  heroLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted, letterSpacing: 2 },
  heroValue: { fontFamily: fonts.light, fontSize: 64, color: colors.text, letterSpacing: -1, marginTop: space.xs },
  heroSub: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  start: { backgroundColor: colors.primary, borderRadius: 999, paddingVertical: 18, alignItems: 'center' },
  startText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text, letterSpacing: 0.5 },
});
