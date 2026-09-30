import { SectionList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EventCard } from "@/components/event-card";
import { Frieze } from "@/components/frieze";
import { getEvent, useCache } from "@/data/cache";
import type { ListedEvent } from "@/data/events";
import { useSaved } from "@/data/saved";
import { useNow } from "@/hooks/use-now";
import { colors, fonts, space } from "@/theme/tokens";

export default function SavedScreen() {
  const data = useCache();
  const saved = useSaved();
  const now = useNow();

  const events = Object.keys(saved)
    .map((id) => getEvent(data, id))
    .filter((e): e is ListedEvent => e !== null)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  // Ended events stay under "Past" until the cache prunes them 7 days later (F17).
  const upcoming = events.filter((e) => Date.parse(e.endsAt) > now);
  const past = events.filter((e) => Date.parse(e.endsAt) <= now).reverse();
  const sections = [
    { key: "upcoming", title: "Coming up", data: upcoming },
    { key: "past", title: "Past", data: past },
  ].filter((s) => s.data.length > 0);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <Frieze variant="eyes" />
            <Text style={styles.title} accessibilityRole="header">
              Saved
            </Text>
            <Text style={styles.subtitle}>Kept on this phone, with or without data.</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nothing saved yet</Text>
            <Text style={styles.emptyBody}>Open any event and tap Save this event. We&rsquo;ll remind you before it starts.</Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle} accessibilityRole="header">
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => <EventCard event={item} />}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  list: { paddingHorizontal: space.lg, paddingBottom: space.xl },
  header: { marginHorizontal: -space.lg, gap: space.sm, paddingBottom: space.sm },
  title: { fontFamily: fonts.display, fontSize: 48, lineHeight: 56, color: colors.pink, paddingHorizontal: space.lg, paddingTop: space.lg },
  subtitle: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.cream, paddingHorizontal: space.lg },
  sectionTitle: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, color: colors.yellow, paddingTop: space.xl, paddingBottom: space.md },
  empty: { paddingVertical: space.xl, gap: space.md },
  emptyTitle: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, color: colors.yellow },
  emptyBody: { fontFamily: fonts.body, fontSize: 16, lineHeight: 22, color: colors.cream },
});
