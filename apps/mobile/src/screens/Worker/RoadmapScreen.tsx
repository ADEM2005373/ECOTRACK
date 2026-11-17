import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import { colors, spacing, textStyles } from '../../theme';
import { fetchWorkerRoadmap, type WorkerReport } from '../../services/interventionApi';

function distanceMeters(
  from: Location.LocationObjectCoords,
  report: WorkerReport,
): number {
  const [longitude, latitude] = report.location.coordinates;
  const earthRadius = 6371000;
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (latitude * Math.PI) / 180;
  const deltaLat = ((latitude - from.latitude) * Math.PI) / 180;
  const deltaLon = ((longitude - from.longitude) * Math.PI) / 180;
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

export default function RoadmapScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<WorkerReport[]>([]);
  const [position, setPosition] = useState<Location.LocationObjectCoords | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRoadmap = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        throw new Error('La permission de localisation est nécessaire pour trier les interventions.');
      }
      const current = await Location.getCurrentPositionAsync({});
      setPosition(current.coords);
      setReports(await fetchWorkerRoadmap(current.coords.longitude, current.coords.latitude));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Impossible de charger la feuille de route.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRoadmap();
    }, [loadRoadmap]),
  );

  const openDirections = (report: WorkerReport) => {
    const [longitude, latitude] = report.location.coordinates;
    void Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">Feuille de route</Text>
        <Text style={styles.subtitle}>Interventions ASSIGNÉES les plus proches</Text>
      </View>
      {loading ? <ActivityIndicator color={colors.secondary} accessibilityLabel="Chargement" /> : null}
      {error ? (
        <View style={styles.message}>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={() => void loadRoadmap()} style={styles.retry}>
            <Text style={styles.retryText}>Réessayer</Text>
          </Pressable>
        </View>
      ) : null}
      {!loading && !error && reports.length === 0 ? (
        <Text style={styles.empty}>Aucune intervention assignée à proximité.</Text>
      ) : null}
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const distance = position ? distanceMeters(position, item) : 0;
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.category}>{item.category}</Text>
                {item.priority ? <Text style={styles.priority}>{item.priority}</Text> : null}
              </View>
              <Text style={styles.distance}>{formatDistance(distance)}</Text>
              {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
              <View style={styles.actions}>
                <Pressable onPress={() => openDirections(item)} style={styles.secondaryButton}>
                  <Text style={styles.secondaryText}>Itinéraire GPS</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push({ pathname: '/interventions/[id]', params: { id: item.id } })}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryText}>Voir l’intervention</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  header: { marginBottom: spacing.lg },
  title: { ...textStyles.heading, color: colors.secondary },
  subtitle: { ...textStyles.body, color: colors.textMuted, marginTop: spacing.xs },
  list: { gap: spacing.md, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.lg,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  category: { ...textStyles.subtitle, color: colors.text, flex: 1 },
  priority: { ...textStyles.label, color: colors.feedbackText.warning, textTransform: 'uppercase' },
  distance: { ...textStyles.label, color: colors.secondary, marginTop: spacing.sm },
  description: { ...textStyles.body, color: colors.textMuted, marginTop: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  primaryButton: { backgroundColor: colors.action.primary, borderRadius: 10, padding: spacing.sm, minHeight: 44, justifyContent: 'center' },
  primaryText: { ...textStyles.label, color: colors.action.onPrimary },
  secondaryButton: { borderColor: colors.secondary, borderRadius: 10, borderWidth: 1, padding: spacing.sm, minHeight: 44, justifyContent: 'center' },
  secondaryText: { ...textStyles.label, color: colors.secondary },
  message: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  error: { ...textStyles.body, color: colors.feedbackText.error, textAlign: 'center' },
  retry: { backgroundColor: colors.action.primary, borderRadius: 10, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  retryText: { ...textStyles.label, color: colors.action.onPrimary },
  empty: { ...textStyles.body, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl },
});
