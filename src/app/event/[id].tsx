import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import type { ReactNode } from "react";
import { Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Frieze } from "@/components/frieze";
import { PosterButton } from "@/components/poster-button";
import { formatDay, formatTime, getEvent, type ListedEvent, priceLabel } from "@/data/events";
import { categoryColors, colors, fonts, space } from "@/theme/tokens";

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}

/** Google Maps directions URL; opens the Maps app when installed, the browser otherwise (F7). */
function directionsUrl(e: ListedEvent) {
  return `https://www.google.com/maps/dir/?api=1&destination=${e.venue.lat},${e.venue.lng}`;
}

/** Plain-text summary that reads well in WhatsApp (F8). */
function shareMessage(e: ListedEvent) {
  return [
    `*${e.title}*`,
    `${formatDay(e.startsAt)}, ${formatTime(e.startsAt)}`,
    `${e.venue.name}, ${e.venue.neighbourhood}`,
    priceLabel(e.priceKes),
    e.link,
  ].join("\n");
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {children}
    </View>
  );
}

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = getEvent(id);

  if (!event) {
    return (
      <SafeAreaView style={[styles.screen, styles.missing]}>
        <Text style={styles.missingTitle}>Event not found</Text>
        <Text style={styles.missingBody}>It may have ended or been removed.</Text>
        <PosterButton label="Back to this week" onPress={() => router.replace("/")} />
      </SafeAreaView>
    );
  }

  const cancelled = event.status === "cancelled";
  const tile = cancelled ? colors.inkSoft : categoryColors[event.category];
  const tileText = cancelled ? colors.cream : colors.ink;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Frieze variant="eyes" />
        <View style={[styles.hero, { backgroundColor: tile }]}>
          <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel="Back" style={styles.back} hitSlop={8}>
            <Text style={[styles.backText, { color: tileText }]}>← Back</Text>
          </Pressable>
          <Text style={[styles.category, { color: tileText }]}>{event.category}</Text>
          <Text style={[styles.title, { color: tileText }]} accessibilityRole="header">
            {event.title}
          </Text>
          <Text style={[styles.when, { color: tileText }]}>
            {formatDay(event.startsAt)} · {formatTime(event.startsAt)}–{formatTime(event.endsAt)}
          </Text>
        </View>

        {cancelled && (
          <View style={styles.cancelled} accessibilityRole="alert">
            <Text style={styles.cancelledText}>This event has been cancelled</Text>
          </View>
        )}

        <View style={styles.panel}>
          <Row label="Where">
            <Text style={styles.strong}>{event.venue.name}</Text>
            <Text style={styles.body}>
              {event.venue.address} · {event.venue.neighbourhood}
            </Text>
          </Row>
          <Row label="Price">
            <Text style={styles.strong}>{priceLabel(event.priceKes)}</Text>
          </Row>
          <Row label="Organiser">
            <Text style={styles.strong}>{event.organiser}</Text>
          </Row>
          <Row label="About">
            <Text style={styles.body}>{event.description}</Text>
          </Row>
        </View>

        <View style={styles.actions}>
          <PosterButton
            label="Get directions"
            color={colors.yellow}
            hint="Opens Google Maps"
            onPress={() => Linking.openURL(directionsUrl(event))}
          />
          <PosterButton label="Share" color={colors.pink} onPress={() => Share.share({ message: shareMessage(event) })} />
          <PosterButton
            label={event.priceKes === null ? "More info" : "Tickets & info"}
            color={colors.teal}
            hint="Opens the organiser's page"
            onPress={() => WebBrowser.openBrowserAsync(event.link)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  scroll: { paddingBottom: space.xl },
  hero: { padding: space.lg, paddingTop: space.sm, gap: space.sm },
  back: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  backText: { fontFamily: fonts.label, fontSize: 14, textTransform: "uppercase" },
  category: { fontFamily: fonts.label, fontSize: 13, letterSpacing: 1, textTransform: "uppercase" },
  title: { fontFamily: fonts.display, fontSize: 40, lineHeight: 46 },
  when: { fontFamily: fonts.label, fontSize: 15 },
  cancelled: { backgroundColor: colors.cream, padding: space.md, borderLeftWidth: 8, borderLeftColor: colors.orange },
  cancelledText: { fontFamily: fonts.label, fontSize: 14, color: colors.ink, textTransform: "uppercase" },
  panel: { backgroundColor: colors.cream, margin: space.lg, marginBottom: 0, padding: space.lg, gap: space.lg },
  row: { gap: space.xs },
  rowLabel: { fontFamily: fonts.label, fontSize: 11, letterSpacing: 1, color: colors.inkSoft, textTransform: "uppercase" },
  strong: { fontFamily: fonts.bodyBold, fontSize: 17, lineHeight: 22, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23, color: colors.ink },
  actions: { padding: space.lg, gap: space.sm },
  missing: { padding: space.lg, gap: space.md, justifyContent: "center" },
  missingBody: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23, color: colors.cream },
  missingTitle: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, color: colors.yellow },
});
