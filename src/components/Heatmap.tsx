import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DayStat, dayKey } from '../db/sessions';
import { colors, fonts, heatLevel, space } from '../theme';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type Props = {
  year: number;
  month: number;
  stats: Record<string, DayStat>;
  onPrev: () => void;
  onNext: () => void;
  canNext: boolean;
};

export function Heatmap({ year, month, stats, onPrev, onNext, canNext }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const today = dayKey(new Date());
  const cells: (Date | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7) cells.push(null);

  const monthMinutes = Object.values(stats).reduce((sum, d) => sum + d.minutes, 0);
  const sel = selected ? stats[selected] : undefined;
  const title = first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={() => { setSelected(null); onPrev(); }}>
          <Text style={styles.arrow}>‹</Text>
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.sub}>{formatMinutes(monthMinutes)} focused</Text>
        </View>
        <Pressable hitSlop={12} disabled={!canNext} onPress={() => { setSelected(null); onNext(); }}>
          <Text style={[styles.arrow, !canNext && { opacity: 0.2 }]}>›</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {WEEKDAYS.map((d, i) => (
          <View key={`w${i}`} style={styles.cellWrap}>
            <Text style={styles.weekday}>{d}</Text>
          </View>
        ))}
        {cells.map((date, i) => {
          if (!date) return <View key={`e${i}`} style={styles.cellWrap} />;
          const key = dayKey(date);
          const level = heatLevel(stats[key]?.minutes ?? 0);
          const isToday = key === today;
          const isSel = key === selected;
          return (
            <View key={key} style={styles.cellWrap}>
              <Pressable
                onPress={() => setSelected(isSel ? null : key)}
                style={[
                  styles.cell,
                  { backgroundColor: colors.heat[level] },
                  isToday && styles.today,
                  isSel && styles.selected,
                ]}
              >
                <Text style={[styles.dayNum, level >= 3 && { color: colors.bg }]}>{date.getDate()}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={styles.detail} numberOfLines={1}>
          {selected
            ? `${new Date(selected + 'T00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${
                sel ? `${formatMinutes(sel.minutes)} · ${sel.purposes.join(', ')}` : 'no focus time'
              }`
            : 'Tap a day for details'}
        </Text>
        <View style={styles.legend}>
          {colors.heat.map((c) => (
            <View key={c} style={[styles.legendDot, { backgroundColor: c }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

export function formatMinutes(min: number) {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: space.md,
    paddingTop: space.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.cardBorder,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.sm, marginBottom: space.md },
  arrow: { fontFamily: fonts.light, fontSize: 30, color: colors.cardText, lineHeight: 32, paddingHorizontal: space.sm },
  title: { fontFamily: fonts.semibold, fontSize: 16, color: colors.cardText },
  sub: { fontFamily: fonts.regular, fontSize: 12, color: colors.cardMuted, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cellWrap: { width: `${100 / 7}%`, aspectRatio: 1, padding: 3, alignItems: 'center', justifyContent: 'center' },
  weekday: { fontFamily: fonts.medium, fontSize: 11, color: colors.cardMuted },
  cell: { width: '100%', height: '100%', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  today: { borderWidth: 1.5, borderColor: 'rgba(238,242,251,0.55)' },
  selected: { transform: [{ scale: 1.08 }] },
  dayNum: { fontFamily: fonts.medium, fontSize: 11, color: colors.cardMuted },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.md, paddingHorizontal: space.xs },
  detail: { fontFamily: fonts.regular, fontSize: 12, color: colors.cardMuted, flex: 1, marginRight: space.sm },
  legend: { flexDirection: 'row', gap: 3 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
});
