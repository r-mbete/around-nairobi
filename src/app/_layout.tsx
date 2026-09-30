import { BagelFatOne_400Regular } from "@expo-google-fonts/bagel-fat-one";
import { Bungee_400Regular } from "@expo-google-fonts/bungee";
import { SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from "@expo-google-fonts/space-grotesk";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { configureNotifications, useNotificationTaps } from "@/lib/reminders";
import { startSync } from "@/lib/sync";
import { colors } from "@/theme/tokens";

SplashScreen.preventAutoHideAsync();
configureNotifications();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    BagelFatOne_400Regular,
    Bungee_400Regular,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  // Screens render from the on-device cache straight away; syncing happens behind them (O1).
  useEffect(() => startSync(), []);
  useNotificationTaps();

  // On a font error we still render with system fonts rather than block the app.
  if (!loaded && !error) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ink } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="event/[id]" />
        <Stack.Screen name="filters" options={{ presentation: "modal" }} />
      </Stack>
    </>
  );
}
