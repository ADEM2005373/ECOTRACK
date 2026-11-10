// PLACEHOLDER : cible de redirection après inscription (ECO-13).
// L'écran de connexion réel sera livré par le ticket Login dédié.
import React from 'react';
import { PlaceholderScreen } from '../src/components/PlaceholderScreen';
import { loginStrings } from '../src/constants/strings';

export default function LoginScreen() {
  return <PlaceholderScreen title={loginStrings.screenTitle} description={loginStrings.placeholder} />;
}
