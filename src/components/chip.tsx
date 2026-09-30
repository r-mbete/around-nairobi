import { SymbolView } from "expo-symbols";
import { Pressable, type StyleProp, StyleSheet, Text, type ViewStyle } from "react-native";

import { colors, fonts, space } from "@/theme/tokens";

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Fill colour when selected; defaults to yellow. */
  color?: string;
  /** Shows a × and reads as "Remove filter" to screen readers. */
  removable?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Sticker-style toggle chip with a 44pt touch target. */
export function Chip({ label, selected, onPress, color = colors.yellow, removable = false, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={removable ? "button" : "checkbox"}
      accessibilityState={removable ? undefined : { checked: selected }}
      accessibilityLabel={removable ? `Remove filter: ${label}` : label}
      style={({ pressed }) => [styles.chip, style, selected && { backgroundColor: color, borderColor: color }, pressed && styles.pressed]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
      {removable && (
        <SymbolView
          name={{ ios: "xmark", android: "close", web: "close" }}
          size={14}
          weight="bold"
          tintColor={selected ? colors.ink : colors.cream}
          fallback={<Text style={[styles.label, selected && styles.labelSelected]}>×</Text>}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.xs,
    paddingHorizontal: space.md,
    borderWidth: 2,
    borderColor: colors.cream,
  },
  pressed: { opacity: 0.8 },
  label: { fontFamily: fonts.label, fontSize: 13, color: colors.cream, textTransform: "uppercase" },
  labelSelected: { color: colors.ink },
});
