import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Chip } from "@/components/chip";
import { PosterButton } from "@/components/poster-button";
import { listEvents, neighbourhoods, useCache } from "@/data/cache";
import { CATEGORIES } from "@/data/events";
import { activeFilterCount, applyFilters, clearFilters, setFilters, toggle, useFilters } from "@/data/filters";
import { categoryColors, colors, fonts, space } from "@/theme/tokens";

export default function FiltersScreen() {
  const filters = useFilters();
  const data = useCache();
  const matches = applyFilters(listEvents(data), filters).length;
  // Keep chosen neighbourhoods visible even if this week has no events there.
  const areas = [...new Set([...neighbourhoods(data), ...filters.neighbourhoods])].sort();

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom", "left", "right"]}>
      <View style={styles.topBar}>
        <Text style={styles.title} accessibilityRole="header">Filters</Text>
        {activeFilterCount(filters) > 0 && (
          <Pressable onPress={clearFilters} accessibilityRole="button" style={styles.clear} hitSlop={8}>
            <Text style={styles.clearText}>Clear all</Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.groupTitle} accessibilityRole="header">Category</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={c}
              color={categoryColors[c]}
              selected={filters.categories.includes(c)}
              onPress={() => setFilters({ ...filters, categories: toggle(filters.categories, c) })}
            />
          ))}
        </View>

        <Text style={styles.groupTitle} accessibilityRole="header">Neighbourhood</Text>
        <View style={styles.chips}>
          {areas.map((n) => (
            <Chip
              key={n}
              label={n}
              color={colors.teal}
              selected={filters.neighbourhoods.includes(n)}
              onPress={() => setFilters({ ...filters, neighbourhoods: toggle(filters.neighbourhoods, n) })}
            />
          ))}
        </View>

        <Text style={styles.groupTitle} accessibilityRole="header">Price</Text>
        <View style={styles.chips}>
          <Chip label="Free only" selected={filters.freeOnly} onPress={() => setFilters({ ...filters, freeOnly: !filters.freeOnly })} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PosterButton
          label={matches === 1 ? "Show 1 event" : `Show ${matches} events`}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: space.lg, paddingTop: space.lg },
  title: { fontFamily: fonts.display, fontSize: 40, lineHeight: 48, color: colors.pink },
  clear: { minHeight: 44, justifyContent: "center" },
  clearText: { fontFamily: fonts.label, fontSize: 13, color: colors.cream, textDecorationLine: "underline", textTransform: "uppercase" },
  content: { padding: space.lg, gap: space.md },
  groupTitle: { fontFamily: fonts.label, fontSize: 14, letterSpacing: 1, color: colors.yellow, textTransform: "uppercase", marginTop: space.md },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  footer: { padding: space.lg, borderTopWidth: 2, borderTopColor: colors.teal },
});
