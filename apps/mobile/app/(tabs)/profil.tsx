import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../../src/store/authStore';
import { getMyInterventions, logWorkerEvent } from '../../src/services/interventionApi';
import { env } from '../../src/config/env';

const PREF_DUTY_KEY = 'ecotrack_pref_on_duty';
const PREF_SOUND_KEY = 'ecotrack_pref_sound_alerts';

export default function ProfilScreen() {
  const router = useRouter();
  const { user, accessToken, logout } = useAuthStore();

  // États opérationnels du profil (persistés localement)
  const [isOnDuty, setIsOnDuty] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [pingLoading, setPingLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const savedDuty = await SecureStore.getItemAsync(PREF_DUTY_KEY);
        const savedSound = await SecureStore.getItemAsync(PREF_SOUND_KEY);
        if (savedDuty !== null) setIsOnDuty(savedDuty === 'true');
        if (savedSound !== null) setSoundAlerts(savedSound === 'true');
      } catch {
        /* ignore secure store unavailable in web/test */
      }
    })();
  }, []);

  const role = user?.role || 'CITOYEN';
  const isWorker = role === 'CHEF_OUVRIER' || role === 'OUVRIER';

  // 1. Déconnexion
  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      `Voulez-vous fermer votre session (${user?.fullName || 'Utilisateur'}) ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  // 2. Navigation Feuille de Route (Chef Ouvrier)
  const handleGoToRoadmap = () => {
    router.push('/(tabs)/roadmap');
  };

  // 3. Navigation Signalements Citoyen
  const handleGoToReports = () => {
    router.push('/(tabs)/mes-signalements');
  };

  const handleGoToCreateReport = () => {
    router.push('/(tabs)/signaler');
  };

  // 4. Synchronisation réelle avec MongoDB
  const handleSyncInterventions = async () => {
    setSyncLoading(true);
    const res = await getMyInterventions(accessToken || undefined);
    setSyncLoading(false);

    if (res.kind === 'success') {
      Alert.alert(
        'Missions actualisées',
        `${res.data.length} mission(s) active(s) répertoriée(s) pour votre brigade.`
      );
    } else {
      Alert.alert('Erreur de synchronisation', res.message || 'Impossible de joindre le serveur.');
    }
  };

  // 5. Appel Dispatching Mairie
  const handleCallDispatching = () => {
    Alert.alert(
      'Pôle Dispatching Mairie',
      'Appeler le central technique des opérations de la Mairie de Zarzouna (+216 72 500 200) ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Appeler',
          onPress: () => {
            void Linking.openURL('tel:+21672500200');
          },
        },
      ]
    );
  };

  // 6. Signaler panne matériel / véhicule (Chef Ouvrier -> AuditLog MongoDB)
  const handleReportBreakdown = async () => {
    const res = await logWorkerEvent({
      actorId: user?.email || 'chef.voirie@zarzouna.tn',
      actorRole: role,
      action: 'EQUIPMENT_BREAKDOWN_REPORTED',
      entityType: 'Equipment',
      entityId: brigadeName,
      reason: 'Signalement panne camion benne / matériel depuis application mobile.',
      after: { brigade: brigadeName, status: 'PANNE_SIGNALEE' },
      token: accessToken || undefined,
    });

    if (res.kind === 'success') {
      Alert.alert(
        'Incident Matériel Enregistré ✅',
        'Votre signalement de panne a été enregistré dans le journal technique de la Mairie de Zarzouna.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Erreur d\'envoi', res.message || 'Impossible de joindre le journal technique.');
    }
  };

  // 7. Guide écocitoyen & déchetteries (Citoyen)
  const handleEcoGuide = () => {
    Alert.alert(
      'Guide Éco-Citoyen Zarzouna',
      '• Déchets ménagers : Collecte du lundi au samedi à partir de 20h.\n• Encombrants : Dépôt sur rendez-vous ou point d\'apport volontaire Zone Portuaire.\n• Déchets dangereux (peinture, huiles) : Interdits dans les bacs ordinaires, déchetterie municipale ouverte 8h-16h.'
    );
  };

  // 8. Test de liaison API Gateway Nginx
  const handleTestConnection = async () => {
    setPingLoading(true);
    const start = Date.now();
    try {
      const baseUrl = env.apiUrl || 'http://192.168.43.76:8090';
      const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/health`, { method: 'GET' });
      const duration = Date.now() - start;

      if (res.ok) {
        Alert.alert(
          'Connexion opérationnelle',
          `Le service EcoTrack est disponible (latence : ${duration} ms).`
        );
      } else {
        Alert.alert('Réponse anormale', `Code retour HTTP: ${res.status}`);
      }
    } catch {
      Alert.alert(
        'Erreur de liaison réseau',
        'Impossible de joindre le serveur EcoTrack. Vérifiez votre connexion Internet.'
      );
    } finally {
      setPingLoading(false);
    }
  };

  // 9. Basculer les alertes sonores
  const handleToggleSoundAlerts = async (value: boolean) => {
    setSoundAlerts(value);
    try {
      await SecureStore.setItemAsync(PREF_SOUND_KEY, String(value));
    } catch {
      /* ignore */
    }
    Alert.alert(
      'Préférences Notifications',
      value
        ? (isWorker
            ? 'Alertes sonores activées pour toute nouvelle mission d\'intervention assignée.'
            : 'Alertes sonores activées pour chaque mise à jour de vos signalements.')
        : 'Mode silencieux activé : seules les notifications visuelles seront affichées.'
    );
  };

  // 9b. Basculer la disponibilité terrain
  const handleToggleDuty = async (val: boolean) => {
    setIsOnDuty(val);
    try {
      await SecureStore.setItemAsync(PREF_DUTY_KEY, String(val));
    } catch {
      /* ignore */
    }
    void logWorkerEvent({
      actorId: user?.email || 'chef.voirie@zarzouna.tn',
      actorRole: role,
      action: 'WORKER_DUTY_CHANGED',
      entityType: 'User',
      entityId: user?.id || user?.email || 'chef.voirie@zarzouna.tn',
      reason: val ? 'Prise de service terrain' : 'Pause / Fin de shift terrain',
      after: { isOnDuty: val },
      token: accessToken || undefined,
    });
    Alert.alert('Statut de service', val ? 'Vous êtes noté EN SERVICE ACTIF.' : 'Vous êtes noté EN PAUSE.');
  };

  // 10. Consignes de sécurité EPI & règlements
  const handleSafetyGuidelines = () => {
    if (isWorker) {
      Alert.alert(
        'Consignes de Sécurité & EPI',
        '1. Port obligatoire du gilet haute visibilité classe 2.\n2. Chaussures de sécurité et gants anti-coupure.\n3. Balisage par cônes de signalisation sur voie circulante.\n4. Photo avant et après obligatoire pour validation municipale.'
      );
    } else {
      Alert.alert(
        'Charte Civique & Propreté Urbaine',
        'La propreté de notre ville est l\'affaire de tous. Merci de ne pas déposer de déchets sauvages sur la voie publique et de signaler toute anomalie constatée.'
      );
    }
  };

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : (isWorker ? 'CO' : 'CZ');

  const brigadeName = user?.email?.includes('poidslourd')
    ? 'Brigade Ramassage Poids Lourd'
    : 'Brigade Voirie & Salubrité';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── 1. CARTE PROFIL PRINCIPALE ── */}
        <View style={styles.profileCard}>
          <View style={[styles.avatar, isWorker ? styles.workerAvatarBg : styles.citizenAvatarBg]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{user?.fullName || (isWorker ? 'Mohamed Ali Khemiri' : 'Citoyen Zarzouna')}</Text>
          <Text style={styles.userEmail}>{user?.email || (isWorker ? 'chef.voirie@zarzouna.tn' : 'citoyen@zarzouna.tn')}</Text>

          <View style={[styles.roleBadge, isWorker ? styles.workerBadgeBg : styles.citizenBadgeBg]}>
            <Text style={[styles.roleText, isWorker ? styles.workerBadgeText : styles.citizenBadgeText]}>
              {isWorker ? 'CHEF D\'ÉQUIPE OPÉRATIONNEL' : 'CITOYEN'}
            </Text>
          </View>
        </View>

        {/* ── 2. CARTE BRIGADE & COLLECTIVITÉ ── */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="business" size={20} color="#059669" />
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>Collectivité territoriale</Text>
              <Text style={styles.infoValue}>{user?.municipality || 'Mairie de Zarzouna'}</Text>
            </View>
          </View>

          {isWorker && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Ionicons name="shield-checkmark" size={20} color="#2563eb" />
                <View style={styles.infoTexts}>
                  <Text style={styles.infoLabel}>Unité opérationnelle assignée</Text>
                  <Text style={styles.infoValue}>{brigadeName}</Text>
                </View>
              </View>

              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Ionicons name="radio-button-on" size={20} color={isOnDuty ? '#059669' : '#94a3b8'} />
                <View style={styles.infoTexts}>
                  <Text style={styles.infoLabel}>Disponibilité terrain</Text>
                  <Text style={[styles.infoValue, { color: isOnDuty ? '#059669' : '#64748b' }]}>
                    {isOnDuty ? 'En service actif sur le terrain' : 'En pause / Fin de shift'}
                  </Text>
                </View>
                <Switch
                  value={isOnDuty}
                  onValueChange={handleToggleDuty}
                  trackColor={{ false: '#cbd5e1', true: '#a7f3d0' }}
                  thumbColor={isOnDuty ? '#059669' : '#f1f5f9'}
                />
              </View>
            </>
          )}

          {!isWorker && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Ionicons name="shield-checkmark" size={20} color="#059669" />
                <View style={styles.infoTexts}>
                  <Text style={styles.infoLabel}>Statut du compte</Text>
                  <Text style={styles.infoValue}>Citoyen vérifié de la commune de Zarzouna</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* ── 3. ACTIONS OPÉRATIONNELLES SELON RÔLE ── */}
        {isWorker ? (
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Opérations & Feuille de Route</Text>

            <View style={styles.menuCard}>
              <TouchableOpacity style={styles.menuItem} onPress={handleGoToRoadmap}>
                <View style={[styles.iconCircle, { backgroundColor: '#dbeafe' }]}>
                  <Ionicons name="navigate" size={18} color="#2563eb" />
                </View>
                <View style={styles.menuTexts}>
                  <Text style={styles.menuLabel}>Ouvrir ma Feuille de Route</Text>
                  <Text style={styles.menuSublabel}>Consulter les chantiers assignés</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity style={styles.menuItem} onPress={handleSyncInterventions} disabled={syncLoading}>
                <View style={[styles.iconCircle, { backgroundColor: '#d1fae5' }]}>
                  {syncLoading ? (
                    <ActivityIndicator size="small" color="#059669" />
                  ) : (
                    <Ionicons name="sync" size={18} color="#059669" />
                  )}
                </View>
                <View style={styles.menuTexts}>
                  <Text style={styles.menuLabel}>Actualiser mes missions</Text>
                  <Text style={styles.menuSublabel}>Mettre à jour les interventions en direct</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity style={styles.menuItem} onPress={handleCallDispatching}>
                <View style={[styles.iconCircle, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="call" size={18} color="#b45309" />
                </View>
                <View style={styles.menuTexts}>
                  <Text style={styles.menuLabel}>Appeler le Dispatching Mairie</Text>
                  <Text style={styles.menuSublabel}>Contact direct bureau municipal (+216 72 500 200)</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity style={styles.menuItem} onPress={handleReportBreakdown}>
                <View style={[styles.iconCircle, { backgroundColor: '#fee2e2' }]}>
                  <Ionicons name="warning" size={18} color="#dc2626" />
                </View>
                <View style={styles.menuTexts}>
                  <Text style={styles.menuLabel}>Signaler Panne Engin / Matériel</Text>
                  <Text style={styles.menuSublabel}>Alerter les ateliers municipaux</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Espace Citoyen & Signalements</Text>

            <View style={styles.menuCard}>
              <TouchableOpacity style={styles.menuItem} onPress={handleGoToReports}>
                <View style={[styles.iconCircle, { backgroundColor: '#d1fae5' }]}>
                  <Ionicons name="list" size={18} color="#059669" />
                </View>
                <View style={styles.menuTexts}>
                  <Text style={styles.menuLabel}>Consulter mes Dossiers</Text>
                  <Text style={styles.menuSublabel}>Suivre l'avancement de mes signalements</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity style={styles.menuItem} onPress={handleGoToCreateReport}>
                <View style={[styles.iconCircle, { backgroundColor: '#dbeafe' }]}>
                  <Ionicons name="add-circle" size={18} color="#2563eb" />
                </View>
                <View style={styles.menuTexts}>
                  <Text style={styles.menuLabel}>Signaler une Anomalie</Text>
                  <Text style={styles.menuSublabel}>Prendre une photo et alerter la mairie</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity style={styles.menuItem} onPress={handleCallDispatching}>
                <View style={[styles.iconCircle, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="call" size={18} color="#b45309" />
                </View>
                <View style={styles.menuTexts}>
                  <Text style={styles.menuLabel}>Contacter la Mairie de Zarzouna</Text>
                  <Text style={styles.menuSublabel}>Accueil téléphonique (+216 72 500 200)</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity style={styles.menuItem} onPress={handleEcoGuide}>
                <View style={[styles.iconCircle, { backgroundColor: '#f3e8ff' }]}>
                  <Ionicons name="book" size={18} color="#7c3aed" />
                </View>
                <View style={styles.menuTexts}>
                  <Text style={styles.menuLabel}>Guide Pratique du Tri & Déchetteries</Text>
                  <Text style={styles.menuSublabel}>Horaires, points d'apport et consignes</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── 4. PARAMÈTRES & SYSTÈME ── */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>Connectivité & Préférences</Text>

          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem} onPress={handleTestConnection} disabled={pingLoading}>
              <View style={[styles.iconCircle, { backgroundColor: '#f1f5f9' }]}>
                {pingLoading ? (
                  <ActivityIndicator size="small" color="#0f172a" />
                ) : (
                  <Ionicons name="wifi" size={18} color="#0f172a" />
                )}
              </View>
              <View style={styles.menuTexts}>
                <Text style={styles.menuLabel}>État de la connexion</Text>
                <Text style={styles.menuSublabel}>Vérifier la disponibilité du service</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <View style={styles.menuItem}>
              <View style={[styles.iconCircle, { backgroundColor: '#f1f5f9' }]}>
                <Ionicons name="notifications" size={18} color="#0f172a" />
              </View>
              <View style={styles.menuTexts}>
                <Text style={styles.menuLabel}>Alertes Sonores de Mission</Text>
                <Text style={styles.menuSublabel}>Bip sonore aux changements d'état</Text>
              </View>
              <Switch
                value={soundAlerts}
                onValueChange={handleToggleSoundAlerts}
                trackColor={{ false: '#cbd5e1', true: '#a7f3d0' }}
                thumbColor={soundAlerts ? '#059669' : '#f1f5f9'}
              />
            </View>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={handleSafetyGuidelines}>
              <View style={[styles.iconCircle, { backgroundColor: '#f1f5f9' }]}>
                <Ionicons name="shield" size={18} color="#0f172a" />
              </View>
              <View style={styles.menuTexts}>
                <Text style={styles.menuLabel}>
                  {isWorker ? 'Consignes de Sécurité & Protocoles EPI' : 'Charte Citoyenne de Salubrité'}
                </Text>
                <Text style={styles.menuSublabel}>
                  {isWorker ? 'Règlementation communale et EPI' : 'Bonnes pratiques pour la ville de Zarzouna'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 5. BOUTON DÉCONNEXION ── */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color="#dc2626" />
          <Text style={styles.logoutText}>Se déconnecter de l'application</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>EcoTrack Mobile v1.0.0 • {user?.municipality || 'Mairie de Zarzouna'}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 18, paddingBottom: 40 },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  workerAvatarBg: { backgroundColor: '#102c35' },
  citizenAvatarBg: { backgroundColor: '#059669' },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  userEmail: { fontSize: 13, color: '#64748b', marginTop: 2 },
  roleBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  roleText: { fontSize: 11, fontWeight: 'bold' },
  workerBadgeBg: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  workerBadgeText: { fontSize: 11, fontWeight: 'bold', color: '#15803d' },
  citizenBadgeBg: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  citizenBadgeText: { fontSize: 11, fontWeight: 'bold', color: '#1d4ed8' },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoTexts: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#64748b' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#0f172a', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },
  sectionBox: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTexts: { flex: 1 },
  menuLabel: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  menuSublabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  menuDivider: { height: 1, backgroundColor: '#f1f5f9' },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    padding: 14,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  logoutText: { fontSize: 14, fontWeight: 'bold', color: '#dc2626' },
  versionText: { fontSize: 11, color: '#94a3b8', textAlign: 'center' },
});
