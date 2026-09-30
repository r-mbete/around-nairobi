import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/theme/tokens";

type Props = { count: number; onPress: () => void };

/** Square filter icon button with a badge showing how many filters are on. */
export function FilterButton({ count, onPress }: Props) {
  const active = count > 0;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={active ? `Filters, ${count} active` : "Filters"}
      style={({ pressed }) => [styles.button, active && styles.active, pressed && styles.pressed]}
    >
      <SymbolView
        name={{ ios: "line.3.horizontal.decrease", android: "filter_list", web: "filter_list" }}
        size={26}
        tintColor={active ? colors.ink : colors.cream}
        fallback={<Text style={[styles.fallback, active && styles.fallbackActive]}>≡</Text>}
      />
      {active && (
        <View style={styles.badge}>
          <Text style={styles.badgeText} maxFontSizeMultiplier={1.2}>
            {count}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 52, height: 52, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.cream },
  active: { backgroundColor: colors.pink, borderColor: colors.pink },
  pressed: { opacity: 0.8 },
  badge: {
    position: "absolute",
    top: -8,
    right: -8,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 4,
    borderRadius: 11,
    backgroundColor: colors.yellow,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontFamily: fonts.label, fontSize: 11, color: colors.ink },
  fallback: { fontSize: 26, color: colors.cream },
  fallbackActive: { color: colors.ink },
});
