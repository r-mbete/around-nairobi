import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { Chip } from "@/components/chip";
import { PosterButton } from "@/components/poster-button";
import type { ListedEvent } from "@/data/events";
import {
  availableReminders,
  REMINDER_LABELS,
  type ReminderOption,
  type ReminderResult,
  saveEvent,
  setReminder,
  unsaveEvent,
  useSaved,
} from "@/data/saved";
import { remindersSupported } from "@/lib/reminders";
import { colors, fonts, space } from "@/theme/tokens";

/** Save toggle plus the reminder choice (F11, F12). */
export function SavePanel({ event }: { event: ListedEvent }) {
  const entry = useSaved()[event.id];
  const [result, setResult] = useState<ReminderResult | null>(null);
  const cancelled = event.status === "cancelled";
  const options = availableReminders(event);

  if (!entry) {
    return (
      <PosterButton
        label="Save this event"
        color={colors.green}
        hint={remindersSupported && !cancelled ? "Saves it and sets a reminder" : undefined}
        onPress={async () => setResult(await saveEvent(event))}
      />
    );
  }

  const choose = async (option: ReminderOption | null) => setResult(await setReminder(event, option));

  return (
    <View style={styles.panel}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Saved</Text>
        <Pressable onPress={() => unsaveEvent(event.id)} accessibilityRole="button" style={styles.link} hitSlop={8}>
          <Text style={styles.linkText}>Remove</Text>
        </Pressable>
      </View>

      {!cancelled && remindersSupported && options.length > 0 && (
        <>
          <Text style={styles.label}>Remind me</Text>
          <View style={styles.chips} accessibilityRole="radiogroup">
            {options.map((o) => (
              <Chip key={o} label={REMINDER_LABELS[o]} selected={entry.reminder === o} onPress={() => choose(o)} />
            ))}
            <Chip label="No reminder" selected={entry.reminder === null} color={colors.cream} onPress={() => choose(null)} />
          </View>
        </>
      )}

      {result === "denied" && (
        <View style={styles.note}>
          <Text style={styles.noteText}>Notifications are off for this app, so we can&rsquo;t remind you.</Text>
          <Pressable onPress={() => Linking.openSettings()} accessibilityRole="button" style={styles.link}>
            <Text style={styles.linkText}>Open settings</Text>
          </Pressable>
        </View>
      )}
      {!remindersSupported && <Text style={styles.noteText}>Reminders work in the phone app.</Text>}
      {remindersSupported && !cancelled && options.length === 0 && (
        <Text style={styles.noteText}>It&rsquo;s starting soon, so there&rsquo;s no time left for a reminder.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { borderWidth: 2, borderColor: colors.green, padding: space.lg, gap: space.sm },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontFamily: fonts.label, fontSize: 16, color: colors.green, textTransform: "uppercase" },
  label: { fontFamily: fonts.label, fontSize: 12, letterSpacing: 1, color: colors.cream, textTransform: "uppercase", marginTop: space.xs },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  note: { gap: space.xs },
  noteText: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.cream },
  link: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  linkText: { fontFamily: fonts.label, fontSize: 12, color: colors.yellow, textDecorationLine: "underline", textTransform: "uppercase" },
});
