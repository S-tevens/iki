import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ART } from '../../assets/art';
import { colors } from '../theme';

const INTERVAL_MS = 20000;
const FADE_MS = 1800;

function shuffled<T>(items: T[]) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ArtSlideshow({ active }: { active: boolean }) {
  const order = useMemo(() => shuffled(ART), []);
  const [srcA, setSrcA] = useState(order[0]);
  const [srcB, setSrcB] = useState(order[0]);
  const pos = useRef(0);
  const pending = useRef<0 | 1 | null>(null);
  const showingB = useRef(false);
  const fade = useSharedValue(0);

  useEffect(() => {
    if (!active || order.length < 2) return;
    const id = setInterval(() => {
      pos.current = (pos.current + 1) % order.length;
      const next = order[pos.current];
      if (showingB.current) {
        pending.current = 0;
        setSrcA(next);
      } else {
        pending.current = 1;
        setSrcB(next);
      }
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [active, order]);

  // Only crossfade once the hidden layer has decoded its new image, so there's never a flash.
  const onLoaded = (layer: 0 | 1) => {
    if (pending.current !== layer) return;
    pending.current = null;
    showingB.current = layer === 1;
    fade.value = withTiming(layer, { duration: FADE_MS, easing: Easing.inOut(Easing.quad) });
  };

  const bStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image source={srcA} style={styles.img} resizeMode="cover" onLoad={() => onLoaded(0)} />
      <Animated.View style={[StyleSheet.absoluteFill, bStyle]}>
        <Image source={srcB} style={styles.img} resizeMode="cover" onLoad={() => onLoaded(1)} />
      </Animated.View>
      <LinearGradient
        colors={['rgba(10,22,51,0.15)', 'rgba(10,22,51,0.35)', colors.bg]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  img: { width: '100%', height: '100%' },
});
