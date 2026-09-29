import { SectionList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EventCard } from "@/components/event-card";
import { Frieze } from "@/components/frieze";
import { EVENTS, groupByDay } from "@/data/events";
import { colors, fonts, space } from "@/theme/tokens";

function Header() {
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
      <Frieze variant="diamonds" />
    </View>
  );
}

export default function Home() {
  const sections = groupByDay(EVENTS);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={Header}
        renderSectionHeader={({ section }) => (
          <View style={styles.dayHeader} accessibilityRole="header">
            <Text style={styles.dayTitle}>{section.title}</Text>
            <Text style={styles.dayDate}>{section.date}</Text>
          </View>
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
  header: { marginHorizontal: -space.lg, marginBottom: space.sm },
  wordmark: { paddingHorizontal: space.lg, paddingTop: space.lg },
  around: { fontFamily: fonts.label, fontSize: 18, letterSpacing: 4, color: colors.yellow, textTransform: "uppercase" },
  nairobi: { fontFamily: fonts.display, fontSize: 64, lineHeight: 72, color: colors.pink, textTransform: "uppercase" },
  tagline: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.cream, paddingHorizontal: space.lg, paddingBottom: space.lg },
  dayHeader: { flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", columnGap: space.md, paddingTop: space.xl, paddingBottom: space.md },
  dayTitle: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, color: colors.yellow },
  dayDate: { fontFamily: fonts.label, fontSize: 13, letterSpacing: 1, color: colors.teal, textTransform: "uppercase" },
});
