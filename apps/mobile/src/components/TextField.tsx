import React, { forwardRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, textStyles, touchTarget } from '../theme';

type Props = TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
  /** Champ rempli et sans erreur : bordure verte. */
  valid?: boolean;
  /** Élément à droite du champ (ex. bouton afficher/masquer). */
  accessory?: React.ReactNode;
};

/** Champ de saisie avec libellé, aide, erreur et bordure adaptative. */
export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, error, hint, valid = false, accessory, editable = true, onFocus, onBlur, ...inputProps },
  ref,
) {
  const [focused, setFocused] = useState(false);

  const borderColor = !editable
    ? colors.border
    : error
      ? colors.danger
      : focused
        ? colors.secondary
        : valid
          ? colors.primaryDark
          : colors.neutral[500];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          { borderColor, borderWidth: focused || error ? 2 : 1 },
          !editable && styles.inputRowDisabled,
        ]}
      >
        <TextInput
          ref={ref}
          style={[styles.input, !editable && styles.inputDisabled]}
          placeholderTextColor={colors.textMuted}
          editable={editable}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          accessibilityState={{ disabled: !editable }}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...inputProps}
        />
        {accessory}
      </View>
      {error ? (
        <View style={styles.messageRow} accessibilityRole="alert" accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle" size={16} color={colors.danger} />
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    ...textStyles.label,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTarget.min + 4,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingLeft: spacing.md,
  },
  inputRowDisabled: {
    backgroundColor: colors.neutral[100],
  },
  input: {
    ...textStyles.body,
    flex: 1,
    minHeight: touchTarget.min,
    color: colors.text,
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
  },
  inputDisabled: {
    color: colors.textMuted,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  error: {
    ...textStyles.caption,
    color: colors.feedbackText.error,
    flexShrink: 1,
  },
  hint: {
    ...textStyles.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
