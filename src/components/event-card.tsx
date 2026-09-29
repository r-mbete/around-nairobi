import { StyleSheet, Text, View } from "react-native";

import { type Event, formatTime, priceLabel } from "@/data/events";
import { categoryColors, colors, fonts, space } from "@/theme/tokens";

/** A poster tile: a coloured time block beside a cream info block (F2). */
export function EventCard({ event }: { event: Event }) {
  const time = formatTime(event.startsAt);
  const price = priceLabel(event.priceKes);
  const isFree = event.priceKes === null;

  return (
    <View
      style={styles.card}
      accessible
      accessibilityLabel={`${event.title}. ${event.category}. ${time} at ${event.venue}, ${event.neighbourhood}. ${price}.`}
    >
      <View style={[styles.timeTile, { backgroundColor: categoryColors[event.category] }]}>
        <Text style={styles.time} maxFontSizeMultiplier={1.6}>{time}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.category}>{event.category}</Text>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.details}>
          {event.venue} · {event.neighbourhood}
        </Text>
        <View style={[styles.price, isFree && styles.free]}>
          <Text style={styles.priceText}>{price}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", marginBottom: space.sm },
  timeTile: { width: 84, alignItems: "center", justifyContent: "center", padding: space.sm },
  time: { fontFamily: fonts.label, fontSize: 18, color: colors.ink },
  body: { flex: 1, backgroundColor: colors.cream, padding: space.lg, gap: space.xs },
  category: { fontFamily: fonts.label, fontSize: 11, letterSpacing: 1, color: colors.inkSoft, textTransform: "uppercase" },
  title: { fontFamily: fonts.bodyBold, fontSize: 19, lineHeight: 23, color: colors.ink },
  details: { fontFamily: fonts.body, fontSize: 14, lineHeight: 19, color: colors.inkSoft },
  price: { alignSelf: "flex-start", marginTop: space.xs, paddingHorizontal: space.sm, paddingVertical: 2, borderWidth: 2, borderColor: colors.ink },
  free: { backgroundColor: colors.yellow },
  priceText: { fontFamily: fonts.label, fontSize: 12, color: colors.ink },
});
