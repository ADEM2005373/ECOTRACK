import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { EcoTrackLogo } from '../../src/components/EcoTrackLogo';
import { getCommunityReports, type CitizenReport } from '../../src/services/reportApi';

export default function HomeScreen() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();

  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  React.useEffect(() => {
    if (user?.role === 'CHEF_OUVRIER' || user?.role === 'OUVRIER') {
      router.replace('/(tabs)/roadmap');
    }
  }, [user?.role, router]);

  const loadReports = useCallback(async () => {
    const res = await getCommunityReports(accessToken);
    if (res.kind === 'success') {
      setReports(res.data);
    }
  }, [accessToken]);

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

  const totalCount = reports.length;
  const resolvedCount = reports.filter((r) => r.status === 'RESOLU').length;
  const inProgressCount = reports.filter((r) => r.status === 'EN_COURS').length;
  const resolutionRate = totalCount > 0 ? `${Math.round((resolvedCount / totalCount) * 100)}%` : '0%';

  const statusColors = (status: CitizenReport['status']) => {
    if (status === 'RESOLU') return { color: '#059669', bg: '#ecfdf5' };
    if (status === 'REJETE') return { color: '#dc2626', bg: '#fef2f2' };
    if (status === 'EN_COURS') return { color: '#d97706', bg: '#fffbeb' };
    return { color: '#2563eb', bg: '#eff6ff' };
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor="#059669" colors={['#059669']} />
        }
      >
        {/* Header Citoyen */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.brandRow}>
              <EcoTrackLogo size={36} />
              <View>
                <Text style={styles.brandName}>ECOTRACK</Text>
                <Text style={styles.brandSubtitle}>{user?.municipality?.toUpperCase() || 'MAIRIE DE ZARZOUNA'}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.notificationBtn}
              activeOpacity={0.7}
              onPress={() =>
                Alert.alert(
                  'Centre de Notifications',
                  `${inProgressCount} intervention(s) en cours et ${resolvedCount} dossier(s) résolu(s) dans votre commune.`
                )
              }
            >
              <Ionicons name="notifications-outline" size={20} color="#0f172a" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>

          <View style={styles.greetingSection}>
            <Text style={styles.greetingTitle}>Bonjour, {user?.fullName || 'Citoyen'}</Text>
            <Text style={styles.greetingSubtitle}>
              Participez à la salubrité de votre quartier en signalant les anomalies urbaines.
            </Text>
          </View>
        </View>

        {/* Bannière d'Action Rapide : Signaler */}
        <TouchableOpacity
          style={styles.actionBanner}
          activeOpacity={0.85}
          onPress={() => router.push('/(tabs)/signaler')}
        >
          <View style={styles.actionBannerContent}>
            <View style={styles.actionIconCircle}>
              <Ionicons name="camera" size={24} color="#059669" />
            </View>
            <View style={styles.actionTexts}>
              <Text style={styles.actionTitle}>Signaler une anomalie</Text>
              <Text style={styles.actionDesc}>
                Prenez une photo et alertez la mairie en temps réel.
              </Text>
            </View>
          </View>
          <View style={styles.actionArrow}>
            <Ionicons name="arrow-forward" size={18} color="#059669" />
          </View>
        </TouchableOpacity>

        {/* Chiffres Clés Temps Réel depuis MongoDB */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIconWrapper}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
            </View>
            <Text style={styles.statNumber}>{resolutionRate}</Text>
            <Text style={styles.statLabel}>Taux de résolution</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconWrapper}>
              <Ionicons name="flash" size={16} color="#d97706" />
            </View>
            <Text style={styles.statNumber}>{inProgressCount}</Text>
            <Text style={styles.statLabel}>En intervention</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconWrapper}>
              <Ionicons name="document-text" size={16} color="#2563eb" />
            </View>
            <Text style={styles.statNumber}>{totalCount}</Text>
            <Text style={styles.statLabel}>Dossiers commune</Text>
          </View>
        </View>

        {/* Signalements Récents du Quartier (MongoDB en direct) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Interventions dans votre quartier</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/mes-signalements')}>
            <Text style={styles.sectionLink}>Voir mes dossiers</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#059669" />
            <Text style={styles.loadingText}>Chargement des interventions...</Text>
          </View>
        ) : reports.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Aucun signalement récent enregistré pour le moment.</Text>
          </View>
        ) : (
          <View style={styles.reportsList}>
            {reports.slice(0, 5).map((item) => {
              const sc = statusColors(item.status);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.reportCard}
                  activeOpacity={0.8}
                  onPress={() => router.push('/(tabs)/mes-signalements')}
                >
                  <Image source={{ uri: item.beforePhoto }} style={styles.reportImage} />
                  <View style={styles.reportContent}>
                    <View style={styles.reportTopRow}>
                      <Text style={styles.reportTime}>{item.reference}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: sc.bg, borderColor: sc.color }]}>
                        <Text style={[styles.statusText, { color: sc.color }]}>{item.statusLabel}</Text>
                      </View>
                    </View>
                    <Text style={styles.reportTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={12} color="#64748b" />
                      <Text style={styles.locationText} numberOfLines={1}>{item.district}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emblem: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', letterSpacing: -0.3 },
  brandSubtitle: { fontSize: 9, fontWeight: 'bold', color: '#059669', letterSpacing: 1.5 },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
    position: 'absolute',
    top: 10,
    right: 10,
  },
  greetingSection: { marginTop: 4 },
  greetingTitle: { fontSize: 22, fontWeight: 'bold', color: '#0f172a' },
  greetingSubtitle: { fontSize: 13, color: '#64748b', marginTop: 4, lineHeight: 18 },
  actionBanner: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  actionBannerContent: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTexts: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  actionDesc: { fontSize: 11, color: '#64748b', marginTop: 2, lineHeight: 15 },
  actionArrow: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    alignItems: 'flex-start',
  },
  statIconWrapper: { marginBottom: 6 },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  statLabel: { fontSize: 10, color: '#64748b', marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  sectionLink: { fontSize: 12, fontWeight: 'bold', color: '#059669' },
  loadingBox: { padding: 24, alignItems: 'center', gap: 8 },
  loadingText: { fontSize: 12, color: '#64748b' },
  emptyBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  emptyText: { fontSize: 12, color: '#64748b' },
  reportsList: { gap: 12 },
  reportCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
  },
  reportImage: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#f1f5f9' },
  reportContent: { flex: 1, justifyContent: 'center' },
  reportTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reportTime: { fontSize: 10, color: '#1e3a8a', fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  reportTitle: { fontSize: 13, fontWeight: 'bold', color: '#0f172a', marginBottom: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 11, color: '#64748b', flex: 1 },
});
