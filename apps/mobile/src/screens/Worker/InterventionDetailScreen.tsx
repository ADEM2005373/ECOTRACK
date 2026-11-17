import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, spacing, textStyles } from '../../theme';
import { startIntervention } from '../../services/interventionApi';
import { useAuthStore } from '../../store/authStore';

export default function InterventionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);

  const start = async () => {
    if (!id || Array.isArray(id)) return;
    setLoading(true);
    try {
      await startIntervention(id, user?.id ?? undefined);
      Alert.alert('Intervention démarrée', 'Le chantier est maintenant EN COURS.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (reason) {
      Alert.alert(
        'Démarrage impossible',
        reason instanceof Error ? reason.message : 'Une erreur est survenue.',
      );
    } finally {
      setLoading(false);
    }
  };

  const openDirections = () => {
    void Linking.openURL('https://www.google.com/maps');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">Démarrer le chantier</Text>
      <Text style={styles.id}>Signalement : {Array.isArray(id) ? id[0] : id}</Text>
      <Text style={styles.description}>
        Vérifiez votre assignation avant de démarrer. Cette action déclenche la transition T3 vers EN_TRAITEMENT.
      </Text>
      <Pressable onPress={openDirections} style={styles.secondaryButton}>
        <Text style={styles.secondaryText}>Ouvrir l’application GPS</Text>
      </Pressable>
      <Pressable
        onPress={() => void start()}
        disabled={loading}
        accessibilityRole="button"
        accessibilityState={{ busy: loading, disabled: loading }}
        style={[styles.primaryButton, loading && styles.disabled]}
      >
        {loading ? <ActivityIndicator color={colors.action.onPrimary} /> : <Text style={styles.primaryText}>Démarrer l’intervention</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, gap: spacing.lg },
  title: { ...textStyles.heading, color: colors.secondary },
  id: { ...textStyles.label, color: colors.textMuted },
  description: { ...textStyles.body, color: colors.text },
  primaryButton: { minHeight: 52, borderRadius: 12, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  primaryText: { ...textStyles.subtitle, color: colors.onPrimary },
  secondaryButton: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.secondary, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  secondaryText: { ...textStyles.subtitle, color: colors.secondary },
  disabled: { opacity: 0.7 },
});
