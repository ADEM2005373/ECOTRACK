import React from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';

interface EcoTrackLogoProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export function EcoTrackLogo({ size = 48, style }: EcoTrackLogoProps) {
  return (
    <Image
      source={require('../../assets/icon.png')}
      style={[{ width: size, height: size, borderRadius: Math.round(size * 0.22) }, style]}
      resizeMode="contain"
      accessibilityLabel="Logo EcoTrack Tunisie"
    />
  );
}
