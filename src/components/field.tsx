import type { ReactNode } from "react";
import { StyleSheet, Text, TextInput, type TextInputProps, View } from "react-native";

import { colors, fonts, space } from "@/theme/tokens";

type Props = { label: string; hint?: string; error?: string; children?: ReactNode } & TextInputProps;

/** Labelled form field. Renders a text input unless `children` supplies a custom control. */
export function Field({ label, hint, error, children, style, ...input }: Props) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {hint && <Text style={styles.hint}>{hint}</Text>}
      {children ?? (
        <TextInput
          placeholderTextColor={colors.inkSoft}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          style={[styles.input, input.multiline && styles.multiline, error && styles.inputError, style]}
          {...input}
        />
      )}
      {error && (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: space.xs },
  label: { fontFamily: fonts.label, fontSize: 13, letterSpacing: 1, color: colors.yellow, textTransform: "uppercase" },
  hint: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.cream },
  input: {
    minHeight: 52,
    backgroundColor: colors.cream,
    borderWidth: 3,
    borderColor: colors.cream,
    paddingHorizontal: space.md,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
  multiline: { minHeight: 120, paddingTop: space.md, textAlignVertical: "top" },
  inputError: { borderColor: colors.orange },
  error: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.orange },
});
