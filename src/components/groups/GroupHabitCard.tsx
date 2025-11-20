// components/groups/GroupHabitCard.tsx
// Card d'habitude avec i18n

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ImageBackground } from 'react-native';
import { Check, Flame } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { groupService } from '@/services/groupTypeService';
import { useAuth } from '@/context/AuthContext';
import type { GroupHabitWithCompletions, TimelineDay } from '@/types/group.types';
import { getAvatarDisplay } from '@/utils/groupUtils';
import { GroupHabitTimeline } from './GroupHabitTimeline';
import { getHabitTierTheme, getAchievementTierTheme } from '@/utils/tierTheme';
import { calculateGroupTierFromLevel } from '@utils/groups/groupConstants';
import tw from '@/lib/tailwind';

interface GroupHabitCardProps {
  habit: GroupHabitWithCompletions;
  groupId: string;
  groupLevel: number;
  members: Array<{
    user_id: string;
    username: string;
    avatar_emoji?: string;
    avatar_color?: string;
  }>;
  onRefresh: () => void;
  onDelete: () => void;
}

export function GroupHabitCard({ habit, groupId, groupLevel, members, onRefresh, onDelete }: GroupHabitCardProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [timeline, setTimeline] = useState<TimelineDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [userCompletedToday, setUserCompletedToday] = useState(false);
  const [completionsCount, setCompletionsCount] = useState(habit.completions_today || 0);
  const [userCompletedThisWeek, setUserCompletedThisWeek] = useState(false);
  const [weekCompletionsCount, setWeekCompletionsCount] = useState(0);

  const currentTierNumber = calculateGroupTierFromLevel(groupLevel);
  const tierTheme =
    currentTierNumber <= 3
      ? getHabitTierTheme(currentTierNumber === 1 ? 'Crystal' : currentTierNumber === 2 ? 'Ruby' : 'Amethyst')
      : getAchievementTierTheme(currentTierNumber === 4 ? 'legendaryAscent' : currentTierNumber === 5 ? 'epicMastery' : 'mythicGlory');

  const isObsidianTier = currentTierNumber === 6;
  const isJade = tierTheme.accent === '#059669';
  const isTopaz = tierTheme.accent === '#f59e0b';

  const textureOpacity = isObsidianTier ? 0.35 : 0.2;
  const baseOverlayOpacity = isObsidianTier ? 0.15 : 0.05;

  const loadTimeline = async () => {
    try {
      const data = await groupService.getHabitTimeline(habit.id, groupId, 7);
      setTimeline(data);

      if (habit.frequency === 'weekly') {
        // Pour weekly: utiliser last_weekly_completion_date pour vérifier si c'est dans la semaine courante
        const now = new Date();
        const dayOfWeek = now.getUTCDay();
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(now);
        monday.setUTCDate(now.getUTCDate() - daysFromMonday);
        monday.setUTCHours(0, 0, 0, 0);

        // Vérifier si l'utilisateur a complété cette semaine (depuis lundi)
        const hasCompletedThisWeek = data.some((day) => {
          const dayDate = new Date(day.date);
          return dayDate >= monday && day.completions.find((c) => c.user_id === user?.id)?.completed;
        });
        setUserCompletedThisWeek(hasCompletedThisWeek);

        // Compter combien de membres ont complété cette semaine
        const membersWhoCompleted = new Set<string>();
        data.forEach((day) => {
          const dayDate = new Date(day.date);
          if (dayDate >= monday) {
            day.completions.forEach((c) => {
              if (c.completed) {
                membersWhoCompleted.add(c.user_id);
              }
            });
          }
        });
        setWeekCompletionsCount(membersWhoCompleted.size);
      } else {
        // Pour daily: logique existante
        const today = data.find((day) => day.is_today);
        const isCompleted = today?.completions.find((c) => c.user_id === user?.id)?.completed || false;
        setUserCompletedToday(isCompleted);

        const realCount = today?.completions.filter((c) => c.completed).length || 0;
        setCompletionsCount(realCount);
      }
    } catch (error) {
      console.error('Error loading timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, [habit.id]);

  useEffect(() => {
    setCompletionsCount(habit.completions_today || 0);
  }, [habit.completions_today]);

  useEffect(() => {
    if (!loading && habit.completions_today !== undefined) {
      loadTimeline();
    }
  }, [habit.completions_today]);

  const today = timeline.find((day) => day.is_today);

  const handleToggleComplete = async () => {
    if (!user?.id || completing) return;

    // Pour weekly: si déjà complété cette semaine, ne rien faire
    if (habit.frequency === 'weekly' && userCompletedThisWeek) return;

    setCompleting(true);
    const wasCompleted = habit.frequency === 'weekly' ? userCompletedThisWeek : userCompletedToday;

    if (habit.frequency === 'weekly') {
      setUserCompletedThisWeek(!wasCompleted);
      setWeekCompletionsCount((prev) => (wasCompleted ? Math.max(0, prev - 1) : prev + 1));
    } else {
      setUserCompletedToday(!wasCompleted);
      setCompletionsCount((prev) => (wasCompleted ? Math.max(0, prev - 1) : prev + 1));
    }

    const optimisticTimeline = timeline.map((day) => {
      if (!day.is_today) return day;
      return {
        ...day,
        completions: day.completions.map((c) => (c.user_id === user.id ? { ...c, completed: !wasCompleted } : c)),
      };
    });
    setTimeline(optimisticTimeline);

    Haptics.impactAsync(wasCompleted ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (wasCompleted) {
        await groupService.uncompleteGroupHabit(user.id, habit.id);
      } else {
        await groupService.completeGroupHabit(user.id, {
          group_habit_id: habit.id,
        });
      }

      await loadTimeline();
      onRefresh();

      if (!wasCompleted) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error toggling completion:', error);

      if (habit.frequency === 'weekly') {
        setUserCompletedThisWeek(wasCompleted);
        setWeekCompletionsCount((prev) => (wasCompleted ? prev + 1 : Math.max(0, prev - 1)));
      } else {
        setUserCompletedToday(wasCompleted);
        setCompletionsCount((prev) => (wasCompleted ? prev + 1 : Math.max(0, prev - 1)));
      }
      await loadTimeline();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('groups.dashboard.error'), t('groups.card.errorToggle'));
    } finally {
      setCompleting(false);
    }
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(t('groups.card.deleteConfirm'), t('groups.card.deleteMessage', { name: habit.name }), [
      { text: t('groups.dashboard.cancel'), style: 'cancel' },
      {
        text: t('groups.dashboard.delete'),
        style: 'destructive',
        onPress: onDelete,
      },
    ]);
  };

  const totalMembers = members.length;
  const displayCompletionsCount = habit.frequency === 'weekly' ? weekCompletionsCount : completionsCount;
  const completionRate = totalMembers > 0 ? (displayCompletionsCount / totalMembers) * 100 : 0;
  const isUserCompleted = habit.frequency === 'weekly' ? userCompletedThisWeek : userCompletedToday;

  const getBonusBadge = () => {
    if (displayCompletionsCount === 0) return null;

    if (completionRate === 100) {
      return {
        text: t('groups.card.bonusXpMidnight', { xp: 50 }),
      };
    } else if (completionRate >= 50) {
      return {
        text: t('groups.card.bonusXpPossible', { xp: 35 }),
      };
    }

    return null;
  };

  const bonusBadge = getBonusBadge();

  return (
    <TouchableOpacity onLongPress={handleLongPress} activeOpacity={0.96} delayLongPress={500}>
      <LinearGradient
        colors={tierTheme.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          tw`rounded-[20px] overflow-hidden mb-3`,
          {
            borderWidth: isObsidianTier ? 2 : 1.5,
            borderColor: isObsidianTier ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255, 255, 255, 0.2)',
            shadowColor: isObsidianTier ? '#8b5cf6' : isJade ? '#059669' : isTopaz ? '#f59e0b' : '#000',
            shadowOffset: { width: 0, height: isObsidianTier ? 8 : 6 },
            shadowOpacity: isObsidianTier || isJade || isTopaz ? 0.4 : 0.2,
            shadowRadius: isObsidianTier ? 16 : 12,
          },
        ]}
      >
        <ImageBackground source={tierTheme.texture} resizeMode="cover" imageStyle={{ opacity: textureOpacity }}>
          {(isObsidianTier || isJade || isTopaz) && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: isObsidianTier ? 'rgba(139, 92, 246, 0.15)' : isJade ? 'rgba(5, 150, 105, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              }}
            />
          )}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: `rgba(0, 0, 0, ${baseOverlayOpacity})`,
            }}
          />

          <View style={tw`p-3`}>
            <View style={tw`flex-row items-center justify-between mb-2`}>
              <View style={tw`flex-1 flex-row items-center gap-2 pr-3`}>
                <Text
                  style={[
                    tw`font-bold flex-shrink`,
                    {
                      fontSize: 18,
                      color: '#FFFFFF',
                      textShadowColor: isObsidianTier ? 'rgba(139, 92, 246, 0.6)' : 'rgba(0, 0, 0, 0.4)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 3,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {habit.name}
                </Text>

                <View
                  style={[
                    tw`rounded-full px-2 py-0.5`,
                    {
                      backgroundColor: habit.frequency === 'weekly' ? 'rgba(59, 130, 246, 0.9)' : 'rgba(16, 185, 129, 0.9)',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                  ]}
                >
                  <Text style={tw`text-[11px] font-bold text-white`}>{habit.frequency === 'weekly' ? t('groups.card.weekly') : t('groups.card.daily')}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleToggleComplete}
                disabled={completing || (habit.frequency === 'weekly' && userCompletedThisWeek)}
                style={[
                  tw`w-8 h-8 rounded-full items-center justify-center`,
                  isUserCompleted
                    ? { backgroundColor: '#FFFFFF' }
                    : {
                        backgroundColor: 'rgba(255, 255, 255, 0.25)',
                        borderWidth: 2,
                        borderColor: 'rgba(255, 255, 255, 0.6)',
                      },
                  habit.frequency === 'weekly' && userCompletedThisWeek && { opacity: 0.6 },
                ]}
                activeOpacity={0.8}
              >
                {completing ? (
                  <ActivityIndicator size="small" color={isUserCompleted ? tierTheme.accent : '#FFFFFF'} />
                ) : isUserCompleted ? (
                  <Check size={24} color={tierTheme.accent} strokeWidth={3} />
                ) : null}
              </TouchableOpacity>
            </View>

            <View style={tw`mb-2 flex-row items-center gap-2`}>
              {bonusBadge && (
                <View
                  style={[
                    tw`rounded-full px-2.5 py-1`,
                    {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                  ]}
                >
                  <Text style={tw`text-xs font-semibold text-white`}>{bonusBadge.text}</Text>
                </View>
              )}

              <View
                style={[
                  tw`rounded-full px-2.5 py-1 flex-row items-center`,
                  {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                ]}
              >
                <Flame size={14} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={tw`text-xs font-semibold text-white ml-1`}>{habit.current_streak || 0}</Text>
              </View>
            </View>

            {today && today.completions.length > 0 && (
              <View style={tw`flex-row -space-x-1.5 gap-1 mb-2`}>
                {today.completions.map((completion, index) => {
                  const avatar = getAvatarDisplay({
                    id: completion.user_id,
                    username: completion.username,
                    email: null,
                    avatar_emoji: completion.avatar_emoji,
                    avatar_color: completion.avatar_color,
                    subscription_tier: 'free',
                  });

                  // Pour weekly: si un membre a complété cette semaine, on l'affiche comme complété
                  const isCompleted = habit.frequency === 'weekly' ? timeline.some((day) => day.completions.find((c) => c.user_id === completion.user_id && c.completed)) : completion.completed;
                  const bgColor = isCompleted ? tierTheme.accent : 'rgba(255, 255, 255, 0.3)';
                  const borderColor = isCompleted ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.4)';

                  return (
                    <View
                      key={completion.user_id}
                      style={[
                        tw`w-8 h-8 rounded-full items-center justify-center`,
                        {
                          backgroundColor: bgColor,
                          borderWidth: 1,
                          borderColor: borderColor,
                          zIndex: 10 - index,
                          shadowColor: isCompleted ? tierTheme.accent : 'transparent',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: isCompleted ? 0.4 : 0,
                          shadowRadius: isCompleted ? 4 : 0,
                        },
                      ]}
                    >
                      {avatar.type === 'emoji' ? (
                        <Text style={tw`text-[10px]`}>{avatar.value}</Text>
                      ) : (
                        <Text style={[tw`text-[10px] font-bold`, { color: isCompleted ? '#FFFFFF' : 'rgba(255, 255, 255, 0.9)' }]}>{avatar.value}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {loading ? (
              <View style={tw`py-2 items-center`}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            ) : (
              timeline.length > 0 && (
                <GroupHabitTimeline timeline={timeline} accentColor={tierTheme.accent} lastWeeklyCompletionDate={habit.last_weekly_completion_date} frequency={habit.frequency} habitId={habit.id} />
              )
            )}
          </View>
        </ImageBackground>
      </LinearGradient>
    </TouchableOpacity>
  );
}
