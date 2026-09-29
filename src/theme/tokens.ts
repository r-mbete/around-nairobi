import type { Category } from "@/data/events";

/** Palette pulled from the riso-print poster reference: flat, saturated blocks on deep navy. */
export const colors = {
  ink: "#14213D",
  inkSoft: "#3A4A6B",
  cream: "#F6EBD2",
  pink: "#F2548F",
  orange: "#F2622E",
  yellow: "#F7C530",
  teal: "#2BB5A8",
  green: "#6CC070",
  sky: "#7FC4E8",
  violet: "#C77DDB",
} as const;

/** Display = poster lettering, label = signage/stickers, body = everything people read. */
export const fonts = {
  display: "BagelFatOne_400Regular",
  label: "Bungee_400Regular",
  body: "SpaceGrotesk_400Regular",
  bodyMedium: "SpaceGrotesk_500Medium",
  bodyBold: "SpaceGrotesk_700Bold",
} as const;

// Every tile colour keeps ink text above WCAG AA 4.5:1.
export const categoryColors: Record<Category, string> = {
  Music: colors.pink,
  Arts: colors.orange,
  "Food & Markets": colors.yellow,
  Talks: colors.teal,
  Sport: colors.green,
  Community: colors.sky,
  Nightlife: colors.violet,
  Family: colors.yellow,
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
