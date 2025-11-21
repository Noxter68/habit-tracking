// components/groups/GroupHabitTimeline.tsx
// Timeline avec pouces pour weekly - basé sur la complétion de l'utilisateur connecté

import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Check, ThumbsUp, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';
import type { TimelineDay } from '@/types/group.types';
import tw from '@/lib/tailwind';

interface GroupHabitTimelineProps {
  timeline: TimelineDay[];
  accentColor?: string;
  frequency: 'daily' | 'weekly';
  habitId: string;
  lastWeeklyCompletionDate?: string | null;
}

export function GroupHabitTimeline({ timeline, accentColor = '#10b981', frequency, habitId }: GroupHabitTimelineProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const todayData = timeline.find((day) => day.is_today);

  const [userCompletedThisWeek, setUserCompletedThisWeek] = useState(false);

  // Charger l'état depuis AsyncStorage
  useEffect(() => {
    loadWeeklyState();
  }, [habitId, user?.id]);

  // Vérifier si l'utilisateur connecté a complété cette semaine
  useEffect(() => {
    if (frequency !== 'weekly' || !user?.id) {
      setUserCompletedThisWeek(false);
      return;
    }

    const hasUserCompleted = timeline.some((day) => {
      const userCompletion = day.completions.find((c) => c.user_id === user.id);
      return userCompletion?.completed === true;
    });

    if (hasUserCompleted !== userCompletedThisWeek) {
      setUserCompletedThisWeek(hasUserCompleted);
      saveWeeklyState(hasUserCompleted);
    }
  }, [timeline, frequency, user?.id]);

  const loadWeeklyState = async () => {
    if (!user?.id || frequency !== 'weekly') return;

    try {
      const key = `weekly_completed_${habitId}_${user.id}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored !== null) {
        setUserCompletedThisWeek(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading weekly state:', error);
    }
  };

  const saveWeeklyState = async (completed: boolean) => {
    if (!user?.id || frequency !== 'weekly') return;

    try {
      const key = `weekly_completed_${habitId}_${user.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(completed));
    } catch (error) {
      console.error('Error saving weekly state:', error);
    }
  };

  const getCompletionStatus = (day: TimelineDay): 'all' | 'partial' | 'none' | 'user_done' => {
    const completedCount = day.completions.filter((c) => c.completed).length;

    // Si weekly et que l'utilisateur a complété cette semaine
    if (frequency === 'weekly' && userCompletedThisWeek && user?.id) {
      const userCompletion = day.completions.find((c) => c.user_id === user.id);

      // Si ce n'est pas le jour où l'utilisateur a complété, montrer le pouce
      if (!userCompletion?.completed && completedCount === 0) {
        return 'user_done';
      }
    }

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
    const isSunday = new Date(day.date).getUTCDay() === 0;

    // CAS SPÉCIAL DIMANCHE : TOUJOURS étoile dorée vibrante (jour du bonus hebdo)
    if (isSunday) {
      // Si complété à 100%
      if (status === 'all') {
        return (
          <LinearGradient
            colors={['#fbbf24', '#f59e0b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              tw`w-8 h-8 rounded-full items-center justify-center`,
              {
                shadowColor: '#fbbf24',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.6,
                shadowRadius: 10,
                elevation: 8,
              },
            ]}
          >
            <Check size={16} color="#FFFFFF" strokeWidth={3} />
            <View style={tw`absolute items-center justify-center`}>
              <Star size={16} color="#fef08a" fill="#fef08a" strokeWidth={0} />
            </View>
          </LinearGradient>
        );
      }

      // Si partiellement complété
      if (status === 'partial') {
        return (
          <LinearGradient
            colors={['#fbbf24', '#f59e0b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              tw`w-8 h-8 rounded-full items-center justify-center`,
              {
                shadowColor: '#fbbf24',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
                elevation: 6,
              },
            ]}
          >
            <Star size={18} color="#fef08a" fill="#fef08a" strokeWidth={0} />
          </LinearGradient>
        );
      }

      // Si user_done (weekly complété) ou none - étoile dorée vibrante
      return (
        <LinearGradient
          colors={['#fcd34d', '#fbbf24']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            tw`w-8 h-8 rounded-full items-center justify-center`,
            {
              shadowColor: '#fbbf24',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.4,
              shadowRadius: 6,
              elevation: 4,
            },
            isToday && {
              shadowColor: '#fbbf24',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.6,
              shadowRadius: 10,
              elevation: 8,
            },
          ]}
        >
          <Star size={18} color="#fefce8" fill="#fefce8" strokeWidth={0} />
        </LinearGradient>
      );
    }

    // Pouce blanc sur fond bleu pour weekly quand l'utilisateur a déjà complété (sauf dimanche)
    if (status === 'user_done') {
      return (
        <View
          style={[
            tw`w-8 h-8 rounded-full items-center justify-center`,
            {
              backgroundColor: '#3b82f6',
              shadowColor: '#3b82f6',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 3,
            },
          ]}
        >
          <ThumbsUp size={12} color="#FFFFFF" strokeWidth={2.5} fill="#FFFFFF" />
        </View>
      );
    }

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

  // Pour weekly: compter les membres qui ont complété cette semaine
  const completedThisWeek = frequency === 'weekly'
    ? (() => {
        const membersCompleted = new Set();
        timeline.forEach((day) => {
          day.completions.forEach((c) => {
            if (c.completed) {
              membersCompleted.add(c.user_id);
            }
          });
        });
        return membersCompleted.size;
      })()
    : 0;

  const completedToday = todayData ? todayData.completions.filter((c) => c.completed).length : 0;
  const totalToday = todayData?.completions.length || 0;

  const displayCompleted = frequency === 'weekly' ? completedThisWeek : completedToday;
  const displayTotal = totalToday;

  return (
    <View style={tw`bg-stone-50/60 rounded-2xl p-3 mt-2`}>

      {todayData && (
        <View style={tw`flex-row items-center justify-center gap-1.5 mb-2.5`}>
          <View style={[tw`rounded-full px-2 py-0.5`, { backgroundColor: accentColor + '15' }]}>
            <Text style={[tw`text-[9px] font-bold`, { color: accentColor }]}>
              {frequency === 'weekly' ? t('groups.timeline.thisWeek') : t('groups.timeline.today')}
            </Text>
          </View>

          <View style={tw`flex-row items-center gap-1`}>
            <View style={[tw`w-1.5 h-1.5 rounded-full`, { backgroundColor: accentColor }]} />
            <Text style={tw`text-[10px] font-semibold text-stone-700`}>
              {t('groups.timeline.completions', { completed: displayCompleted, total: displayTotal })}
            </Text>
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
