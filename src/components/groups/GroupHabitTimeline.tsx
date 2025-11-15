// components/groups/GroupHabitTimeline.tsx
// Timeline stylée pour les habitudes de groupe (style Duolingo)

import React from 'react';
import { View, Text } from 'react-native';
import type { TimelineDay } from '@/types/group.types';
import { NoneIcon, PartialIcon, CompleteIcon, TodayIcon, TodayCompleteIcon } from './icons/CompletionIcons';
import { TodayCompletionBadge } from './TodayCompletionBadge';
import tw from '@/lib/tailwind';

interface GroupHabitTimelineProps {
  timeline: TimelineDay[];
}

export function GroupHabitTimeline({ timeline }: GroupHabitTimelineProps) {
  const todayData = timeline.find((day) => day.is_today);

  const getCompletionStatus = (day: TimelineDay): 'all' | 'partial' | 'none' => {
    const completedCount = day.completions.filter((c) => c.completed).length;
    if (completedCount === 0) return 'none';
    if (completedCount === day.completions.length) return 'all';
    return 'partial';
  };

  const renderIcon = (day: TimelineDay) => {
    const status = getCompletionStatus(day);

    // Aujourd'hui avec état
    if (day.is_today) {
      return status === 'all' ? <TodayCompleteIcon size={36} /> : <TodayIcon size={36} />;
    }

    // Autres jours
    if (status === 'all') return <CompleteIcon size={36} />;
    if (status === 'partial') return <PartialIcon size={36} />;
    return <NoneIcon size={36} />;
  };

  return (
    <View style={tw`bg-stone-50 rounded-xl p-3`}>
      {/* Badge de complétion du jour */}
      {todayData && (
        <View style={tw`items-center mb-3`}>
          <TodayCompletionBadge todayData={todayData} />
        </View>
      )}

      {/* Jours de la semaine */}
      <View style={tw`flex-row justify-between mb-2`}>
        {timeline.map((day) => (
          <View key={day.date} style={tw`items-center w-9`}>
            <Text style={[tw`text-[10px] font-bold`, day.is_today ? tw`text-amber-500` : tw`text-stone-400`]}>{day.day_name}</Text>
          </View>
        ))}
      </View>

      {/* Cercles de complétion avec SVG */}
      <View style={tw`flex-row justify-between items-center mb-2`}>
        {timeline.map((day) => {
          const status = getCompletionStatus(day);

          return (
            <View key={day.date} style={tw`items-center relative`}>
              {/* Icon SVG */}
              <View style={[tw`items-center justify-center`, day.is_today && tw`transform scale-105`]}>{renderIcon(day)}</View>

              {/* Glow pour aujourd'hui */}
              {day.is_today && (
                <View
                  style={[
                    tw`absolute w-9 h-9 rounded-full -z-10`,
                    {
                      backgroundColor: status === 'all' ? '#22C55E' : '#F59E0B',
                      opacity: 0.25,
                      transform: [{ scale: 1.3 }],
                    },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>

      {/* Légende compacte avec SVG */}
      <View style={tw`flex-row justify-center gap-3 pt-2 border-t border-stone-200`}>
        <View style={tw`flex-row items-center gap-1`}>
          <CompleteIcon size={16} />
          <Text style={tw`text-[10px] text-stone-600`}>Tous</Text>
        </View>

        <View style={tw`flex-row items-center gap-1`}>
          <PartialIcon size={16} />
          <Text style={tw`text-[10px] text-stone-600`}>Partiel</Text>
        </View>

        <View style={tw`flex-row items-center gap-1`}>
          <NoneIcon size={16} />
          <Text style={tw`text-[10px] text-stone-600`}>Aucun</Text>
        </View>
      </View>
    </View>
  );
}
