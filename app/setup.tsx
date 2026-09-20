import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { recentPurposes } from '../src/db/sessions';
import { startSession } from '../src/services/session';
import { colors, DISTRACTIONS, fonts, space } from '../src/theme';

export default function Setup() {
  const insets = useSafeAreaInsets();
  const [purpose, setPurpose] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    recentPurposes().then(setRecent);
  }, []);

  const canStart = purpose.trim().length > 0;

  const start = async () => {
    await startSession(purpose);
    router.replace('/session');
  };

  const toggle = (app: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(app) ? next.delete(app) : next.add(app);
      return next;
    });

  return (
    <KeyboardAvoidingView behavior="height" style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.container, { paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.lg }]}
      >
        <Pressable hitSlop={12} onPress={() => router.back()}>
          <Text style={styles.close}>✕</Text>
        </Pressable>

        <Text style={styles.heading}>What are you{'\n'}focusing on?</Text>
        <TextInput
          value={purpose}
          onChangeText={setPurpose}
          placeholder="e.g. Organic chemistry, chapter 4"
          placeholderTextColor={colors.textFaint}
          style={styles.input}
          autoFocus
          maxLength={60}
          returnKeyType="done"
          onSubmitEditing={() => canStart && start()}
        />
        {recent.length > 0 && (
          <View style={styles.chips}>
            {recent.map((r) => (
              <Pressable key={r} onPress={() => setPurpose(r)} style={styles.chip}>
                <Text style={styles.chipText}>{r}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>STAY AWAY FROM</Text>
          {DISTRACTIONS.map((app) => {
            const on = checked.has(app);
            return (
              <Pressable key={app} onPress={() => toggle(app)} style={styles.appRow}>
                <Text style={[styles.appName, on && styles.appNameOn]}>{app}</Text>
                <View style={[styles.check, on && styles.checkOn]}>{on && <Text style={styles.checkMark}>✓</Text>}</View>
              </Pressable>
            );
          })}
          <Text style={styles.hint}>Tap each to promise yourself.</Text>
        </View>

        <Pressable
          disabled={!canStart}
          onPress={start}
          style={({ pressed }) => [styles.start, !canStart && { opacity: 0.35 }, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.startText}>Begin</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: space.lg, gap: space.lg },
  close: { fontSize: 20, color: colors.textMuted },
  heading: { fontFamily: fonts.light, fontSize: 34, color: colors.text, lineHeight: 42, letterSpacing: -0.5 },
  input: {
    fontFamily: fonts.regular,
    fontSize: 18,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceHigh,
    paddingVertical: space.sm,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: -space.sm },
  chip: { backgroundColor: colors.surface, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  section: { gap: space.sm, marginTop: space.sm },
  label: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted, letterSpacing: 2 },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceHigh,
  },
  appName: { fontFamily: fonts.regular, fontSize: 17, color: colors.text },
  appNameOn: { color: colors.textFaint, textDecorationLine: 'line-through' },
  check: { width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, borderColor: colors.textFaint, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkMark: { color: colors.text, fontSize: 14, fontFamily: fonts.semibold },
  hint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textFaint },
  start: { backgroundColor: colors.primary, borderRadius: 999, paddingVertical: 18, alignItems: 'center', marginTop: space.md },
  startText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text, letterSpacing: 0.5 },
});
