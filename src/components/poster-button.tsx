import { Pressable, StyleSheet, Text } from "react-native";

import { colors, fonts, space } from "@/theme/tokens";

type Props = { label: string; onPress: () => void; color?: string; hint?: string };

/** Big flat block button in the poster style. */
export function PosterButton({ label, onPress, color = colors.yellow, hint }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint={hint}
      style={({ pressed }) => [styles.button, { backgroundColor: color }, pressed && styles.pressed]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 52, justifyContent: "center", alignItems: "center", paddingHorizontal: space.lg, borderWidth: 2, borderColor: colors.ink },
  pressed: { transform: [{ translateY: 2 }], opacity: 0.9 },
  label: { fontFamily: fonts.label, fontSize: 15, color: colors.ink, textTransform: "uppercase", textAlign: "center" },
});
