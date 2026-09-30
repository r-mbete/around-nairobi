import { Pressable, StyleSheet, Text, View } from "react-native";

import { useCache } from "@/data/cache";
import { timeAgo } from "@/data/events";
import { useNow } from "@/hooks/use-now";
import { useOnline } from "@/hooks/use-online";
import { syncNow, useSyncStatus } from "@/lib/sync";
import { colors, fonts, space } from "@/theme/tokens";

/** Shows when listings were last updated and a clear offline banner; never an endless spinner (O5). */
export function SyncStatus() {
  const online = useOnline();
  const status = useSyncStatus();
  const { lastSyncedAt } = useCache();
  const now = useNow(30_000);
  const updated = lastSyncedAt ? `Updated ${timeAgo(lastSyncedAt, now)}` : "Not downloaded yet";

  if (!online) {
    return (
      <View style={styles.offline} accessibilityRole="alert" accessibilityLiveRegion="polite">
        <Text style={styles.offlineTitle}>You&rsquo;re offline</Text>
        <Text style={styles.offlineBody}>
          {lastSyncedAt ? `Showing events saved on this phone. ${updated}.` : "Connect once to download this week's events."}
        </Text>
      </View>
    );
  }

  let message = updated;
  if (status.state === "syncing") message = lastSyncedAt ? `${updated} · Checking for changes…` : "Downloading this week's events…";
  if (status.state === "failed") {
    const wait = status.retryAt ? Math.max(0, Math.round((status.retryAt - now) / 60000)) : null;
    message = `${updated} · Couldn't update${wait !== null ? `, retrying ${wait < 1 ? "shortly" : `in ${wait} min`}` : ""}`;
  }

  return (
    <View style={styles.line} accessibilityLiveRegion="polite">
      <Text style={styles.lineText}>{message}</Text>
      {status.state === "failed" && (
        <Pressable onPress={() => void syncNow()} accessibilityRole="button" style={styles.retry} hitSlop={8}>
          <Text style={styles.retryText}>Retry now</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  offline: { backgroundColor: colors.cream, borderLeftWidth: 8, borderLeftColor: colors.orange, padding: space.md, gap: 2 },
  offlineTitle: { fontFamily: fonts.label, fontSize: 13, color: colors.ink, textTransform: "uppercase" },
  offlineBody: { fontFamily: fonts.body, fontSize: 14, lineHeight: 19, color: colors.ink },
  line: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: space.md },
  lineText: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18, color: colors.teal },
  retry: { minHeight: 44, justifyContent: "center" },
  retryText: { fontFamily: fonts.label, fontSize: 12, color: colors.yellow, textDecorationLine: "underline", textTransform: "uppercase" },
});
