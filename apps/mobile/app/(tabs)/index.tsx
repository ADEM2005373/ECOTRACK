import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Figma Header Citoyen (MOB_CIT_01_MAP_HOME) */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.brandRow}>
              <View style={styles.emblem}>
                <Ionicons name="leaf" size={18} color="#ffffff" />
              </View>
              <View>
                <Text style={styles.brandName}>ECOTRACK</Text>
                <Text style={styles.brandSubtitle}>VILLE DE TUNIS</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.7}>
              <Ionicons name="notifications-outline" size={20} color="#0f172a" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>

          <View style={styles.greetingSection}>
            <Text style={styles.greetingTitle}>Bonjour, {user?.fullName || 'Citoyen'} 👋</Text>
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
                Prenez une photo : l'IA détecte la catégorie et alerte la mairie en temps réel.
              </Text>
            </View>
          </View>
          <View style={styles.actionArrow}>
            <Ionicons name="arrow-forward" size={18} color="#059669" />
          </View>
        </TouchableOpacity>

        {/* Chiffres Clés Salubrité de la Ville */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIconWrapper}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
            </View>
            <Text style={styles.statNumber}>94.2%</Text>
            <Text style={styles.statLabel}>Signalements résolus</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconWrapper}>
              <Ionicons name="time" size={16} color="#2563eb" />
            </View>
            <Text style={styles.statNumber}>24 h</Text>
            <Text style={styles.statLabel}>Délai moyen SLA</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconWrapper}>
              <Ionicons name="people" size={16} color="#7c3aed" />
            </View>
            <Text style={styles.statNumber}>18</Text>
            <Text style={styles.statLabel}>Brigades mobilisées</Text>
          </View>
        </View>

        {/* Signalements Récents du Quartier */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Interventions dans votre quartier</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/mes-signalements')}>
            <Text style={styles.sectionLink}>Voir mes dossiers</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.reportsList}>
          {[
            {
              id: '1',
              title: 'Dépôt sauvage de gravats',
              location: '18 Rue de Marseille, Centre-Ville',
              status: 'RESOLU',
              statusLabel: 'Résolu',
              statusColor: '#059669',
              statusBg: '#ecfdf5',
              time: 'Il y a 2h',
              image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=300&auto=format&fit=crop&q=60'
            },
            {
              id: '2',
              title: 'Encombrants électroménagers',
              location: 'Avenue Habib Bourguiba, Menzah',
              status: 'EN_COURS',
              statusLabel: 'En intervention',
              statusColor: '#d97706',
              statusBg: '#fffbeb',
              time: 'Il y a 4h',
              image: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=300&auto=format&fit=crop&q=60'
            },
            {
              id: '3',
              title: 'Déchets plastiques et cartons',
              location: 'Rue de Rome, Bab Bhar',
              status: 'NOUVEAU',
              statusLabel: 'Transmis mairie',
              statusColor: '#2563eb',
              statusBg: '#eff6ff',
              time: 'Hier',
              image: 'https://images.unsplash.com/photo-1528323273322-d81458248d40?w=300&auto=format&fit=crop&q=60'
            }
          ].map((item) => (
            <View key={item.id} style={styles.reportCard}>
              <Image source={{ uri: item.image }} style={styles.reportImage} />
              <View style={styles.reportContent}>
                <View style={styles.reportTopRow}>
                  <Text style={styles.reportTime}>{item.time}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: item.statusBg, borderColor: item.statusColor }]}>
                    <Text style={[styles.statusText, { color: item.statusColor }]}>{item.statusLabel}</Text>
                  </View>
                </View>
                <Text style={styles.reportTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={12} color="#64748b" />
                  <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emblem: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#059669',
    letterSpacing: 1.5,
  },
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
  greetingSection: {
    marginTop: 4,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  greetingSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 18,
  },
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
  actionBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTexts: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  actionDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 15,
  },
  actionArrow: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    alignItems: 'flex-start',
  },
  statIconWrapper: {
    marginBottom: 6,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#059669',
  },
  reportsList: {
    gap: 12,
  },
  reportCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
  },
  reportImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  reportContent: {
    flex: 1,
    justifyContent: 'center',
  },
  reportTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reportTime: {
    fontSize: 10,
    color: '#94a3b8',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  reportTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    color: '#64748b',
  },
});
