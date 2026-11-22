import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors, textStyles } from '../src/theme';
import { loginStrings, registerStrings } from '../src/constants/strings';
import { fontAssets } from '../src/theme/fonts';
import { useAuthStore } from '../src/store/authStore';

// Garde le splash visible tant que les polices CDCF ne sont pas chargées.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loadSession = useAuthStore((state) => state.loadSession);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    const inAuthRoute = ['login', 'register'].includes(segments[0] ?? '');
    if (!isAuthenticated && !inAuthRoute) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthRoute) {
      const role = useAuthStore.getState().user?.role;
      if (role === 'CHEF_OUVRIER' || role === 'OUVRIER') {
        router.replace('/(tabs)/roadmap');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, segments]);

  useEffect(() => {
    if (fontError) {
      console.warn('[fonts] Échec du chargement des polices, polices système utilisées.', fontError);
    }
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: colors.background },
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.secondary,
            headerTitleStyle: { fontFamily: textStyles.subtitle.fontFamily },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ title: registerStrings.screenTitle }} />
          <Stack.Screen name="login" options={{ title: loginStrings.screenTitle }} />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
