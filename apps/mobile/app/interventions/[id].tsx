import React from 'react';
import { Stack } from 'expo-router';
import InterventionDetailScreen from '../../src/screens/Worker/InterventionDetailScreen';

export default function InterventionRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'Intervention' }} />
      <InterventionDetailScreen />
    </>
  );
}
