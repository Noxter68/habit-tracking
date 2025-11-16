// components/groups/GroupHabitCard.tsx
// Card d'habitude de groupe - Design ultra simple et épuré

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ImageBackground } from 'react-native';
import { Check, Flame } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { groupService } from '@/services/groupTypeService';
import { useAuth } from '@/context/AuthContext';
import type { GroupHabitWithCompletions, TimelineDay } from '@/types/group.types';
import { getAvatarDisplay } from '@/utils/groupUtils';
import { GroupHabitTimeline } from './GroupHabitTimeline';
import { getHabitTierTheme } from '@/utils/tierTheme';
import { HabitProgressionService } from '@/services/habitProgressionService';
import tw from '@/lib/tailwind';

interface GroupHabitCardProps {
  habit: GroupHabitWithCompletions;
  groupId: string;
  members: Array<{ user_id: string; user_name: string }>;
  onRefresh: () => void;
  onDelete: () => void;
}

export function GroupHabitCard({ habit, groupId, members, onRefresh, onDelete }: GroupHabitCardProps) {
  const { user } = useAuth();
  const [timeline, setTimeline] = useState<TimelineDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [userCompletedToday, setUserCompletedToday] = useState(false);
  const [completionsCount, setCompletionsCount] = useState(habit.completions_today || 0);

  // Calculate tier based on habit streak
  const currentStreak = habit.current_streak || 0;
  const { tier: tierInfo } = HabitProgressionService.calculateTierFromStreak(currentStreak);
  const tierTheme = getHabitTierTheme(tierInfo.name);
  const isObsidian = tierTheme.accent === '#8b5cf6';

  const loadTimeline = async () => {
    try {
      const data = await groupService.getHabitTimeline(habit.id, groupId, 7);
      setTimeline(data);

      const today = data.find((day) => day.is_today);
      const isCompleted = today?.completions.find((c) => c.user_id === user?.id)?.completed || false;
      setUserCompletedToday(isCompleted);

      const realCount = today?.completions.filter((c) => c.completed).length || 0;
      setCompletionsCount(realCount);
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

    setCompleting(true);
    const wasCompleted = userCompletedToday;

    setUserCompletedToday(!wasCompleted);
    setCompletionsCount((prev) => (wasCompleted ? Math.max(0, prev - 1) : prev + 1));

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

      setUserCompletedToday(wasCompleted);
      setCompletionsCount((prev) => (wasCompleted ? prev + 1 : Math.max(0, prev - 1)));
      await loadTimeline();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', 'Impossible de modifier la complétion');
    } finally {
      setCompleting(false);
    }
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert("Supprimer l'habitude", `Voulez-vous supprimer "${habit.name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: onDelete,
      },
    ]);
  };

  return (
    <TouchableOpacity onLongPress={handleLongPress} activeOpacity={0.96} delayLongPress={500}>
      {/* Container with gradient border */}
      <LinearGradient
        colors={tierTheme.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          tw`rounded-[20px] overflow-hidden mb-3`,
          {
            borderWidth: isObsidian ? 2 : 1.5,
            borderColor: isObsidian ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255, 255, 255, 0.2)',
            shadowColor: isObsidian ? '#8b5cf6' : '#000',
            shadowOffset: { width: 0, height: isObsidian ? 8 : 6 },
            shadowOpacity: isObsidian ? 0.4 : 0.2,
            shadowRadius: isObsidian ? 16 : 12,
          },
        ]}
      >
        <ImageBackground source={tierTheme.texture} resizeMode="cover" imageStyle={{ opacity: 0.2 }}>
          {/* Overlay layers */}
          {isObsidian && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(139, 92, 246, 0.08)',
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
              backgroundColor: isObsidian ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.05)',
            }}
          />

          {/* Content */}
          <View style={tw`p-3`}>
            {/* Header: Title + Avatars + Check - ultra compact */}
            <View style={tw`flex-row items-center justify-between mb-1`}>
              {/* Left: Title + Avatars */}
              <View style={tw`flex-1 flex-row items-center gap-2 pr-3`}>
                <Text
                  style={[
                    tw`font-bold flex-shrink`,
                    {
                      fontSize: 18,
                      color: '#FFFFFF',
                      textShadowColor: isObsidian ? 'rgba(139, 92, 246, 0.6)' : 'rgba(0, 0, 0, 0.4)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 3,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {habit.name}
                </Text>
                <View style={tw`flex-row items-center gap-2`}>
                  <Flame size={16} color="#F59E0B" />
                  <Text style={tw`text-sm font-semibold text-gray-700`}>{habit.current_streak} jours</Text>
                </View>

                {/* Mini avatars inline */}
                {today && today.completions.length > 0 && (
                  <View style={tw`flex-row -space-x-1.5 gap-1`}>
                    {today.completions.map((completion, index) => {
                      const avatar = getAvatarDisplay({
                        id: completion.user_id,
                        username: completion.username,
                        email: null,
                        avatar_emoji: completion.avatar_emoji,
                        avatar_color: completion.avatar_color,
                        subscription_tier: 'free',
                      });

                      const isCompleted = completion.completed;
                      const bgColor = isCompleted ? tierTheme.accent : 'rgba(255, 255, 255, 0.3)';
                      const borderColor = isCompleted ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.4)';
                      const hasGlow = isCompleted;

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
                              shadowColor: hasGlow ? tierTheme.accent : 'transparent',
                              shadowOffset: { width: 0, height: 0 },
                              shadowOpacity: hasGlow ? 0.4 : 0,
                              shadowRadius: hasGlow ? 4 : 0,
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
              </View>

              {/* Right: Round check button */}
              <TouchableOpacity
                onPress={handleToggleComplete}
                disabled={completing}
                style={[
                  tw`w-8 h-8 rounded-full items-center justify-center`,
                  userCompletedToday
                    ? { backgroundColor: '#FFFFFF' }
                    : {
                        backgroundColor: 'rgba(255, 255, 255, 0.25)',
                        borderWidth: 2,
                        borderColor: 'rgba(255, 255, 255, 0.6)',
                      },
                ]}
                activeOpacity={0.8}
              >
                {completing ? (
                  <ActivityIndicator size="small" color={userCompletedToday ? tierTheme.accent : '#FFFFFF'} />
                ) : userCompletedToday ? (
                  <Check size={24} color={tierTheme.accent} strokeWidth={3} />
                ) : null}
              </TouchableOpacity>
            </View>

            {/* Timeline */}
            {loading ? (
              <View style={tw`py-2 items-center`}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            ) : (
              timeline.length > 0 && <GroupHabitTimeline key={`timeline-${completionsCount}-${userCompletedToday}`} timeline={timeline} accentColor={tierTheme.accent} />
            )}
          </View>
        </ImageBackground>
      </LinearGradient>
    </TouchableOpacity>
  );
}
