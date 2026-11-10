import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, textStyles } from '../theme';

type Props = {
  variant: 'error' | 'success';
  title: string;
  detail?: string;
};

/** Bandeau de message global (erreur réseau/serveur ou succès). */
export function FormMessage({ variant, title, detail }: Props) {
  const isError = variant === 'error';

  return (
    <View
      style={[styles.banner, isError ? styles.error : styles.success]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <Ionicons
        name={isError ? 'alert-circle' : 'checkmark-circle'}
        size={22}
        color={isError ? colors.danger : colors.primaryDark}
      />
      <View style={styles.texts}>
        <Text style={[styles.title, { color: isError ? colors.feedbackText.error : colors.feedbackText.success }]}>
          {title}
        </Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    marginBottom: spacing.lg,
  },
  error: {
    backgroundColor: colors.surface,
    borderColor: colors.danger,
  },
  success: {
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primaryDark,
  },
  texts: {
    flex: 1,
  },
  title: {
    ...textStyles.body,
    fontFamily: textStyles.label.fontFamily,
  },
  detail: {
    ...textStyles.caption,
    color: colors.text,
    marginTop: 2,
  },
});
