import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, SectionList, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Chip } from "@/components/chip";
import { EventCard } from "@/components/event-card";
import { Frieze } from "@/components/frieze";
import { PosterButton } from "@/components/poster-button";
import { groupByDay, listEvents } from "@/data/events";
import { activeFilterCount, applyFilters, clearFilters, setFilters, useFilters } from "@/data/filters";
import { colors, fonts, space } from "@/theme/tokens";

type HeaderProps = { query: string; onQueryChange: (q: string) => void };

function Header({ query, onQueryChange }: HeaderProps) {
  const filters = useFilters();
  const count = activeFilterCount(filters);

  return (
    <View style={styles.header}>
      <Frieze variant="eyes" />
      <View style={styles.wordmark} accessibilityRole="header" accessible accessibilityLabel="Around Nairobi">
        <Text style={styles.around} maxFontSizeMultiplier={1.4}>Around</Text>
        <Text style={styles.nairobi} maxFontSizeMultiplier={1.3} adjustsFontSizeToFit numberOfLines={1}>
          Nairobi
        </Text>
      </View>
      <Text style={styles.tagline}>What&rsquo;s on this week</Text>

      <View style={styles.controls}>
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder="Search events, venues, organisers"
          placeholderTextColor={colors.inkSoft}
          style={styles.search}
          accessibilityLabel="Search events"
          returnKeyType="search"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        <View style={styles.filterRow}>
          <Link href="/filters" asChild>
            <Pressable
              style={({ pressed }) => [styles.filterButton, count > 0 && styles.filterButtonActive, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={count > 0 ? `Filters, ${count} active` : "Filters"}
            >
              <Text style={[styles.filterButtonText, count > 0 && styles.filterButtonTextActive]}>
                Filters{count > 0 ? ` · ${count}` : ""}
              </Text>
            </Pressable>
          </Link>
          <Chip label="Free only" selected={filters.freeOnly} onPress={() => setFilters({ ...filters, freeOnly: !filters.freeOnly })} />
        </View>
      </View>

      <Frieze variant="diamonds" />
    </View>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>Nothing here</Text>
      <Text style={styles.emptyBody}>
        {hasFilters ? "No events match your search or filters this week." : "No events are listed for this week yet."}
      </Text>
      {hasFilters && <PosterButton label="Clear filters" onPress={clearFilters} color={colors.teal} />}
    </View>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const filters = useFilters();
  const sections = groupByDay(applyFilters(listEvents(), filters, query));
  const hasFilters = activeFilterCount(filters) > 0 || query.trim() !== "";

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<Header query={query} onQueryChange={setQuery} />}
        ListEmptyComponent={<EmptyState hasFilters={hasFilters} />}
        renderSectionHeader={({ section }) => (
          <View style={styles.dayHeader} accessibilityRole="header">
            <Text style={styles.dayTitle}>{section.title}</Text>
            <Text style={styles.dayDate}>{section.date}</Text>
          </View>
        )}
        renderItem={({ item }) => <EventCard event={item} />}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  list: { paddingHorizontal: space.lg, paddingBottom: space.xl },
  header: { marginHorizontal: -space.lg, marginBottom: space.sm },
  wordmark: { paddingHorizontal: space.lg, paddingTop: space.lg },
  around: { fontFamily: fonts.label, fontSize: 18, letterSpacing: 4, color: colors.yellow, textTransform: "uppercase" },
  nairobi: { fontFamily: fonts.display, fontSize: 64, lineHeight: 72, color: colors.pink, textTransform: "uppercase" },
  tagline: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.cream, paddingHorizontal: space.lg },
  controls: { padding: space.lg, gap: space.md },
  search: {
    minHeight: 48,
    backgroundColor: colors.cream,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: space.md,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  filterButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: space.md, borderWidth: 2, borderColor: colors.cream },
  filterButtonActive: { backgroundColor: colors.pink, borderColor: colors.pink },
  filterButtonText: { fontFamily: fonts.label, fontSize: 13, color: colors.cream, textTransform: "uppercase" },
  filterButtonTextActive: { color: colors.ink },
  pressed: { opacity: 0.8 },
  dayHeader: { flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", columnGap: space.md, paddingTop: space.xl, paddingBottom: space.md },
  dayTitle: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, color: colors.yellow },
  dayDate: { fontFamily: fonts.label, fontSize: 13, letterSpacing: 1, color: colors.teal, textTransform: "uppercase" },
  empty: { paddingVertical: space.xl, gap: space.md },
  emptyTitle: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, color: colors.yellow },
  emptyBody: { fontFamily: fonts.body, fontSize: 16, lineHeight: 22, color: colors.cream },
});
