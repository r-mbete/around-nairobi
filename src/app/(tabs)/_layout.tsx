import { Tabs } from "expo-router/js-tabs";

import { PosterTabBar } from "@/components/poster-tab-bar";
import { colors } from "@/theme/tokens";

// JS tabs with a custom bar, so the tabs sit at the bottom and look the same on Android, iOS and web.
export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <PosterTabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.ink } }}>
      <Tabs.Screen name="index" options={{ title: "This week" }} />
      <Tabs.Screen name="saved" options={{ title: "Saved" }} />
      <Tabs.Screen name="submit" options={{ title: "Submit" }} />
    </Tabs>
  );
}
