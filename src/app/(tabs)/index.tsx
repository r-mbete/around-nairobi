import { router } from "expo-router";
import { useState } from "react";
import { RefreshControl, ScrollView, SectionList, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Chip } from "@/components/chip";
import { EventCard } from "@/components/event-card";
import { FilterButton } from "@/components/filter-button";
import { Frieze } from "@/components/frieze";
import { PosterButton } from "@/components/poster-button";
import { SyncStatus } from "@/components/sync-status";
import { listEvents, useCache } from "@/data/cache";
import { groupByDay } from "@/data/events";
import { activeFilterCount, applyFilters, clearFilters, setFilters, toggle, useFilters } from "@/data/filters";
import { syncNow } from "@/lib/sync";
import { categoryColors, colors, fonts, space } from "@/theme/tokens";

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
        <SyncStatus />
        <View style={styles.searchRow}>
          <TextInput
            value={query}
            onChangeText={onQueryChange}
            placeholder="Search events, venues…"
            placeholderTextColor={colors.inkSoft}
            style={styles.search}
            accessibilityLabel="Search events, venues and organisers"
            returnKeyType="search"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          <FilterButton count={count} onPress={() => router.push("/filters")} />
        </View>

        {/* Quick toggle plus one removable chip per active filter, so it's always clear what's narrowing the list. */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickChips} style={styles.quickChipsScroll}>
          <Chip label="Free only" selected={filters.freeOnly} onPress={() => setFilters({ ...filters, freeOnly: !filters.freeOnly })} />
          {filters.categories.map((c) => (
            <Chip
              key={c}
              label={c}
              color={categoryColors[c]}
              selected
              removable
              onPress={() => setFilters({ ...filters, categories: toggle(filters.categories, c) })}
            />
          ))}
          {filters.neighbourhoods.map((n) => (
            <Chip
              key={n}
              label={n}
              color={colors.teal}
              selected
              removable
              onPress={() => setFilters({ ...filters, neighbourhoods: toggle(filters.neighbourhoods, n) })}
            />
          ))}
        </ScrollView>
      </View>

      <Frieze variant="diamonds" />
    </View>
  );
}

function EmptyState({ hasFilters, everSynced }: { hasFilters: boolean; everSynced: boolean }) {
  let body = "No events are listed for this week yet.";
  if (!everSynced) body = "This week's events will appear here once they've downloaded. After that they work with no data.";
  if (hasFilters) body = "No events match your search or filters this week.";

  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{everSynced || hasFilters ? "Nothing here" : "Almost there"}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {hasFilters && <PosterButton label="Clear filters" onPress={clearFilters} color={colors.teal} />}
    </View>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const filters = useFilters();
  const data = useCache();
  const sections = groupByDay(applyFilters(listEvents(data), filters, query));
  const hasFilters = activeFilterCount(filters) > 0 || query.trim() !== "";

  const refresh = async () => {
    setRefreshing(true);
    await syncNow();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<Header query={query} onQueryChange={setQuery} />}
        ListEmptyComponent={<EmptyState hasFilters={hasFilters} everSynced={data.lastSyncedAt !== null} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.yellow} colors={[colors.ink]} progressBackgroundColor={colors.yellow} />}
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
  controls: { paddingHorizontal: space.lg, paddingTop: space.xl, paddingBottom: space.xl, gap: space.md },
  searchRow: { flexDirection: "row", alignItems: "center", gap: space.md },
  search: {
    flex: 1,
    minHeight: 52,
    backgroundColor: colors.cream,
    paddingHorizontal: space.md,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
  // Bleeds to the screen edges so chips scroll off-screen rather than being cut at the padding.
  quickChipsScroll: { marginHorizontal: -space.lg },
  quickChips: { paddingHorizontal: space.lg, gap: space.sm },
  dayHeader: { flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", columnGap: space.md, paddingTop: space.xl, paddingBottom: space.md },
  dayTitle: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, color: colors.yellow },
  dayDate: { fontFamily: fonts.label, fontSize: 13, letterSpacing: 1, color: colors.teal, textTransform: "uppercase" },
  empty: { paddingVertical: space.xl, gap: space.md },
  emptyTitle: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, color: colors.yellow },
  emptyBody: { fontFamily: fonts.body, fontSize: 16, lineHeight: 22, color: colors.cream },
});
