// components/groups/GroupHabitTimeline.tsx
// Timeline stylée compacte pour les habitudes de groupe

import React from 'react';
import { View, Text } from 'react-native';
import { Check } from 'lucide-react-native';
import type { TimelineDay } from '@/types/group.types';
import tw from '@/lib/tailwind';

interface GroupHabitTimelineProps {
  timeline: TimelineDay[];
  accentColor?: string;
}

export function GroupHabitTimeline({ timeline, accentColor = '#10b981' }: GroupHabitTimelineProps) {
  const todayData = timeline.find((day) => day.is_today);

  const getCompletionStatus = (day: TimelineDay): 'all' | 'partial' | 'none' => {
    const completedCount = day.completions.filter((c) => c.completed).length;
    if (completedCount === 0) return 'none';
    if (completedCount === day.completions.length) return 'all';
    return 'partial';
  };

  const renderCircle = (day: TimelineDay) => {
    const status = getCompletionStatus(day);
    const isToday = day.is_today;

    // Aucun: cercle vide (blanc avec border)
    if (status === 'none') {
      return (
        <View
          style={[
            tw`w-8 h-8 rounded-full items-center justify-center border-2`,
            {
              backgroundColor: '#FFFFFF',
              borderColor: isToday ? accentColor : '#d6d3d1',
            },
          ]}
        />
      );
    }

    // Partiel: cercle avec couleur accent (pas de check)
    if (status === 'partial') {
      return (
        <View
          style={[
            tw`w-8 h-8 rounded-full items-center justify-center`,
            {
              backgroundColor: accentColor + '40', // 25% opacity
              borderWidth: isToday ? 2 : 0,
              borderColor: accentColor,
            },
          ]}
        />
      );
    }

    // Tous complété: cercle plein avec check blanc
    return (
      <View
        style={[
          tw`w-8 h-8 rounded-full items-center justify-center`,
          {
            backgroundColor: accentColor,
            borderWidth: isToday ? 2 : 0,
            borderColor: accentColor,
            shadowColor: accentColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 3,
          },
        ]}
      >
        <Check size={16} color="#FFFFFF" strokeWidth={3} />
      </View>
    );
  };

  const completedToday = todayData ? todayData.completions.filter((c) => c.completed).length : 0;
  const totalToday = todayData?.completions.length || 0;

  return (
    <View style={tw`bg-stone-50/60 rounded-2xl p-3 mt-2`}>
      {/* Stats du jour - Ultra compact */}
      {todayData && (
        <View style={tw`flex-row items-center justify-center gap-1.5 mb-2.5`}>
          <View style={[tw`rounded-full px-2 py-0.5`, { backgroundColor: accentColor + '15' }]}>
            <Text style={[tw`text-[9px] font-bold`, { color: accentColor }]}>AUJOURD'HUI</Text>
          </View>

          <View style={tw`flex-row items-center gap-1`}>
            <View style={[tw`w-1.5 h-1.5 rounded-full`, { backgroundColor: accentColor }]} />
            <Text style={tw`text-[10px] font-semibold text-stone-700`}>
              {completedToday}/{totalToday}
            </Text>
          </View>
        </View>
      )}

      {/* Timeline principale - Plus compacte */}
      <View>
        {/* Jours de la semaine */}
        <View style={tw`flex-row justify-between mb-1.5`}>
          {timeline.map((day) => (
            <View key={day.date} style={tw`items-center w-8`}>
              <Text style={[tw`text-[9px] font-bold`, day.is_today ? { color: accentColor } : tw`text-stone-400`]}>{day.day_name}</Text>
            </View>
          ))}
        </View>

        {/* Cercles de complétion */}
        <View style={tw`flex-row justify-between items-center`}>
          {timeline.map((day) => {
            return (
              <View key={day.date} style={tw`items-center relative`}>
                {/* Circle */}
                <View style={[tw`items-center justify-center`, day.is_today && tw`transform scale-110`]}>{renderCircle(day)}</View>

                {/* Subtle glow pour aujourd'hui */}
                {day.is_today && (
                  <View
                    style={[
                      tw`absolute w-8 h-8 rounded-full -z-10`,
                      {
                        backgroundColor: accentColor,
                        opacity: 0.15,
                        transform: [{ scale: 1.3 }],
                      },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
