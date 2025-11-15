// components/groups/TodayCompletionBadge.tsx
// Badge de complétion du jour avec avatars dynamiques

import React from 'react';
import { View } from 'react-native';
import { Check } from 'lucide-react-native';
import type { TimelineDay } from '@/types/group.types';
import tw from '@/lib/tailwind';

interface TodayCompletionBadgeProps {
  todayData: TimelineDay;
}

export function TodayCompletionBadge({ todayData }: TodayCompletionBadgeProps) {
  const completedCount = todayData.completions.filter((c) => c.completed).length;
  const totalCount = todayData.completions.length;

  // Déterminer l'état global
  const isAllComplete = completedCount === totalCount;
  const isPartialComplete = completedCount > 0 && completedCount < totalCount;
  const isNoneComplete = completedCount === 0;

  // Couleurs selon l'état
  let bgColor = '#FFFFFF';
  let borderColor = '#D1D5DB';

  if (isAllComplete) {
    bgColor = '#22C55E';
    borderColor = '#22C55E';
  } else if (isPartialComplete) {
    bgColor = '#3B82F6';
    borderColor = '#3B82F6';
  }

  // Taille du badge selon le nombre de membres (min 2, max 5)
  const badgeSize = Math.min(Math.max(totalCount, 2), 5);
  const iconSize = badgeSize <= 2 ? 10 : badgeSize === 3 ? 9 : 8;
  const circleSize = badgeSize <= 2 ? 16 : badgeSize === 3 ? 14 : 12;
  const gapClass = badgeSize <= 2 ? 'gap-1' : badgeSize === 3 ? 'gap-0.5' : 'gap-0.5';

  return (
    <View style={[tw`rounded-full px-2.5 py-1.5 border-2 flex-row items-center justify-center ${gapClass}`, { backgroundColor: bgColor, borderColor: borderColor }]}>
      {todayData.completions.map((completion, index) => {
        if (isAllComplete) {
          // Tous complétés = checks verts sur fond vert
          return (
            <View key={completion.user_id} style={[tw`rounded-full items-center justify-center bg-emerald-600`, { width: circleSize, height: circleSize }]}>
              <Check size={iconSize} color="#FFFFFF" strokeWidth={3} />
            </View>
          );
        } else if (isPartialComplete) {
          // Partiel = check blanc ou rond blanc selon complétion
          if (completion.completed) {
            return (
              <View key={completion.user_id} style={[tw`rounded-full items-center justify-center bg-blue-600`, { width: circleSize, height: circleSize }]}>
                <Check size={iconSize} color="#FFFFFF" strokeWidth={3} />
              </View>
            );
          } else {
            return <View key={completion.user_id} style={[tw`rounded-full border-2 border-white`, { width: circleSize, height: circleSize }]} />;
          }
        } else {
          // Aucun = ronds vides gris
          return <View key={completion.user_id} style={[tw`rounded-full border-2 border-stone-400`, { width: circleSize, height: circleSize }]} />;
        }
      })}
    </View>
  );
}
