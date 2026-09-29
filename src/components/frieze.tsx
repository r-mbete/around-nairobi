import { StyleSheet, View } from "react-native";

import { colors } from "@/theme/tokens";

type Props = { variant?: "eyes" | "diamonds"; count?: number };

// Extra items are clipped by the band, so it fills any screen width at a fixed rhythm.
const DEFAULT_COUNT = 48;
const EYE = 26; // side of the square that becomes the almond

/** Decorative border strip, like the eye and diamond bands framing the poster. Hidden from screen readers. */
export function Frieze({ variant = "eyes", count = DEFAULT_COUNT }: Props) {
  return (
    <View
      style={[styles.band, variant === "eyes" ? styles.eyesBand : styles.diamondsBand]}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      aria-hidden
    >
      {Array.from({ length: count }, (_, i) =>
        variant === "eyes" ? (
          <View key={i} style={styles.eyeSlot}>
            <View style={styles.eye}>
              <View style={styles.iris}>
                <View style={styles.glint} />
              </View>
            </View>
          </View>
        ) : (
          <View key={i} style={i % 2 ? styles.dot : styles.diamond} />
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  band: { flexDirection: "row", alignItems: "center", overflow: "hidden", paddingHorizontal: 8 },
  eyesBand: { backgroundColor: colors.teal, height: 36, gap: 6 },
  diamondsBand: { backgroundColor: colors.ink, height: 20, gap: 18 },
  // Layout box matches the almond's visual width (the square's diagonal).
  eyeSlot: { width: EYE * Math.SQRT2, height: EYE, alignItems: "center", justifyContent: "center" },
  // A square rounded on two opposite corners is a lens; rotating it 45° points the corners left and right.
  eye: {
    width: EYE,
    height: EYE,
    backgroundColor: colors.cream,
    borderTopLeftRadius: EYE,
    borderBottomRightRadius: EYE,
    transform: [{ rotate: "45deg" }],
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  // Slightly taller than the almond so the lids clip it; counter-rotated so the glint sits upper right.
  iris: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: colors.ink,
    alignItems: "flex-end",
    justifyContent: "flex-start",
    padding: 3,
    transform: [{ rotate: "-45deg" }],
  },
  glint: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.cream },
  diamond: { width: 10, height: 10, backgroundColor: colors.yellow, transform: [{ rotate: "45deg" }] },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.orange },
});
