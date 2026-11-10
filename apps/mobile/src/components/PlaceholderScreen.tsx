import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, textStyles } from '../theme';

type Props = {
  title: string;
  description?: string;
  /** Action optionnelle affichée sous la description. */
  children?: React.ReactNode;
};

/** Écran vide temporaire pour les onglets pas encore développés. */
export function PlaceholderScreen({ title, description = 'Bientôt disponible.', children }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.description}>{description}</Text>
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  title: {
    ...textStyles.heading,
    color: colors.secondary,
    textAlign: 'center',
  },
  description: {
    ...textStyles.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  actions: {
    alignSelf: 'stretch',
    marginTop: spacing.xl,
  },
});
