import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Badge */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>🌱</Text>
          </View>
          <Text style={styles.title}>ECOTRACK</Text>
          <Text style={styles.subtitle}>Plateforme Smart City Mobile (Expo SDK Router)</Text>
        </View>

        {/* Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sprint 0 — Socles Prêts</Text>
          <Text style={styles.cardText}>
            Design tokens injectés avec succès :
          </Text>
          
          <View style={styles.tokenRow}>
            <View style={[styles.colorChip, { backgroundColor: colors.primary }]} />
            <Text style={styles.tokenLabel}>Primary: {colors.primary} (Emerald 600)</Text>
          </View>

          <View style={styles.tokenRow}>
            <View style={[styles.colorChip, { backgroundColor: colors.secondary }]} />
            <Text style={styles.tokenLabel}>Secondary: {colors.secondary} (Sapphire 900)</Text>
          </View>

          <View style={styles.fontSection}>
            <Text style={styles.fontLabel}>Polices configurées :</Text>
            <Text style={styles.fontItem}>• Titres : {typography.fonts.heading}</Text>
            <Text style={styles.fontItem}>• Corps : {typography.fonts.body}</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={styles.primaryButton} 
          activeOpacity={0.8}
          onPress={() => Alert.alert('EcoTrack Mobile', 'Socle Expo & Design tokens validés pour le Sprint 0 !')}
        >
          <Text style={styles.primaryButtonText}>Démarrer une intervention</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 32,
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontFamily: typography.fonts.heading,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.body,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.heading,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 8,
  },
  cardText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.body,
    color: colors.light.textSecondary,
    marginBottom: 16,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  colorChip: {
    width: 24,
    height: 24,
    borderRadius: 6,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tokenLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.body,
    color: colors.text,
  },
  fontSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  fontLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 6,
  },
  fontItem: {
    fontSize: typography.sizes.sm,
    color: colors.light.textSecondary,
    marginBottom: 4,
  },
  primaryButton: {
    width: '100%',
    // Bleu saphir + texte blanc (10.36:1) : le blanc sur émeraude échoue en AA.
    backgroundColor: colors.action.primary,
    minHeight: 48,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.action.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: colors.action.onPrimary,
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.heading,
    fontWeight: typography.weights.bold,
  },
});
