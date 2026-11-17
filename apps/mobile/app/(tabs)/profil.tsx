import React from 'react';
import { useRouter } from 'expo-router';
import { PlaceholderScreen } from '../../src/components/PlaceholderScreen';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { profileStrings } from '../../src/constants/strings';

export default function ProfilScreen() {
  const router = useRouter();

  return (
    <PlaceholderScreen title={profileStrings.title} description={profileStrings.description}>
      <PrimaryButton label={profileStrings.createAccount} onPress={() => router.push('/register')} />
    </PlaceholderScreen>
  );
}
