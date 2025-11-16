// components/groups/GroupHabitTimeline.tsx
// Timeline avec i18n

import React from 'react';
import { View, Text } from 'react-native';
import { Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import type { TimelineDay } from '@/types/group.types';
import tw from '@/lib/tailwind';

interface GroupHabitTimelineProps {
  timeline: TimelineDay[];
  accentColor?: string;
}

export function GroupHabitTimeline({ timeline, accentColor = '#10b981' }: GroupHabitTimelineProps) {
  const { t } = useTranslation();
  const todayData = timeline.find((day) => day.is_today);

  const getCompletionStatus = (day: TimelineDay): 'all' | 'partial' | 'none' => {
    const completedCount = day.completions.filter((c) => c.completed).length;
    if (completedCount === 0) return 'none';
    if (completedCount === day.completions.length) return 'all';
    return 'partial';
  };

  const getLighterGradient = (baseColor: string): string[] => {
    return [baseColor + '60', baseColor + '30'];
  };

  const renderCircle = (day: TimelineDay) => {
    const status = getCompletionStatus(day);
    const isToday = day.is_today;

    if (status === 'none') {
      return (
        <View
          style={[
            tw`w-8 h-8 rounded-full items-center justify-center`,
            {
              backgroundColor: '#FFFFFF',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 2,
            },
            isToday && {
              shadowColor: accentColor,
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 4,
            },
          ]}
        />
      );
    }

    if (status === 'partial') {
      const gradientColors = getLighterGradient(accentColor);
      return (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            tw`w-8 h-8 rounded-full items-center justify-center`,
            {
              shadowColor: accentColor,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 3,
            },
            isToday && {
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.4,
              shadowRadius: 6,
              elevation: 5,
            },
          ]}
        />
      );
    }

    const fullGradient = [accentColor, accentColor + 'DD'];
    return (
      <LinearGradient
        colors={fullGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          tw`w-8 h-8 rounded-full items-center justify-center`,
          {
            shadowColor: accentColor,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.4,
            shadowRadius: 6,
            elevation: 4,
          },
          isToday && {
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.5,
            shadowRadius: 8,
            elevation: 6,
          },
        ]}
      >
        <Check size={16} color="#FFFFFF" strokeWidth={3} />
      </LinearGradient>
    );
  };

  const completedToday = todayData ? todayData.completions.filter((c) => c.completed).length : 0;
  const totalToday = todayData?.completions.length || 0;

  return (
    <View style={tw`bg-stone-50/60 rounded-2xl p-3 mt-2`}>
      {todayData && (
        <View style={tw`flex-row items-center justify-center gap-1.5 mb-2.5`}>
          <View style={[tw`rounded-full px-2 py-0.5`, { backgroundColor: accentColor + '15' }]}>
            <Text style={[tw`text-[9px] font-bold`, { color: accentColor }]}>{t('groups.timeline.today')}</Text>
          </View>

          <View style={tw`flex-row items-center gap-1`}>
            <View style={[tw`w-1.5 h-1.5 rounded-full`, { backgroundColor: accentColor }]} />
            <Text style={tw`text-[10px] font-semibold text-stone-700`}>{t('groups.timeline.completions', { completed: completedToday, total: totalToday })}</Text>
          </View>
        </View>
      )}

      <View>
        <View style={tw`flex-row justify-between mb-1.5`}>
          {timeline.map((day) => (
            <View key={day.date} style={tw`items-center w-8`}>
              <Text style={[tw`text-[9px] font-bold`, day.is_today ? { color: accentColor } : tw`text-stone-400`]}>{day.day_name}</Text>
            </View>
          ))}
        </View>

        <View style={tw`flex-row justify-between items-center`}>
          {timeline.map((day) => {
            return (
              <View key={day.date} style={tw`items-center relative`}>
                <View style={[tw`items-center justify-center`, day.is_today && tw`transform scale-110`]}>{renderCircle(day)}</View>

                {day.is_today && (
                  <View
                    style={[
                      tw`absolute w-10 h-10 rounded-full -z-10`,
                      {
                        backgroundColor: accentColor,
                        opacity: 0.12,
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
