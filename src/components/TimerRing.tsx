import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { formatClock } from '../store/timer';
import { colors, fonts } from '../theme';

type Props = { remainingMs: number; totalMs: number; size?: number; label?: string };

export function TimerRing({ remainingMs, totalMs, size = 260, label }: Props) {
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const progress = totalMs ? remainingMs / totalMs : 0;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(238,242,251,0.14)" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.text}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - progress)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={styles.clock}>{formatClock(remainingMs)}</Text>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  clock: { fontFamily: fonts.light, fontSize: 64, color: colors.text, letterSpacing: -1, fontVariant: ['tabular-nums'] },
  label: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted, letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 },
});
