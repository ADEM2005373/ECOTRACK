import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#080D1A' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontFamily: 'PlusJakartaSans-Bold',
              fontWeight: 'bold',
            },
            contentStyle: { backgroundColor: '#080D1A' },
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              title: 'EcoTrack Mobile',
              headerShown: false,
            }}
          />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
