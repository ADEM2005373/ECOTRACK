import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, textStyles, touchTarget } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  /** Libellé lu par le lecteur d'écran pendant le chargement. */
  loadingLabel?: string;
};

/** Bouton principal : Bleu saphir + texte blanc (10.36:1, WCAG AAA). */
export function PrimaryButton({ label, onPress, loading = false, disabled = false, loadingLabel }: Props) {
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={loading && loadingLabel ? loadingLabel : label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        inactive && styles.inactive,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.action.onPrimary} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: touchTarget.min + 4,
    minWidth: touchTarget.min,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.action.primary,
  },
  pressed: {
    backgroundColor: colors.action.primaryPressed,
  },
  inactive: {
    opacity: 0.7,
  },
  label: {
    ...textStyles.subtitle,
    fontSize: 16,
    color: colors.action.onPrimary,
  },
});
