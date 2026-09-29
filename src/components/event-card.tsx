import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { type ListedEvent, formatTime, priceLabel } from "@/data/events";
import { categoryColors, colors, fonts, space } from "@/theme/tokens";

/** A poster tile: a coloured time block beside a cream info block (F2). Opens the event detail. */
export function EventCard({ event }: { event: ListedEvent }) {
  const time = formatTime(event.startsAt);
  const price = priceLabel(event.priceKes);
  const isFree = event.priceKes === null;
  const cancelled = event.status === "cancelled";

  return (
    <Link href={{ pathname: "/event/[id]", params: { id: event.id } }} asChild>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`${cancelled ? "Cancelled. " : ""}${event.title}. ${event.category}. ${time} at ${event.venue.name}, ${event.venue.neighbourhood}. ${price}.`}
        accessibilityHint="Opens event details"
      >
        <View style={[styles.timeTile, { backgroundColor: cancelled ? colors.inkSoft : categoryColors[event.category] }]}>
          <Text style={[styles.time, cancelled && styles.timeCancelled]} maxFontSizeMultiplier={1.6}>
            {time}
          </Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.category}>{event.category}</Text>
          <Text style={[styles.title, cancelled && styles.struck]}>{event.title}</Text>
          <Text style={styles.details}>
            {event.venue.name} · {event.venue.neighbourhood}
          </Text>
          <View style={styles.tags}>
            {cancelled ? (
              <View style={[styles.tag, styles.cancelledTag]}>
                <Text style={[styles.tagText, styles.cancelledText]}>Cancelled</Text>
              </View>
            ) : (
              <View style={[styles.tag, isFree && styles.free]}>
                <Text style={styles.tagText}>{price}</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", marginBottom: space.sm },
  pressed: { opacity: 0.85 },
  timeTile: { width: 84, alignItems: "center", justifyContent: "center", padding: space.sm },
  time: { fontFamily: fonts.label, fontSize: 18, color: colors.ink },
  timeCancelled: { color: colors.cream },
  body: { flex: 1, backgroundColor: colors.cream, padding: space.lg, gap: space.xs },
  category: { fontFamily: fonts.label, fontSize: 11, letterSpacing: 1, color: colors.inkSoft, textTransform: "uppercase" },
  title: { fontFamily: fonts.bodyBold, fontSize: 19, lineHeight: 23, color: colors.ink },
  struck: { textDecorationLine: "line-through" },
  details: { fontFamily: fonts.body, fontSize: 14, lineHeight: 19, color: colors.inkSoft },
  tags: { flexDirection: "row", marginTop: space.xs },
  tag: { paddingHorizontal: space.sm, paddingVertical: 2, borderWidth: 2, borderColor: colors.ink },
  free: { backgroundColor: colors.yellow },
  cancelledTag: { backgroundColor: colors.ink },
  tagText: { fontFamily: fonts.label, fontSize: 12, color: colors.ink },
  cancelledText: { color: colors.cream },
});
