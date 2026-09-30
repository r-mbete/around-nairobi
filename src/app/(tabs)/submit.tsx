import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Chip } from "@/components/chip";
import { Field } from "@/components/field";
import { Frieze } from "@/components/frieze";
import { PosterButton } from "@/components/poster-button";
import { neighbourhoods, useCache } from "@/data/cache";
import { CATEGORIES, eatDayStart, formatDay } from "@/data/events";
import { enqueueSubmission, flushOutbox, isQueued, useOutbox } from "@/data/outbox";
import { BLANK, type Errors, type Form, toSubmission, validate } from "@/data/submission";
import { useOnline } from "@/hooks/use-online";
import { categoryColors, colors, fonts, space } from "@/theme/tokens";

const DAYS_AHEAD = 14;

function Queue() {
  const { queue } = useOutbox();
  const online = useOnline();
  if (queue.length === 0) return null;

  return (
    <View style={styles.queue} accessibilityLiveRegion="polite">
      <Text style={styles.queueTitle}>Waiting to send · {queue.length}</Text>
      {queue.map((q) => (
        <Text key={q.submission.id} style={styles.queueItem}>
          {q.submission.title}
        </Text>
      ))}
      <Text style={styles.queueNote}>
        {online ? "We'll keep trying. You can also try now." : "These send by themselves when you're back online."}
      </Text>
      {online && (
        <Pressable onPress={() => void flushOutbox()} accessibilityRole="button" style={styles.link} hitSlop={8}>
          <Text style={styles.linkText}>Try now</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function SubmitScreen() {
  const [form, setForm] = useState<Form>(BLANK);
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState<"sent" | "queued" | null>(null);
  const areas = neighbourhoods(useCache());

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = async () => {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    // Queue first so nothing is lost if the send fails or the app closes (F15).
    const submission = toSubmission(form);
    enqueueSubmission(submission);
    setForm(BLANK);
    await flushOutbox();
    setDone(isQueued(submission.id) ? "queued" : "sent");
  };

  const errorCount = Object.values(errors).filter(Boolean).length;
  const days = Array.from({ length: DAYS_AHEAD }, (_, i) => i);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <View style={styles.bleed}>
          <Frieze variant="eyes" />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          List your event
        </Text>
        <Text style={styles.intro}>
          Tell us about your gig, market or meetup. We review every event within 24 hours before it appears in the app.
        </Text>

        {done && (
          <View style={styles.done} accessibilityRole="alert">
            <Text style={styles.doneTitle}>{done === "sent" ? "Sent for review" : "Saved to send"}</Text>
            <Text style={styles.doneBody}>
              {done === "sent"
                ? "Thanks! We'll check it within 24 hours. If we can't approve it, we'll email you why."
                : "You're offline, so we'll send it automatically when you're back online."}
            </Text>
            <Pressable onPress={() => setDone(null)} accessibilityRole="button" style={styles.link}>
              <Text style={[styles.linkText, styles.linkOnCream]}>Submit another</Text>
            </Pressable>
          </View>
        )}

        <Queue />

        <Field label="Event title" value={form.title} onChangeText={(v) => set("title", v)} error={errors.title} maxLength={80} placeholder="e.g. Friday Jazz Night" />

        <Field label="Category" error={errors.category}>
          <View style={styles.chips}>
            {CATEGORIES.map((c) => (
              <Chip key={c} label={c} color={categoryColors[c]} selected={form.category === c} onPress={() => set("category", c)} />
            ))}
          </View>
        </Field>

        <Field label="Date" error={errors.dayOffset}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.dayChips}>
            {days.map((d) => (
              <Chip
                key={d}
                label={d === 0 ? "Today" : d === 1 ? "Tomorrow" : formatDay(new Date(eatDayStart(d)).toISOString())}
                selected={form.dayOffset === d}
                onPress={() => set("dayOffset", d)}
              />
            ))}
          </ScrollView>
        </Field>

        <View style={styles.row}>
          <View style={styles.half}>
            <Field label="Starts" value={form.start} onChangeText={(v) => set("start", v)} error={errors.start} placeholder="19:30" keyboardType="numbers-and-punctuation" maxLength={5} />
          </View>
          <View style={styles.half}>
            <Field label="Ends · optional" value={form.end} onChangeText={(v) => set("end", v)} error={errors.end} placeholder="22:00" keyboardType="numbers-and-punctuation" maxLength={5} />
          </View>
        </View>

        <Field label="Venue" value={form.venueName} onChangeText={(v) => set("venueName", v)} error={errors.venueName} placeholder="e.g. Kona Café" />

        <Field label="Neighbourhood" value={form.neighbourhood} onChangeText={(v) => set("neighbourhood", v)} error={errors.neighbourhood} placeholder="e.g. Westlands" />
        {areas.length > 0 && (
          <View style={styles.chips}>
            {areas.map((n) => (
              <Chip key={n} label={n} color={colors.teal} selected={form.neighbourhood === n} onPress={() => set("neighbourhood", n)} />
            ))}
          </View>
        )}

        <Field label="Address or landmark" value={form.address} onChangeText={(v) => set("address", v)} error={errors.address} placeholder="e.g. Ole Sangale Road, opposite the stage" />

        <Field label="Price" error={errors.price}>
          <View style={styles.chips}>
            <Chip label="Free" selected={form.free} onPress={() => set("free", true)} />
            <Chip label="Paid" selected={!form.free} onPress={() => set("free", false)} />
          </View>
        </Field>
        {!form.free && (
          <Field label="Price in KES" value={form.price} onChangeText={(v) => set("price", v.replace(/\D/g, ""))} placeholder="500" keyboardType="number-pad" />
        )}

        <Field
          label="Description"
          hint={`${form.description.length}/1000`}
          value={form.description}
          onChangeText={(v) => set("description", v)}
          error={errors.description}
          multiline
          maxLength={1000}
          placeholder="What happens, who it's for, what to bring"
        />

        <Field label="Link for tickets or info" value={form.link} onChangeText={(v) => set("link", v)} error={errors.link} placeholder="https://" keyboardType="url" autoCapitalize="none" autoCorrect={false} />

        <Field
          label="Your contact"
          hint="Phone or email. Only our moderators see this; it's never shown in the app."
          value={form.contact}
          onChangeText={(v) => set("contact", v)}
          error={errors.contact}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {errorCount > 0 && (
          <Text style={styles.summary} accessibilityRole="alert">
            {errorCount === 1 ? "1 thing needs fixing above." : `${errorCount} things need fixing above.`}
          </Text>
        )}
        <PosterButton label="Submit for review" color={colors.pink} onPress={submit} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xl * 2, gap: space.lg },
  bleed: { marginHorizontal: -space.lg },
  title: { fontFamily: fonts.display, fontSize: 44, lineHeight: 52, color: colors.pink },
  intro: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23, color: colors.cream, marginTop: -space.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  dayChips: { paddingHorizontal: space.lg, gap: space.sm },
  row: { flexDirection: "row", gap: space.md },
  half: { flex: 1 },
  done: { backgroundColor: colors.cream, borderLeftWidth: 8, borderLeftColor: colors.green, padding: space.lg, gap: space.xs },
  doneTitle: { fontFamily: fonts.label, fontSize: 15, color: colors.ink, textTransform: "uppercase" },
  doneBody: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.ink },
  queue: { borderWidth: 2, borderColor: colors.yellow, padding: space.lg, gap: space.xs },
  queueTitle: { fontFamily: fonts.label, fontSize: 14, color: colors.yellow, textTransform: "uppercase" },
  queueItem: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.cream },
  queueNote: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.cream },
  link: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  linkText: { fontFamily: fonts.label, fontSize: 12, color: colors.yellow, textDecorationLine: "underline", textTransform: "uppercase" },
  linkOnCream: { color: colors.ink },
  summary: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.orange },
});
