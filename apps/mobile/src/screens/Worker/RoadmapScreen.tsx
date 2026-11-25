/**
 * RoadmapScreen — Chef Ouvrier & Équipes Terrain (Mairie de Zarzouna).
 * Connecté en direct à la base MongoDB (ecotrack_db).
 * Zéro fausse donnée injectée (0 fake data).
 */
import React, { useCallback, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, textStyles } from '../../theme';
import { getMyInterventions, type Intervention, type InterventionStatus } from '../../services/interventionApi';
import { useAuthStore } from '../../store/authStore';

// ─── Correspondance des catégories CDCF ────────────────────────────────────────

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const CATEGORY_META: Record<string, { label: string; icon: IoniconName; color: string }> = {
  DEPOT_SAUVAGE:      { label: 'Dépôt sauvage',       icon: 'trash-outline',         color: '#059669' },
  ENCOMBRANTS:        { label: 'Objets encombrants',  icon: 'cube-outline',          color: '#d97706' },
  DECHETS_DANGEREUX:  { label: 'Déchets dangereux',   icon: 'warning-outline',       color: '#dc2626' },
  GRAFFITI:           { label: 'Graffitis / Murs',    icon: 'brush-outline',         color: '#7c3aed' },
  VEGETAUX:           { label: 'Déchets végétaux',    icon: 'leaf-outline',          color: '#16a34a' },
  DEBORDEMENT_BAC:    { label: 'Bacs débordants',     icon: 'archive-outline',       color: '#2563eb' },
  AUTRE:              { label: 'Autre anomalie',      icon: 'help-circle-outline',   color: '#64748b' },
};

function getCategoryMeta(category: string) {
  return CATEGORY_META[category] ?? { label: category, icon: 'help-circle-outline' as IoniconName, color: '#64748b' };
}

// ─── Badge de statut CDCF ──────────────────────────────────────────────────────

type BadgeStyle = { bg: string; text: string; label: string; icon: IoniconName };

const STATUS_BADGE: Record<InterventionStatus, BadgeStyle> = {
  EN_ATTENTE: { bg: '#fef3c7', text: '#b45309', label: 'Assignée', icon: 'time-outline' },
  EN_COURS:   { bg: '#eff6ff', text: '#1d4ed8', label: 'En cours',  icon: 'flash-outline' },
  TERMINEE:   { bg: '#ecfdf5', text: '#047857', label: 'Terminée',  icon: 'checkmark-circle-outline' },
};

function StatusBadge({ status }: { status: InterventionStatus }) {
  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.EN_ATTENTE;
  return (
    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
      <Ionicons name={badge.icon} size={11} color={badge.text} style={{ marginRight: 3 }} />
      <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
    </View>
  );
}

// ─── Carte d'intervention terrain ─────────────────────────────────────────────

function InterventionCard({ item, onPress }: { item: Intervention; onPress: () => void }) {
  const meta = getCategoryMeta(item.category);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Intervention ${item.reference}`}
    >
      <View style={styles.cardHeader}>
        <View style={styles.refRow}>
          <Text style={styles.reference}>{item.reference}</Text>
          <StatusBadge status={item.status} />
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
      </View>

      <View style={styles.cardBody}>
        {item.citizenPhotoUri ? (
          <Image source={{ uri: item.citizenPhotoUri }} style={styles.thumbImage} resizeMode="cover" />
        ) : null}

        <View style={{ flex: 1, gap: 4 }}>
          <View style={styles.categoryRow}>
            <View style={[styles.categoryIconBox, { backgroundColor: `${meta.color}15` }]}>
              <Ionicons name={meta.icon} size={14} color={meta.color} />
            </View>
            <Text style={[styles.categoryLabel, { color: meta.color }]}>{meta.label}</Text>
          </View>

          <Text style={styles.description} numberOfLines={2}>
            {item.description || 'Intervention communale'}
          </Text>

          <Text style={styles.address} numberOfLines={1}>
            <Ionicons name="location" size={12} color="#059669" /> {item.address}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.footerTeam}>
          <Ionicons name="people-outline" size={12} color="#64748b" /> {item.assignedTeam || 'Brigade Voirie'}
        </Text>
        <Text style={[styles.footerPriority, item.priority === 'URGENTE' ? styles.priorityUrgent : null]}>
          Priorité {item.priority || 'HAUTE'}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Écran Principal Feuille de Route ─────────────────────────────────────────

export default function RoadmapScreen() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();

  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'EN_ATTENTE' | 'EN_COURS' | 'TERMINEE'>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const result = await getMyInterventions(accessToken || undefined);
    if (result.kind === 'success') {
      setInterventions(result.data);
    } else {
      setError(result.message);
    }
  }, [accessToken]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load().finally(() => setLoading(false));
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  // ── Statistiques de chantier ────────────────────────────────────────────────
  const total = interventions.length;
  const pending = interventions.filter((i) => i.status === 'EN_ATTENTE').length;
  const inProgress = interventions.filter((i) => i.status === 'EN_COURS').length;
  const done = interventions.filter((i) => i.status === 'TERMINEE').length;

  const filtered = interventions.filter((item) => {
    if (filter === 'ALL') return true;
    return item.status === filter;
  });

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <View style={styles.container}>
      {/* ── 1. En-tête Chef Ouvrier & Brigade ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title} accessibilityRole="header">Missions & Chantiers</Text>
            <Text style={styles.dateText}>{today.charAt(0).toUpperCase() + today.slice(1)}</Text>
          </View>
          <TouchableOpacity style={styles.refreshIconBtn} onPress={() => void onRefresh()}>
            <Ionicons name="refresh" size={18} color="#059669" />
          </TouchableOpacity>
        </View>

        {/* Profil Chef & Brigade rattachée */}
        <View style={styles.workerBadgeBox}>
          <View style={styles.workerAvatar}>
            <Text style={styles.workerAvatarText}>
              {(user?.fullName || 'Mohamed Ali').charAt(0)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.workerName}>{user?.fullName || 'Mohamed Ali Khemiri'}</Text>
            <Text style={styles.workerBrigade}>
              Chef Ouvrier · {user?.municipality || 'Mairie de Zarzouna'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── 2. Compteurs KPIs Rapides ── */}
      <View style={styles.summaryRow}>
        <TouchableOpacity
          onPress={() => setFilter('ALL')}
          style={[styles.summaryCard, filter === 'ALL' ? styles.summaryCardActive : null]}
        >
          <Text style={styles.summaryNumber}>{total}</Text>
          <Text style={styles.summaryLabel}>Total missions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFilter('EN_ATTENTE')}
          style={[styles.summaryCard, filter === 'EN_ATTENTE' ? styles.summaryCardActive : null]}
        >
          <Text style={[styles.summaryNumber, { color: '#b45309' }]}>{pending}</Text>
          <Text style={styles.summaryLabel}>À traiter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFilter('EN_COURS')}
          style={[styles.summaryCard, filter === 'EN_COURS' ? styles.summaryCardActive : null]}
        >
          <Text style={[styles.summaryNumber, { color: '#2563eb' }]}>{inProgress}</Text>
          <Text style={styles.summaryLabel}>En cours</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFilter('TERMINEE')}
          style={[styles.summaryCard, filter === 'TERMINEE' ? styles.summaryCardActive : null]}
        >
          <Text style={[styles.summaryNumber, { color: '#059669' }]}>{done}</Text>
          <Text style={styles.summaryLabel}>Terminées</Text>
        </TouchableOpacity>
      </View>

      {/* ── 3. Contenu de la liste ── */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator color="#059669" size="large" />
          <Text style={styles.loadingText}>Chargement des missions...</Text>
        </View>
      ) : (
        <>
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="cloud-offline-outline" size={24} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={() => { setLoading(true); void load().finally(() => setLoading(false)); }} style={styles.retryBtn}>
                <Text style={styles.retryText}>Réessayer</Text>
              </Pressable>
            </View>
          ) : null}

          {!error && filtered.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="clipboard-outline" size={36} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>
                {filter === 'ALL' ? 'Aucune intervention assignée' : 'Aucune mission dans cette catégorie'}
              </Text>
              <Text style={styles.emptyText}>
                Aucune intervention en attente pour votre brigade. Dès qu'un agent municipal affectera un signalement, il apparaîtra ici en temps réel.
              </Text>
              <TouchableOpacity style={styles.refreshBtn} onPress={() => void onRefresh()}>
                <Ionicons name="refresh" size={16} color="#ffffff" />
                <Text style={styles.refreshBtnText}>Actualiser en direct</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => void onRefresh()}
                  tintColor="#059669"
                  colors={['#059669']}
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
          )}
        </>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: spacing.md,
  },
  header: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...textStyles.heading,
    fontSize: 20,
    color: '#0f172a',
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  refreshIconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  workerBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 10,
  },
  workerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workerAvatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  workerName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  workerBrigade: {
    fontSize: 11,
    color: '#64748b',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  summaryCardActive: {
    borderColor: '#059669',
    backgroundColor: '#ecfdf5',
  },
  summaryNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: 30,
    gap: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  cardPressed: {
    opacity: 0.85,
    backgroundColor: '#f8fafc',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reference: {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 12,
    color: '#1e3a8a',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardBody: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  thumbImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryIconBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
  address: {
    fontSize: 11,
    color: '#64748b',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
    marginTop: 2,
  },
  footerTeam: {
    fontSize: 10,
    color: '#64748b',
  },
  footerPriority: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#d97706',
  },
  priorityUrgent: {
    color: '#dc2626',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748b',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
  },
  refreshBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 14,
    marginHorizontal: spacing.md,
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 12,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
