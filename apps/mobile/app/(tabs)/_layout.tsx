import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, textStyles, touchTarget } from '../../src/theme';
import { useAuthStore } from '../../src/store/authStore';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const tabIcon =
  (name: IconName) =>
  ({ color, size }: { color: string; size: number }) => <Ionicons name={name} size={size} color={color} />;

export default function TabsLayout() {
  const user = useAuthStore((state) => state.user);
  const role = user?.role || 'CITOYEN';

  const isWorker = role === 'CHEF_OUVRIER' || role === 'OUVRIER';
  const isCitizen = role === 'CITOYEN';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabBar.active,
        tabBarInactiveTintColor: colors.tabBar.inactive,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
        },
        tabBarItemStyle: { minHeight: touchTarget.min, minWidth: touchTarget.min },
        tabBarLabelStyle: { fontFamily: textStyles.label.fontFamily, fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: '#ffffff', borderBottomColor: '#e2e8f0', borderBottomWidth: 1 },
        headerTintColor: '#0f172a',
        headerTitleStyle: { fontFamily: textStyles.subtitle.fontFamily, fontWeight: 'bold' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          headerShown: false,
          tabBarAccessibilityLabel: 'Accueil Citoyen',
          tabBarIcon: tabIcon('home-outline'),
          href: isWorker ? null : '/(tabs)',
        }}
      />
      <Tabs.Screen
        name="signaler"
        options={{
          title: 'Signaler',
          tabBarAccessibilityLabel: 'Signaler une anomalie',
          tabBarIcon: tabIcon('add-circle-outline'),
          href: isWorker ? null : '/(tabs)/signaler',
        }}
      />
      <Tabs.Screen
        name="mes-signalements"
        options={{
          title: 'Mes dossiers',
          tabBarAccessibilityLabel: 'Mes signalements',
          tabBarIcon: tabIcon('list-outline'),
          href: isWorker ? null : '/(tabs)/mes-signalements',
        }}
      />
      <Tabs.Screen
        name="roadmap"
        options={{
          title: 'Missions Terrain',
          tabBarAccessibilityLabel: 'Feuille de route ouvrier',
          tabBarIcon: tabIcon('navigate-outline'),
          href: isCitizen ? null : '/(tabs)/roadmap',
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Mon compte',
          tabBarAccessibilityLabel: 'Profil utilisateur',
          tabBarIcon: tabIcon('person-outline'),
        }}
      />
    </Tabs>
  );
}
