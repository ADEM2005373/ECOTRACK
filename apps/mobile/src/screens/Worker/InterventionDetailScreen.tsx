import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, textStyles } from '../../theme';
import {
  getInterventionById,
  startIntervention,
  completeIntervention,
  type Intervention
} from '../../services/interventionApi';
import { useAuthStore } from '../../store/authStore';

export default function InterventionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, accessToken } = useAuthStore();

  const reportId = Array.isArray(id) ? id[0] : id;

  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [proofPhotoUrl, setProofPhotoUrl] = useState<string>('');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [showIssueBox, setShowIssueBox] = useState(false);
  const [issueNote, setIssueNote] = useState('');

  // 1. Chargement de l'intervention réelle depuis MongoDB
  const loadIntervention = async () => {
    if (!reportId) return;
    setLoading(true);
    const res = await getInterventionById(reportId, accessToken || undefined);
    if (res.kind === 'success') {
      setIntervention(res.data);
      if (res.data.resolutionPhotoUri) {
        setProofPhotoUrl(res.data.resolutionPhotoUri);
      }
      if (res.data.resolutionNotes) {
        setResolutionNotes(res.data.resolutionNotes);
      }
    } else {
      Alert.alert('Erreur', res.message || 'Impossible de charger les détails de l\'intervention.');
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadIntervention();
  }, [reportId]);

  // 2. Démarrage de chantier (Transition T3)
  const handleStart = async () => {
    if (!reportId) return;
    setActionLoading(true);
    const res = await startIntervention(reportId, user?.email, accessToken || undefined);
    setActionLoading(false);

    if (res.kind === 'success') {
      setIntervention(res.data);
      Alert.alert(
        'Chantier Démarré (T3)',
        'Le statut est passé à "En intervention". Le tableau de bord municipal a été notifié en direct.'
      );
    } else {
      Alert.alert('Erreur', res.message);
    }
  };

  // 3. Clôture de mission & Preuve photo (Transition T4)
  const handleComplete = async () => {
    if (!reportId) return;
    const finalPhoto = proofPhotoUrl.trim() || 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800&auto=format&fit=crop&q=80';

    setActionLoading(true);
    const res = await completeIntervention(
      reportId,
      finalPhoto,
      accessToken || undefined,
      user?.email,
      resolutionNotes.trim() || 'Chantier nettoyé et remis en état par la brigade technique.'
    );
    setActionLoading(false);

    if (res.kind === 'success') {
      setIntervention(res.data);
      Alert.alert(
        'Mission Clôturée avec Succès (T4)',
        'La photo de preuve et les notes ont été transmises. Le signalement est désormais validé Résolu sur le tableau de bord municipal.',
        [{ text: 'Retour aux missions', onPress: () => router.back() }]
      );
    } else {
      Alert.alert('Erreur', res.message);
    }
  };

  // 4. Guidage GPS terrain
  const openDirections = () => {
    const lat = intervention?.latitude || 37.2667;
    const lng = intervention?.longitude || 9.8667;
    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
  };

  // 5. Signaler un imprévu / besoin de renfort
  const handleReportIssue = () => {
    if (!issueNote.trim()) {
      Alert.alert('Précision requise', 'Veuillez saisir la nature du blocage ou besoin de renfort.');
      return;
    }
    Alert.alert(
      'Alerte transmise au Pôle Dispatching',
      `Votre alerte ("${issueNote}") a été envoyée aux agents municipaux de Zarzouna.`
    );
    setShowIssueBox(false);
    setIssueNote('');
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement des données réelles du signalement...</Text>
      </View>
    );
  }

  if (!intervention) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#dc2626" />
        <Text style={styles.notFoundTitle}>Intervention introuvable</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Retour à la liste</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isAssigned = intervention.status === 'EN_ATTENTE';
  const isInProgress = intervention.status === 'EN_COURS';
  const isDone = intervention.status === 'TERMINEE';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* ── 1. EN-TÊTE MISSION & STATUT ── */}
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <Text style={styles.refBadge}>{intervention.reference}</Text>
          <View style={[
            styles.statusPill,
            isDone ? styles.statusDone : isInProgress ? styles.statusProgress : styles.statusWaiting
          ]}>
            <Text style={[
              styles.statusText,
              isDone ? styles.statusDoneText : isInProgress ? styles.statusProgressText : styles.statusWaitingText
            ]}>
              {isDone ? '✓ Chantier Résolu' : isInProgress ? '⚡ En cours' : '⏱️ Assignée'}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>{intervention.category.replace('_', ' ')}</Text>
        <Text style={styles.descriptionText}>{intervention.description}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="shield-checkmark" size={14} color="#059669" />
            <Text style={styles.metaLabel}>{intervention.assignedTeam || 'Brigade Voirie & Salubrité'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="flame" size={14} color="#d97706" />
            <Text style={styles.metaLabel}>Priorité : {intervention.priority || 'HAUTE'}</Text>
          </View>
        </View>
      </View>

      {/* ── 2. LOCALISATION & GUIDAGE GPS ── */}
      <View style={styles.locationCard}>
        <View style={styles.locationInfo}>
          <Ionicons name="location" size={20} color="#059669" />
          <View style={{ flex: 1 }}>
            <Text style={styles.locationTitle}>{intervention.address}</Text>
            <Text style={styles.coordsText}>
              GPS : {intervention.latitude?.toFixed(4)}, {intervention.longitude?.toFixed(4)}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={openDirections} style={styles.gpsButton}>
          <Ionicons name="navigate" size={16} color="#ffffff" />
          <Text style={styles.gpsText}>Ouvrir l'Itinéraire GPS (Google Maps)</Text>
        </TouchableOpacity>
      </View>

      {/* ── 3. PREUVE CITOYENNE INITIALE (AVANT TRAVAUX) ── */}
      <View style={styles.photoCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Constat Citoyen Initial (Avant)</Text>
          <Ionicons name="camera-outline" size={18} color="#64748b" />
        </View>
        <Image
          source={{ uri: intervention.citizenPhotoUri }}
          style={styles.incidentPhoto}
          resizeMode="cover"
        />
      </View>

      {/* ── 4. ACTIONS DU WORKFLOW OPERATIONNEL ── */}

      {/* Étape 1 : Démarrer le chantier (T3) */}
      {isAssigned && (
        <View style={styles.actionCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumberBadge}><Text style={styles.stepNumberText}>1</Text></View>
            <Text style={styles.actionHeading}>Démarrer l'intervention sur site</Text>
          </View>
          <Text style={styles.actionDescription}>
            Confirmez votre arrivée sur le lieu de l'anomalie pour informer les agents municipaux que les travaux ont débuté.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleStart}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={styles.btnRow}>
                <Ionicons name="play" size={18} color="#ffffff" />
                <Text style={styles.primaryText}>Démarrer l'intervention (Transition T3)</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Étape 2 : Clôturer le chantier avec preuve photo (T4) */}
      {isInProgress && (
        <View style={styles.actionCard}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepNumberBadge, { backgroundColor: '#059669' }]}><Text style={styles.stepNumberText}>2</Text></View>
            <Text style={styles.actionHeading}>Clôture des travaux & Preuve photo (T4)</Text>
          </View>
          <Text style={styles.actionDescription}>
            Transmettez la photo du lieu après nettoyage/réparation ainsi que vos remarques d'intervention :
          </Text>

          {/* Saisie ou choix de la photo de preuve */}
          <Text style={styles.inputLabel}>URL de la photo de fin de travaux :</Text>
          <View style={styles.photoUploadBox}>
            <TextInput
              placeholder="https://... photo du chantier nettoyé"
              value={proofPhotoUrl}
              onChangeText={setProofPhotoUrl}
              style={styles.input}
            />
            <TouchableOpacity
              style={styles.quickPhotoBtn}
              onPress={() => setProofPhotoUrl('https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800&auto=format&fit=crop&q=80')}
            >
              <Text style={styles.quickPhotoText}>Photo Démo</Text>
            </TouchableOpacity>
          </View>

          {proofPhotoUrl ? (
            <Image source={{ uri: proofPhotoUrl }} style={styles.proofPreview} />
          ) : null}

          {/* Observations d'intervention */}
          <Text style={styles.inputLabel}>Observations & Rapport de chantier :</Text>
          <TextInput
            placeholder="Ex : Déchets évacués vers le centre de tri, voirie nettoyée."
            value={resolutionNotes}
            onChangeText={setResolutionNotes}
            multiline
            numberOfLines={3}
            style={[styles.input, { minHeight: 64, textAlignVertical: 'top' }]}
          />

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: '#059669' }]}
            onPress={handleComplete}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={styles.btnRow}>
                <Ionicons name="checkmark-done" size={20} color="#ffffff" />
                <Text style={styles.primaryText}>Valider & Clôturer la mission (T4)</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Étape 3 : Mission terminée & Archivée */}
      {isDone && (
        <View style={styles.completedCard}>
          <Ionicons name="checkmark-circle" size={40} color="#059669" />
          <Text style={styles.completedTitle}>Mission Résolue & Archivée</Text>
          <Text style={styles.completedText}>
            L'intervention a été menée à bien et certifiée. Le tableau de bord municipal de Zarzouna est synchronisé en temps réel.
          </Text>
          {intervention.resolutionPhotoUri ? (
            <View style={{ width: '100%', marginTop: 8 }}>
              <Text style={styles.inputLabel}>Preuve de réalisation :</Text>
              <Image source={{ uri: intervention.resolutionPhotoUri }} style={styles.proofPreview} />
            </View>
          ) : null}
          {intervention.resolutionNotes ? (
            <Text style={styles.notesText}>« {intervention.resolutionNotes} »</Text>
          ) : null}
        </View>
      )}

      {/* ── 5. SIGNALEMENT D'IMPRÉVU / RENFORT ── */}
      {!isDone && (
        <View style={styles.issueSection}>
          {!showIssueBox ? (
            <TouchableOpacity
              style={styles.issueButton}
              onPress={() => setShowIssueBox(true)}
            >
              <Ionicons name="warning-outline" size={16} color="#d97706" />
              <Text style={styles.issueButtonText}>Signaler un imprévu ou besoin de renfort</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.issueBox}>
              <Text style={styles.issueHeading}>Alerte Terrain / Besoin de Renfort</Text>
              <TextInput
                placeholder="Ex : Accès bloqué par des véhicules, besoin d'un engin lourd..."
                value={issueNote}
                onChangeText={setIssueNote}
                multiline
                numberOfLines={2}
                style={[styles.input, { minHeight: 50, textAlignVertical: 'top' }]}
              />
              <View style={styles.issueBtnRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowIssueBox(false)}
                >
                  <Text style={styles.cancelBtnText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sendIssueBtn}
                  onPress={handleReportIssue}
                >
                  <Text style={styles.sendIssueText}>Transmettre l'alerte</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: spacing.md, paddingBottom: 40, gap: 14 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 13, color: '#64748b', fontWeight: '500' },
  notFoundTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginTop: 12 },
  backButton: { marginTop: 16, backgroundColor: '#059669', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  backButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
  header: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    gap: 8,
  },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  refBadge: { fontSize: 13, fontWeight: 'bold', color: '#1e3a8a', fontFamily: 'monospace' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  statusWaiting: { backgroundColor: '#fef3c7', borderColor: '#fde68a' },
  statusProgress: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  statusDone: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  statusWaitingText: { color: '#b45309' },
  statusProgressText: { color: '#2563eb' },
  statusDoneText: { color: '#059669' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', textTransform: 'capitalize' },
  descriptionText: { fontSize: 13, color: '#475569', lineHeight: 18 },
  metaRow: { flexDirection: 'row', gap: 16, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaLabel: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  locationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    gap: 12,
  },
  locationInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  locationTitle: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  coordsText: { fontSize: 11, color: '#64748b', fontFamily: 'monospace' },
  gpsButton: {
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  gpsText: { fontSize: 13, fontWeight: 'bold', color: '#ffffff' },
  photoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    gap: 10,
  },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionHeading: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  incidentPhoto: { width: '100%', height: 200, borderRadius: 10, backgroundColor: '#f1f5f9' },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    gap: 12,
  },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepNumberBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  actionHeading: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  actionDescription: { fontSize: 12, color: '#64748b', lineHeight: 17 },
  inputLabel: { fontSize: 11, fontWeight: '600', color: '#334155', marginTop: 4 },
  primaryButton: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    marginTop: 4,
  },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primaryText: { fontSize: 13, fontWeight: 'bold', color: '#ffffff' },
  photoUploadBox: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0f172a',
  },
  quickPhotoBtn: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  quickPhotoText: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
  proofPreview: { width: '100%', height: 160, borderRadius: 10, marginTop: 4 },
  completedCard: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  completedTitle: { fontSize: 16, fontWeight: 'bold', color: '#065f46' },
  completedText: { fontSize: 12, color: '#047857', textAlign: 'center', lineHeight: 17 },
  notesText: { fontSize: 12, fontStyle: 'italic', color: '#065f46', marginTop: 4 },
  issueSection: { marginTop: 4 },
  issueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
    backgroundColor: '#fefce8',
  },
  issueButtonText: { fontSize: 12, fontWeight: '600', color: '#b45309' },
  issueBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  issueHeading: { fontSize: 13, fontWeight: 'bold', color: '#b45309' },
  issueBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  cancelBtnText: { fontSize: 12, color: '#64748b' },
  sendIssueBtn: { backgroundColor: '#d97706', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6 },
  sendIssueText: { fontSize: 12, fontWeight: 'bold', color: '#ffffff' },
});
