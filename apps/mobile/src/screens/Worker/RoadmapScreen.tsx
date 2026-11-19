/**
 * RoadmapScreen — Worker/Agent intervention list.
 * Fetches from GET /api/v1/interventions/assigned with auth token.
 * Falls back to 3 mock items if the API is unavailable.
 */
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, textStyles } from '../../theme';
import { getMyInterventions, type Intervention, type InterventionStatus } from '../../services/interventionApi';
import { useAuthStore } from '../../store/authStore';

// ─── Category helpers ─────────────────────────────────────────────────────────

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const CATEGORY_META: Record<string, { label: string; icon: IoniconName }> = {
  DEPOT_SAUVAGE:      { label: 'Dépôt sauvage',       icon: 'trash-outline' },
  ENCOMBRANTS:        { label: 'Encombrants',          icon: 'cube-outline' },
  DECHETS_DANGEREUX:  { label: 'Déchets dangereux',   icon: 'warning-outline' },
  GRAFFITI:           { label: 'Graffiti',             icon: 'brush-outline' },
  VEGETAUX:           { label: 'Végétaux',             icon: 'leaf-outline' },
  AUTRE:              { label: 'Autre',                icon: 'help-circle-outline' },
};

function getCategoryMeta(category: string) {
  return CATEGORY_META[category] ?? { label: category, icon: 'help-circle-outline' as IoniconName };
}

// ─── Status badge ─────────────────────────────────────────────────────────────

type BadgeStyle = { bg: string; text: string; label: string };

const STATUS_BADGE: Record<InterventionStatus, BadgeStyle> = {
  EN_ATTENTE: { bg: '#E2E8F0', text: '#475569', label: 'En attente' },
  EN_COURS:   { bg: '#DBEAFE', text: '#1D4ED8', label: 'En cours' },
  TERMINEE:   { bg: '#D1FAE5', text: '#047857', label: 'Terminée' },
};

function StatusBadge({ status }: { status: InterventionStatus }) {
  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.EN_ATTENTE;
  return (
    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
      <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
    </View>
  );
}

// ─── Intervention card ────────────────────────────────────────────────────────

function InterventionCard({ item, onPress }: { item: Intervention; onPress: () => void }) {
  const { label, icon } = getCategoryMeta(item.category);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Intervention ${item.reference}`}
    >
      <View style={styles.cardTop}>
        <View style={styles.refRow}>
          <Text style={styles.reference}>{item.reference}</Text>
          <StatusBadge status={item.status} />
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
      <View style={styles.categoryRow}>
        <Ionicons name={icon} size={16} color={colors.primary} />
        <Text style={styles.categoryLabel}>{label}</Text>
      </View>
      <Text style={styles.address} numberOfLines={1}>
        📍 {item.address}
      </Text>
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function RoadmapScreen() {
  const router = useRouter();
  const token = useAuthStore((s) => (s as unknown as { token?: string }).token ?? '');

  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const result = await getMyInterventions(token);
    if (result.kind === 'success') {
      setInterventions(result.data);
    } else {
      setError(result.message);
    }
  }, [token]);

  // Initial load
  React.useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const total = interventions.length;
  const done = interventions.filter((i) => i.status === 'TERMINEE').length;

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">Mes interventions</Text>
        <Text style={styles.dateText}>{today.charAt(0).toUpperCase() + today.slice(1)}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: spacing.xl }} />
      ) : (
        <>
          {/* Summary cards */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, styles.summaryGreen]}>
              <Text style={styles.summaryNumber}>{total}</Text>
              <Text style={styles.summaryLabel}>intervention{total !== 1 ? 's' : ''} aujourd'hui</Text>
            </View>
            <View style={[styles.summaryCard, styles.summaryBlue]}>
              <Text style={[styles.summaryNumber, { color: '#1D4ED8' }]}>{done}</Text>
              <Text style={[styles.summaryLabel, { color: '#1D4ED8' }]}>terminée{done !== 1 ? 's' : ''}</Text>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={() => { setLoading(true); void load().finally(() => setLoading(false)); }} style={styles.retryBtn}>
                <Text style={styles.retryText}>Réessayer</Text>
              </Pressable>
            </View>
          ) : null}

          {!error && interventions.length === 0 ? (
            <Text style={styles.emptyText}>Aucune intervention assignée pour aujourd'hui.</Text>
          ) : null}

          <FlatList
            data={interventions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void onRefresh()}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            renderItem={({ item }) => (
              <InterventionCard
                item={item}
                onPress={() =>
                  router.push({ pathname: '/interventions/[id]', params: { id: item.id } })
                }
              />
            )}
          />
        </>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.lg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    ...textStyles.heading,
    color: colors.text,
  },
  dateText: {
    ...textStyles.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
  },
  summaryGreen: {
    backgroundColor: '#D1FAE5',
  },
  summaryBlue: {
    backgroundColor: '#DBEAFE',
  },
  summaryNumber: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 28,
    color: '#047857',
    lineHeight: 34,
  },
  summaryLabel: {
    ...textStyles.caption,
    color: '#047857',
    textAlign: 'center',
  },
  list: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardPressed: {
    opacity: 0.75,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  reference: {
    ...textStyles.subtitle,
    color: colors.text,
    flexShrink: 1,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    ...textStyles.label,
    fontSize: 11,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  categoryLabel: {
    ...textStyles.label,
    color: colors.textMuted,
  },
  address: {
    ...textStyles.body,
    color: colors.textMuted,
    fontSize: 13,
  },
  errorBox: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    marginBottom: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorText: {
    ...textStyles.body,
    color: colors.feedbackText.error,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: colors.action.primary,
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  retryText: {
    ...textStyles.label,
    color: colors.action.onPrimary,
  },
  emptyText: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
});
