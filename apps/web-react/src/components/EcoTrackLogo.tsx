import React from 'react';

interface EcoTrackLogoProps {
  size?: number;
  className?: string;
}

export const EcoTrackLogo: React.FC<EcoTrackLogoProps> = ({ size = 40, className = '' }) => (
  <img
    src="/logo.svg"
    alt="EcoTrack Tunisie"
    width={size}
    height={size}
    className={`shrink-0 object-contain select-none ${className}`}
    style={{ width: size, height: size }}
  />
);

export default EcoTrackLogo;
