import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface CitizenReport {
  id: string;
  reference: string;
  title: string;
  category: string;
  district: string;
  date: string;
  status: 'NOUVEAU' | 'EN_COURS' | 'RESOLU';
  statusLabel: string;
  beforePhoto: string;
  afterPhoto?: string;
  resolutionNote?: string;
}

export default function MesSignalementsScreen() {
  const [filter, setFilter] = useState<'ALL' | 'EN_COURS' | 'RESOLU'>('ALL');
  const [selectedReport, setSelectedReport] = useState<CitizenReport | null>(null);

  const [reports] = useState<CitizenReport[]>([
    {
      id: 'cit-1',
      reference: 'REC-2026-0842',
      title: 'Dépôt sauvage de gravats et débris',
      category: 'Dépôt sauvage',
      district: '18 Rue de Marseille, Centre-Ville',
      date: '19 Nov 2026 · 09:42',
      status: 'RESOLU',
      statusLabel: 'Résolu & Nettoyé',
      beforePhoto: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=60',
      afterPhoto: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=500&auto=format&fit=crop&q=60',
      resolutionNote: 'Intervention terminée par la Brigade Voirie. Lieu déblayé et désinfecté.'
    },
    {
      id: 'cit-2',
      reference: 'REC-2026-0810',
      title: 'Vieux canapé et cartons volumineux',
      category: 'Encombrants',
      district: 'Avenue Habib Bourguiba, Menzah',
      date: '18 Nov 2026 · 14:15',
      status: 'EN_COURS',
      statusLabel: 'En cours d\'intervention',
      beforePhoto: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=500&auto=format&fit=crop&q=60',
      resolutionNote: 'Camion benne en route vers le lieu du signalement.'
    },
    {
      id: 'cit-3',
      reference: 'REC-2026-0795',
      title: 'Pots de peinture usagés',
      category: 'Déchets dangereux',
      district: 'Rue d\'Italie, Bab Bhar',
      date: '17 Nov 2026 · 11:20',
      status: 'RESOLU',
      statusLabel: 'Résolu & Sécurisé',
      beforePhoto: 'https://images.unsplash.com/photo-1528323273322-d81458248d40?w=500&auto=format&fit=crop&q=60',
      afterPhoto: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=500&auto=format&fit=crop&q=60',
      resolutionNote: 'Produits chimiques collectés par l\'équipe spéciale et acheminés au centre de traitement.'
    }
  ]);

  const filtered = reports.filter((r) => {
    if (filter === 'ALL') return true;
    return r.status === filter;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes Dossiers Citoyens</Text>
        <Text style={styles.headerSubtitle}>
          Suivez l'état d'avancement de vos signalements transmis à la Mairie de Tunis
        </Text>
      </View>

      {/* Filtres de Statut */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'ALL' && styles.filterChipActive]}
          onPress={() => setFilter('ALL')}
        >
          <Text style={[styles.filterChipText, filter === 'ALL' && styles.filterChipTextActive]}>
            Tous ({reports.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'EN_COURS' && styles.filterChipActive]}
          onPress={() => setFilter('EN_COURS')}
        >
          <Text style={[styles.filterChipText, filter === 'EN_COURS' && styles.filterChipTextActive]}>
            En cours ({reports.filter(r => r.status === 'EN_COURS').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'RESOLU' && styles.filterChipActive]}
          onPress={() => setFilter('RESOLU')}
        >
          <Text style={[styles.filterChipText, filter === 'RESOLU' && styles.filterChipTextActive]}>
            Résolus ({reports.filter(r => r.status === 'RESOLU').length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filtered.map((item) => (
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
                <View style={[
                  styles.badge,
                  item.status === 'RESOLU' ? styles.badgeResolved : styles.badgeProgress
                ]}>
                  <Text style={[
                    styles.badgeText,
                    item.status === 'RESOLU' ? styles.badgeResolvedText : styles.badgeProgressText
                  ]}>
                    {item.statusLabel}
                  </Text>
                </View>
              </View>

              <Text style={styles.titleText}>{item.title}</Text>
              
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={12} color="#64748b" />
                <Text style={styles.infoText} numberOfLines={1}>{item.district}</Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.dateText}>{item.date}</Text>
                <Text style={styles.detailsAction}>Voir détails & preuve →</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ================= MODALE DETAIL & PREUVE AVANT / APRES ================= */}
      {selectedReport && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalRef}>{selectedReport.reference}</Text>
                  <Text style={styles.modalTitle}>{selectedReport.title}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedReport(null)} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color="#0f172a" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                <View style={styles.photoComparisonSection}>
                  <View style={styles.photoBlock}>
                    <Text style={styles.photoLabel}>Photo Signalement (Avant)</Text>
                    <Image source={{ uri: selectedReport.beforePhoto }} style={styles.comparisonPhoto} />
                  </View>

                  {selectedReport.afterPhoto && (
                    <View style={styles.photoBlock}>
                      <Text style={[styles.photoLabel, { color: '#059669' }]}>Preuve de Résolution (Après)</Text>
                      <Image source={{ uri: selectedReport.afterPhoto }} style={styles.comparisonPhoto} />
                    </View>
                  )}
                </View>

                {selectedReport.resolutionNote && (
                  <View style={styles.noteBox}>
                    <Ionicons name="information-circle" size={16} color="#059669" />
                    <Text style={styles.noteText}>{selectedReport.resolutionNote}</Text>
                  </View>
                )}

                <View style={styles.timeline}>
                  <Text style={styles.timelineTitle}>Historique d'intervention</Text>
                  <View style={styles.timelineStep}>
                    <View style={[styles.stepDot, styles.dotDone]} />
                    <Text style={styles.stepText}>Signalement reçu et transmis au service voirie</Text>
                  </View>
                  <View style={styles.timelineStep}>
                    <View style={[styles.stepDot, styles.dotDone]} />
                    <Text style={styles.stepText}>Qualification IA et attribution de la brigade</Text>
                  </View>
                  <View style={styles.timelineStep}>
                    <View style={[styles.stepDot, selectedReport.status === 'RESOLU' ? styles.dotDone : styles.dotActive]} />
                    <Text style={styles.stepText}>
                      {selectedReport.status === 'RESOLU' ? 'Intervention achevée et photo transmise' : 'Équipe sur place en cours d\'intervention'}
                    </Text>
                  </View>
                </View>
              </ScrollView>

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
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 12, color: '#64748b', marginTop: 4 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
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
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  referenceText: { fontSize: 11, fontWeight: 'bold', color: '#1e3a8a' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  badgeResolved: { backgroundColor: '#ecfdf5', borderColor: '#059669' },
  badgeProgress: { backgroundColor: '#fffbeb', borderColor: '#d97706' },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  badgeResolvedText: { color: '#059669' },
  badgeProgressText: { color: '#d97706' },
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
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  modalRef: { fontSize: 12, fontWeight: 'bold', color: '#1e3a8a' },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginTop: 2 },
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
  stepText: { fontSize: 11, color: '#475569', flex: 1 },
  modalButton: {
    backgroundColor: '#102c35',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
});
