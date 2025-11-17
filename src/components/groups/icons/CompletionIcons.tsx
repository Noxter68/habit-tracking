// components/groups/CompletionIcons.tsx
// SVG icons pour les états de complétion (style Duolingo)

import React from 'react';
import Svg, { Circle, Path, G } from 'react-native-svg';

interface CompletionIconProps {
  size?: number;
}

// État : Aucun (gris clair avec bordure grise)
export function NoneIcon({ size = 36 }: CompletionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36">
      {/* Fond blanc */}
      <Circle cx="18" cy="18" r="16" fill="#FFFFFF" />
      {/* Bordure grise */}
      <Circle cx="18" cy="18" r="16" fill="none" stroke="#D1D5DB" strokeWidth="2.5" />
      {/* Petit rond noir */}
      <Circle cx="18" cy="18" r="5" fill="#374151" />
    </Svg>
  );
}

// État : Partiel (bleu avec un check blanc)
export function PartialIcon({ size = 36 }: CompletionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36">
      {/* Fond bleu */}
      <Circle cx="18" cy="18" r="16" fill="#3B82F6" />
      {/* Check blanc */}
      <Path d="M12 18L16 22L24 14" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// État : Complet (vert avec deux checks blancs)
export function CompleteIcon({ size = 36 }: CompletionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36">
      {/* Fond vert */}
      <Circle cx="18" cy="18" r="16" fill="#22C55E" />
      {/* Premier check (gauche) */}
      <Path d="M9 18L13 22L19 16" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Deuxième check (droite) */}
      <Path d="M17 18L21 22L27 16" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// État : Aujourd'hui (orange/ambre avec étoile arrondie)
export function TodayIcon({ size = 36 }: CompletionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36">
      {/* Fond orange/ambre */}
      <Circle cx="18" cy="18" r="16" fill="#F59E0B" />
      {/* Étoile arrondie */}
      <Path
        d="M18 11c.3 0 .5.2.6.5l1.8 3.6 4 .6c.3 0 .5.3.5.6 0 .2-.1.3-.2.5l-2.9 2.8.7 4c0 .3-.1.6-.4.7-.3.1-.6 0-.8-.2L18 22.4l-3.6 1.9c-.3.1-.6.1-.8-.1-.2-.2-.3-.4-.3-.7l.7-4-2.9-2.8c-.2-.2-.3-.5-.2-.8.1-.3.3-.5.6-.5l4-.6 1.8-3.6c.1-.3.4-.5.7-.5z"
        fill="#1F2937"
      />
    </Svg>
  );
}

// État : Aujourd'hui complété (vert avec étoile blanche arrondie)
export function TodayCompleteIcon({ size = 36 }: CompletionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36">
      {/* Fond vert */}
      <Circle cx="18" cy="18" r="16" fill="#22C55E" />
      {/* Étoile arrondie blanche */}
      <Path
        d="M18 11c.3 0 .5.2.6.5l1.8 3.6 4 .6c.3 0 .5.3.5.6 0 .2-.1.3-.2.5l-2.9 2.8.7 4c0 .3-.1.6-.4.7-.3.1-.6 0-.8-.2L18 22.4l-3.6 1.9c-.3.1-.6.1-.8-.1-.2-.2-.3-.4-.3-.7l.7-4-2.9-2.8c-.2-.2-.3-.5-.2-.8.1-.3.3-.5.6-.5l4-.6 1.8-3.6c.1-.3.4-.5.7-.5z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}
