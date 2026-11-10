import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, textStyles, touchTarget } from '../../src/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const tabIcon =
  (name: IconName) =>
  ({ color, size }: { color: string; size: number }) => <Ionicons name={name} size={size} color={color} />;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabBar.active,
        tabBarInactiveTintColor: colors.tabBar.inactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar.background,
          borderTopColor: colors.tabBar.border,
        },
        tabBarItemStyle: { minHeight: touchTarget.min, minWidth: touchTarget.min },
        tabBarLabelStyle: { fontFamily: textStyles.label.fontFamily, fontSize: textStyles.label.fontSize },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.secondary,
        headerTitleStyle: { fontFamily: textStyles.subtitle.fontFamily },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          headerShown: false, // L'écran d'accueil a son propre en-tête
          tabBarAccessibilityLabel: 'Accueil',
          tabBarIcon: tabIcon('home-outline'),
        }}
      />
      <Tabs.Screen
        name="signaler"
        options={{
          title: 'Signaler',
          tabBarAccessibilityLabel: 'Signaler une anomalie',
          tabBarIcon: tabIcon('add-circle-outline'),
        }}
      />
      <Tabs.Screen
        name="mes-signalements"
        options={{
          title: 'Mes signalements',
          tabBarAccessibilityLabel: 'Mes signalements',
          tabBarIcon: tabIcon('list-outline'),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarAccessibilityLabel: 'Profil',
          tabBarIcon: tabIcon('person-outline'),
        }}
      />
    </Tabs>
  );
}
