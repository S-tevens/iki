import { Inter_300Light, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, useFonts } from '@expo-google-fonts/inter';
import notifee from '@notifee/react-native';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { handleNotificationEvent, recoverSession } from '../src/services/session';
import { useTimer } from '../src/store/timer';
import { colors } from '../src/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Inter_300Light, Inter_400Regular, Inter_500Medium, Inter_600SemiBold });
  const [recovered, setRecovered] = useState(false);
  const status = useTimer((s) => s.status);
  const restartPrompt = useTimer((s) => s.restartPrompt);

  useEffect(() => {
    recoverSession().finally(() => setRecovered(true));
    return notifee.onForegroundEvent(handleNotificationEvent);
  }, []);

  const ready = fontsLoaded && recovered;

  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync();
    if (status !== 'idle') router.replace('/session');
  }, [ready]);

  // A Restart tap from the notification lands the user on the session screen, which owns the confirmation.
  useEffect(() => {
    if (ready && restartPrompt) router.navigate('/session');
  }, [ready, restartPrompt]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="setup" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="session" options={{ gestureEnabled: false }} />
      </Stack>
    </>
  );
}
