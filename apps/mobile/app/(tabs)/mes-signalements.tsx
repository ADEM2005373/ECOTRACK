import React, { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { deleteMyReport, getMyReports, type CitizenReport } from '../../src/services/reportApi';

export default function MesSignalementsScreen() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();

  const [filter, setFilter] = useState<'ALL' | 'NOUVEAU' | 'EN_COURS' | 'RESOLU'>('ALL');
  const [selectedReport, setSelectedReport] = useState<CitizenReport | null>(null);
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setError(null);
    const res = await getMyReports(user?.id, accessToken);
    if (res.kind === 'success') {
      setReports(res.data);
    } else {
      setError(res.message);
    }
  }, [user?.id, accessToken]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadReports().finally(() => setLoading(false));
    }, [loadReports])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  }, [loadReports]);

  const filtered = reports.filter((r) => {
    if (filter === 'ALL') return true;
    return r.status === filter;
  });

  const handleDeleteReport = (report: CitizenReport) => {
    Alert.alert(
      'Annuler le signalement',
      `Voulez-vous supprimer définitivement le dossier ${report.reference} ?`,
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteMyReport(report.id, accessToken);
            if (res.kind === 'success') {
              setSelectedReport(null);
              setReports((prev) => prev.filter((r) => r.id !== report.id));
              Alert.alert('Supprimé', 'Votre signalement a bien été retiré.');
            } else {
              Alert.alert('Erreur', res.message);
            }
          },
        },
      ]
    );
  };

  const badgeStyleFor = (status: CitizenReport['status']) => {
    if (status === 'RESOLU') return { box: styles.badgeResolved, text: styles.badgeResolvedText };
    if (status === 'REJETE') return { box: styles.badgeRejected, text: styles.badgeRejectedText };
    if (status === 'NOUVEAU') return { box: styles.badgeNew, text: styles.badgeNewText };
    return { box: styles.badgeProgress, text: styles.badgeProgressText };
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Mes Dossiers Citoyens</Text>
            <Text style={styles.headerSubtitle}>
              Suivi de vos signalements · Mairie de Zarzouna
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshIconBtn} onPress={() => void onRefresh()}>
            <Ionicons name="refresh" size={18} color="#059669" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtres de Statut */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow} style={styles.filterScroll}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'ALL' && styles.filterChipActive]}
          onPress={() => setFilter('ALL')}
        >
          <Text style={[styles.filterChipText, filter === 'ALL' && styles.filterChipTextActive]}>
            Tous ({reports.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'NOUVEAU' && styles.filterChipActive]}
          onPress={() => setFilter('NOUVEAU')}
        >
          <Text style={[styles.filterChipText, filter === 'NOUVEAU' && styles.filterChipTextActive]}>
            Transmis ({reports.filter((r) => r.status === 'NOUVEAU').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'EN_COURS' && styles.filterChipActive]}
          onPress={() => setFilter('EN_COURS')}
        >
          <Text style={[styles.filterChipText, filter === 'EN_COURS' && styles.filterChipTextActive]}>
            En cours ({reports.filter((r) => r.status === 'EN_COURS').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'RESOLU' && styles.filterChipActive]}
          onPress={() => setFilter('RESOLU')}
        >
          <Text style={[styles.filterChipText, filter === 'RESOLU' && styles.filterChipTextActive]}>
            Résolus ({reports.filter((r) => r.status === 'RESOLU').length})
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Chargement de vos signalements...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor="#059669" colors={['#059669']} />
          }
        >
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="cloud-offline-outline" size={24} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => void onRefresh()}>
                <Text style={styles.retryBtnText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {!error && filtered.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="document-text-outline" size={40} color="#94a3b8" />
              <Text style={styles.emptyTitle}>Aucun signalement dans cette catégorie</Text>
              <Text style={styles.emptyDesc}>
                Signalez une anomalie dans votre quartier pour suivre son traitement en temps réel par les équipes de la mairie.
              </Text>
              <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push('/(tabs)/signaler')}>
                <Ionicons name="camera" size={16} color="#ffffff" />
                <Text style={styles.ctaBtnText}>Signaler une anomalie</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filtered.map((item) => {
              const bStyle = badgeStyleFor(item.status);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  activeOpacity={0.8}
                  onPress={() => setSelectedReport(item)}
                >
                  <Image source={{ uri: item.beforePhoto }} style={styles.cardImage} />
                  <View style={styles.cardBody}>
                    <View style={styles.cardTop}>
                      <Text style={styles.referenceText}>{item.reference}</Text>
                      <View style={[styles.badge, bStyle.box]}>
                        <Text style={[styles.badgeText, bStyle.text]}>{item.statusLabel}</Text>
                      </View>
                    </View>

                    <Text style={styles.titleText} numberOfLines={2}>{item.title}</Text>

                    <View style={styles.infoRow}>
                      <Ionicons name="location-outline" size={12} color="#64748b" />
                      <Text style={styles.infoText} numberOfLines={1}>{item.district}</Text>
                    </View>

                    <View style={styles.cardFooter}>
                      <Text style={styles.dateText}>{item.date}</Text>
                      <Text style={styles.detailsAction}>Voir détails →</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ================= MODALE DETAIL & PREUVE AVANT / APRES ================= */}
      {selectedReport && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.modalRef}>{selectedReport.reference} · {selectedReport.category}</Text>
                  <Text style={styles.modalTitle}>{selectedReport.title}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedReport(null)} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color="#0f172a" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                <Text style={styles.modalDescription}>{selectedReport.description}</Text>

                <View style={styles.photoComparisonSection}>
                  <View style={styles.photoBlock}>
                    <Text style={styles.photoLabel}>Photo Signalement (Avant)</Text>
                    <Image source={{ uri: selectedReport.beforePhoto }} style={styles.comparisonPhoto} />
                  </View>

                  {selectedReport.afterPhoto ? (
                    <View style={styles.photoBlock}>
                      <Text style={[styles.photoLabel, { color: '#059669' }]}>Preuve de Résolution (Après)</Text>
                      <Image source={{ uri: selectedReport.afterPhoto }} style={styles.comparisonPhoto} />
                    </View>
                  ) : null}
                </View>

                {selectedReport.resolutionNote ? (
                  <View style={styles.noteBox}>
                    <Ionicons name="information-circle" size={16} color="#059669" />
                    <Text style={styles.noteText}>{selectedReport.resolutionNote}</Text>
                  </View>
                ) : null}

                {selectedReport.rejectionReason ? (
                  <View style={[styles.noteBox, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
                    <Ionicons name="alert-circle" size={16} color="#dc2626" />
                    <Text style={[styles.noteText, { color: '#b91c1c' }]}>{selectedReport.rejectionReason}</Text>
                  </View>
                ) : null}

                <View style={styles.timeline}>
                  <Text style={styles.timelineTitle}>Historique d'intervention</Text>
                  <View style={styles.timelineStep}>
                    <View style={[styles.stepDot, styles.dotDone]} />
                    <Text style={styles.stepText}>Signalement reçu et transmis à la Mairie de Zarzouna</Text>
                  </View>
                  <View style={styles.timelineStep}>
                    <View style={[styles.stepDot, selectedReport.status !== 'NOUVEAU' ? styles.dotDone : styles.dotPending]} />
                    <Text style={styles.stepText}>
                      {selectedReport.status === 'REJETE'
                        ? 'Dossier examiné et non retenu par modération'
                        : selectedReport.status === 'NOUVEAU'
                          ? 'En attente de qualification par un agent municipal'
                          : 'Qualification validée et brigade technique affectée'}
                    </Text>
                  </View>
                  {selectedReport.status !== 'REJETE' && (
                    <View style={styles.timelineStep}>
                      <View
                        style={[
                          styles.stepDot,
                          selectedReport.status === 'RESOLU'
                            ? styles.dotDone
                            : selectedReport.status === 'EN_COURS'
                              ? styles.dotActive
                              : styles.dotPending,
                        ]}
                      />
                      <Text style={styles.stepText}>
                        {selectedReport.status === 'RESOLU'
                          ? 'Intervention achevée et preuve photo certifiée'
                          : selectedReport.status === 'EN_COURS'
                            ? 'Équipe sur place en cours d\'intervention'
                            : 'Intervention planifiée après affectation'}
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.gpsModalBtn}
                  onPress={() => void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${selectedReport.latitude},${selectedReport.longitude}`)}
                >
                  <Ionicons name="navigate" size={16} color="#059669" />
                  <Text style={styles.gpsModalBtnText}>Voir sur Carte</Text>
                </TouchableOpacity>

                {selectedReport.status === 'NOUVEAU' && (
                  <TouchableOpacity
                    style={styles.deleteModalBtn}
                    onPress={() => handleDeleteReport(selectedReport)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#dc2626" />
                    <Text style={styles.deleteModalBtnText}>Annuler</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setSelectedReport(null)}
              >
                <Text style={styles.modalButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 12, color: '#64748b', marginTop: 4 },
  refreshIconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  filterScroll: { maxHeight: 44, marginBottom: 12 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#102c35',
    borderColor: '#102c35',
  },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  filterChipTextActive: { color: '#ffffff' },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 12, color: '#64748b' },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  errorText: { fontSize: 12, color: '#b91c1c', textAlign: 'center' },
  retryBtn: { backgroundColor: '#dc2626', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  retryBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  emptyBox: {
    alignItems: 'center',
    padding: 28,
    gap: 10,
    marginTop: 20,
  },
  emptyTitle: { fontSize: 15, fontWeight: 'bold', color: '#0f172a', textAlign: 'center' },
  emptyDesc: { fontSize: 12, color: '#64748b', textAlign: 'center', lineHeight: 18 },
  ctaBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  ctaBtnText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  listContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    flexDirection: 'row',
    gap: 12,
  },
  cardImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#f1f5f9' },
  cardBody: { flex: 1, justifyContent: 'space-between' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 },
  referenceText: { fontSize: 11, fontWeight: 'bold', color: '#1e3a8a' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  badgeResolved: { backgroundColor: '#ecfdf5', borderColor: '#059669' },
  badgeProgress: { backgroundColor: '#fffbeb', borderColor: '#d97706' },
  badgeNew: { backgroundColor: '#eff6ff', borderColor: '#2563eb' },
  badgeRejected: { backgroundColor: '#fef2f2', borderColor: '#dc2626' },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  badgeResolvedText: { color: '#059669' },
  badgeProgressText: { color: '#d97706' },
  badgeNewText: { color: '#2563eb' },
  badgeRejectedText: { color: '#dc2626' },
  titleText: { fontSize: 13, fontWeight: 'bold', color: '#0f172a', marginVertical: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 11, color: '#64748b', flex: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  dateText: { fontSize: 10, color: '#94a3b8' },
  detailsAction: { fontSize: 11, fontWeight: 'bold', color: '#059669' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  modalRef: { fontSize: 12, fontWeight: 'bold', color: '#1e3a8a' },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginTop: 2 },
  modalDescription: { fontSize: 13, color: '#475569', lineHeight: 19, marginBottom: 14 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: { marginBottom: 16 },
  photoComparisonSection: { gap: 12, marginBottom: 16 },
  photoBlock: { gap: 6 },
  photoLabel: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  comparisonPhoto: { width: '100%', height: 160, borderRadius: 10, backgroundColor: '#f1f5f9' },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  noteText: { fontSize: 12, color: '#065f46', flex: 1 },
  timeline: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, gap: 10 },
  timelineTitle: { fontSize: 12, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  timelineStep: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  dotDone: { backgroundColor: '#059669' },
  dotActive: { backgroundColor: '#d97706' },
  dotPending: { backgroundColor: '#cbd5e1' },
  stepText: { fontSize: 11, color: '#475569', flex: 1 },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  gpsModalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingVertical: 10,
    borderRadius: 10,
  },
  gpsModalBtnText: { color: '#059669', fontWeight: 'bold', fontSize: 13 },
  deleteModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  deleteModalBtnText: { color: '#dc2626', fontWeight: 'bold', fontSize: 13 },
  modalButton: {
    backgroundColor: '#102c35',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
});
