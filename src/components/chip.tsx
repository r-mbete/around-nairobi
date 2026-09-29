import { Pressable, StyleSheet, Text } from "react-native";

import { colors, fonts, space } from "@/theme/tokens";

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Fill colour when selected; defaults to yellow. */
  color?: string;
};

/** Sticker-style toggle chip with a 44pt touch target. */
export function Chip({ label, selected, onPress, color = colors.yellow }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.chip, selected && { backgroundColor: color, borderColor: colors.ink }, pressed && styles.pressed]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: space.md,
    borderWidth: 2,
    borderColor: colors.cream,
  },
  pressed: { opacity: 0.8 },
  label: { fontFamily: fonts.label, fontSize: 13, color: colors.cream, textTransform: "uppercase" },
  labelSelected: { color: colors.ink },
});
