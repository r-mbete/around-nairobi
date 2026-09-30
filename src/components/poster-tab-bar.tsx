import type { BottomTabBarProps } from "expo-router/js-tabs";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useEffect, useState } from "react";
import { Keyboard, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Frieze } from "@/components/frieze";
import { useSaved } from "@/data/saved";
import { colors, fonts, space } from "@/theme/tokens";

type TabStyle = { label: string; icon: SymbolViewProps["name"]; color: string };

const TABS: Record<string, TabStyle> = {
  index: { label: "This week", icon: { ios: "calendar", android: "calendar_month", web: "calendar_month" }, color: colors.yellow },
  saved: { label: "Saved", icon: { ios: "bookmark.fill", android: "bookmark", web: "bookmark" }, color: colors.green },
  submit: { label: "Submit", icon: { ios: "plus.circle.fill", android: "add_circle", web: "add_circle" }, color: colors.pink },
};

/** Android resizes the screen for the keyboard, which would lift the bar over the form; hide it instead. */
function useKeyboardOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const show = Keyboard.addListener("keyboardDidShow", () => setOpen(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return open;
}

/** Bottom tab bar in the poster style: a diamond border, and the selected tab as a solid colour block. */
export function PosterTabBar({ state, navigation, insets }: BottomTabBarProps) {
  const changed = Object.values(useSaved()).filter((s) => s.change).length;
  const keyboardOpen = useKeyboardOpen();
  if (keyboardOpen) return null;

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.sm) }]}>
      <Frieze variant="diamonds" />
      <View style={styles.row} accessibilityRole="tablist">
        {state.routes.map((route, index) => {
          const tab = TABS[route.name];
          if (!tab) return null;
          const focused = state.index === index;
          const badge = route.name === "saved" && changed > 0 ? changed : null;

          const onPress = () => {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={badge ? `${tab.label}, ${badge} changed` : tab.label}
              style={({ pressed }) => [styles.tab, focused && { backgroundColor: tab.color }, pressed && styles.pressed]}
            >
              <View>
                <SymbolView
                  name={tab.icon}
                  size={24}
                  tintColor={focused ? colors.ink : colors.cream}
                  fallback={<View style={[styles.iconFallback, { backgroundColor: focused ? colors.ink : colors.cream }]} />}
                />
                {badge !== null && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText} maxFontSizeMultiplier={1.2}>
                      {badge}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.label, focused && styles.labelFocused]} numberOfLines={1} maxFontSizeMultiplier={1.4}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: colors.ink },
  row: { flexDirection: "row", gap: space.sm, paddingHorizontal: space.sm, paddingTop: space.sm },
  tab: { flex: 1, minHeight: 60, alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: space.sm },
  pressed: { opacity: 0.8 },
  label: { fontFamily: fonts.label, fontSize: 11, letterSpacing: 0.5, color: colors.cream, textTransform: "uppercase" },
  labelFocused: { color: colors.ink },
  iconFallback: { width: 18, height: 18, transform: [{ rotate: "45deg" }] },
  badge: {
    position: "absolute",
    top: -6,
    right: -12,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: colors.orange,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontFamily: fonts.label, fontSize: 10, color: colors.ink },
});
