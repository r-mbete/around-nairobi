import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Platform } from "react-native";

import { useSaved } from "@/data/saved";
import { colors, fonts } from "@/theme/tokens";

// Android and web draw a yellow pill behind the selected icon, so the icon goes ink there; iOS has no pill.
const selectedIcon = Platform.OS === "ios" ? colors.yellow : colors.ink;

export default function TabsLayout() {
  const changed = Object.values(useSaved()).filter((s) => s.change).length;

  return (
    <NativeTabs
      backgroundColor={colors.ink}
      tintColor={colors.yellow}
      indicatorColor={colors.yellow}
      iconColor={{ default: colors.cream, selected: selectedIcon }}
      labelStyle={{ default: { color: colors.cream, fontFamily: fonts.bodyMedium }, selected: { color: colors.yellow, fontFamily: fonts.bodyBold } }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
        <NativeTabs.Trigger.Label>This week</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="saved">
        <NativeTabs.Trigger.Icon sf="bookmark" md="bookmark" />
        <NativeTabs.Trigger.Label>Saved</NativeTabs.Trigger.Label>
        {changed > 0 && <NativeTabs.Trigger.Badge>{String(changed)}</NativeTabs.Trigger.Badge>}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="submit">
        <NativeTabs.Trigger.Icon sf="plus.circle" md="add_circle" />
        <NativeTabs.Trigger.Label>Submit</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
