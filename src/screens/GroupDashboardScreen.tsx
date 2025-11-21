// screens/GroupDashboardScreen.tsx
// Dashboard avec i18n

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, ImageBackground, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp as RNRouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Plus, Settings, UserRoundPlus, Flame, Trophy, Star } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { groupService } from '@/services/groupTypeService';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { GroupWithMembers, GroupHabitWithCompletions } from '@/types/group.types';
import { formatStreak, getLevelProgress, formatInviteCode, getXpProgressInfo } from '@/utils/groupUtils';
import { GroupHabitCard } from '@/components/groups/GroupHabitCard';
import { getAchievementTierTheme, getHabitTierTheme } from '@/utils/tierTheme';
import { calculateGroupTierFromLevel, getGroupTierConfigByLevel, getGroupTierThemeKey } from '@utils/groups/groupConstants';
import { useStreakSaver } from '@/hooks/useStreakSaver';
import { StreakSaverModal } from '@/components/streakSaver/StreakSaverModal';
import { StreakSaverShopModal } from '@/components/streakSaver/StreakSaverShopModal';
import tw from '@/lib/tailwind';
import { useGroupCelebration } from '@/context/GroupCelebrationContext';
import { GroupTierUpModal } from '@/components/groups/GroupTierUpModal';
import { GroupLevelUpModal } from '@/components/groups/GroupLevelUpModal';
import Logger from '@/utils/logger';

type NavigationProp = NativeStackNavigationProp<any>;
type RouteParams = RNRouteProp<{ GroupDashboard: { groupId: string } }, 'GroupDashboard'>;

export default function GroupDashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { groupId } = route.params;

  const { celebrateLevelChange, checkPendingCelebrations, saveLastKnownLevel } = useGroupCelebration();

  const [group, setGroup] = useState<GroupWithMembers | null>(null);
  const [habits, setHabits] = useState<GroupHabitWithCompletions[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showStreakSaverShop, setShowStreakSaverShop] = useState(false);
  const [weeklyBonusStatus, setWeeklyBonusStatus] = useState<{ bonusOnTrack: boolean; weekComplete: boolean }>({
    bonusOnTrack: false,
    weekComplete: false,
  });

  const xpProgress = useRef(new Animated.Value(0)).current;
  const bonusPulseAnim = useRef(new Animated.Value(1)).current;
  const isInitialLoad = useRef(true);
  const currentLevelRef = useRef<number | null>(null);

  const firstHabitId = habits[0]?.id || '';

  const streakSaver = useStreakSaver({
    type: 'group',
    groupHabitId: firstHabitId,
    groupId: groupId,
    userId: user?.id || '',
    enabled: !!firstHabitId && !!user?.id,
    onStreakRestored: () => {
      loadGroupData(true);
    },
  });

  useEffect(() => {
    if (group) {
      currentLevelRef.current = group.level;
    }
  }, [group]);

  // Animation de respiration pour le badge bonus
  useEffect(() => {
    if (weeklyBonusStatus.bonusOnTrack) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(bonusPulseAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(bonusPulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [weeklyBonusStatus.bonusOnTrack]);

  const loadGroupData = async (silent = false) => {
    if (!user?.id) return;
    if (!silent) setLoading(true);

    try {
      const currentGroup = await groupService.getGroupById(groupId, user.id);

      if (!currentGroup) {
        Logger.warn('[GroupDashboard] Group not found or user is not a member');
        if (!silent) {
          Alert.alert(t('groups.dashboard.error'), t('groups.dashboard.groupNotFound'));
          navigation.goBack();
        }
        return;
      }

      // Check for pending celebrations on initial load only
      if (isInitialLoad.current) {
        await checkPendingCelebrations(groupId, currentGroup.level);
        isInitialLoad.current = false;
      }

      // Animate XP progress bar
      if (group && currentGroup.xp !== group.xp) {
        const newProgress = getLevelProgress(currentGroup.xp);

        Animated.timing(xpProgress, {
          toValue: newProgress,
          duration: 800,
          useNativeDriver: false,
        }).start();

        if (currentGroup.xp > group.xp) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (currentGroup.xp < group.xp) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } else if (!group) {
        xpProgress.setValue(getLevelProgress(currentGroup.xp));
      }

      setGroup(currentGroup);

      const habitsData = await groupService.getGroupHabits(groupId);
      setHabits(habitsData);

      // Charger le statut du bonus hebdomadaire
      const bonusStatus = await groupService.getGroupWeeklyBonusStatus(groupId);
      setWeeklyBonusStatus(bonusStatus);
    } catch (error) {
      Logger.error('[GroupDashboard] Error loading group:', error);
      if (!silent) {
        Alert.alert(t('groups.dashboard.error'), t('groups.dashboard.errorLoading'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!groupId || !user?.id) return;

    Logger.debug(`[GroupDashboard] Setting up realtime subscriptions for group ${groupId}`);

    const completionsChannel = supabase
      .channel(`group_completions:${groupId}:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_habit_completions',
        },
        () => {
          loadGroupData(true);
        }
      )
      .subscribe();

    const habitsChannel = supabase
      .channel(`group_habits:${groupId}:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_habits',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          loadGroupData(true);
        }
      )
      .subscribe();

    const groupChannel = supabase
      .channel(`group:${groupId}:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'groups',
          filter: `id=eq.${groupId}`,
        },
        (payload) => {
          // Detect level up immediately from realtime payload
          const newLevel = payload.new?.level;
          const oldLevel = currentLevelRef.current;

          if (oldLevel && newLevel && newLevel > oldLevel) {
            Logger.info(`[GroupDashboard] Level up detected: ${oldLevel} → ${newLevel}`);
            celebrateLevelChange(oldLevel, newLevel);
            saveLastKnownLevel(groupId, newLevel);
            currentLevelRef.current = newLevel;
          }

          loadGroupData(true);
        }
      )
      .subscribe();

    return () => {
      Logger.debug(`[GroupDashboard] Cleaning up realtime subscriptions for group ${groupId}`);
      completionsChannel.unsubscribe();
      habitsChannel.unsubscribe();
      groupChannel.unsubscribe();
    };
  }, [groupId, user?.id]);

  useEffect(() => {
    loadGroupData();
  }, [groupId, user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    loadGroupData();
  };

  const handleShareCode = async () => {
    if (!group) return;
    const formattedCode = formatInviteCode(group.invite_code);
    await Clipboard.setStringAsync(formattedCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(t('groups.invite.codeCopied'), t('groups.invite.codeMessage', { code: formattedCode }));
  };

  const handleAddHabit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('CreateGroupHabit', { groupId });
  };

  const handleSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('GroupSettings', { groupId });
  };

  const handleTiers = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('GroupTiers', { groupId });
  };

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handleDeleteHabit = async (habitId: string, habitName: string) => {
    Alert.alert(t('groups.dashboard.deleteHabit'), t('groups.dashboard.deleteHabitMessage', { name: habitName }), [
      { text: t('groups.dashboard.cancel'), style: 'cancel' },
      {
        text: t('groups.dashboard.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await groupService.deleteGroupHabit(habitId, user.id);
            await loadGroupData();
          } catch (error) {
            Logger.error('[GroupDashboard] Error deleting habit:', error);
            Alert.alert(t('groups.dashboard.error'), t('groups.dashboard.errorDeleting'));
          }
        },
      },
    ]);
  };

  const handleStreakSaverShopClose = () => {
    setShowStreakSaverShop(false);
    streakSaver.loadInventory();
  };

  const handleStreakSaverModalClose = () => {
    if (streakSaver.inventory.available === 0) {
      Alert.alert(t('groups.streak.noStreakSaver'), t('groups.streak.noStreakSaverMessage'), [
        { text: t('groups.streak.later'), style: 'cancel', onPress: streakSaver.closeModal },
        {
          text: t('groups.streak.buy'),
          onPress: () => {
            streakSaver.closeModal();
            setShowStreakSaverShop(true);
          },
        },
      ]);
    } else {
      streakSaver.closeModal();
    }
  };

  if (loading) {
    return (
      <View style={tw`flex-1 bg-[#FAFAFA] items-center justify-center`}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={tw`flex-1 bg-[#FAFAFA] items-center justify-center`}>
        <Text style={tw`text-sm text-stone-400`}>{t('groups.dashboard.groupNotFound')}</Text>
      </View>
    );
  }

  const xpInfo = getXpProgressInfo(group.xp);
  const progress = xpInfo.progressPercentage;

  const currentTierNumber = calculateGroupTierFromLevel(group.level);
  const currentTierConfig = getGroupTierConfigByLevel(group.level);
  const tierTheme = currentTierNumber <= 3 ? getHabitTierTheme(currentTierConfig.name as any) : getAchievementTierTheme(getGroupTierThemeKey(currentTierNumber));

  const isObsidianTier = currentTierNumber === 6;
  const isJade = tierTheme.accent === '#059669';
  const isTopaz = tierTheme.accent === '#f59e0b';

  const textureOpacity = isObsidianTier ? 0.35 : 0.2;
  const iconOpacity = isObsidianTier ? 0.15 : 0.25;
  const baseOverlayOpacity = isObsidianTier ? 0.15 : 0.05;

  const headerGradient = tierTheme.gradient;

  return (
    <View style={tw`flex-1 bg-[#FAFAFA] mb-10`}>
      <StatusBar style="light" />
      <LinearGradient
        colors={headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          {
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
            shadowColor: isObsidianTier ? '#8b5cf6' : isJade ? '#059669' : isTopaz ? '#f59e0b' : '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isObsidianTier || isJade || isTopaz ? 0.3 : 0.15,
            shadowRadius: 12,
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

          <View style={tw`px-5 pt-14 pb-4`}>
            <View
              style={{
                position: 'absolute',
                top: 60,
                right: 50,
                opacity: iconOpacity,
              }}
            >
              <Image
                source={currentTierConfig.icon}
                style={{
                  width: 130,
                  height: 130,
                  resizeMode: 'contain',
                }}
              />
            </View>
            <View style={tw`flex-row items-center justify-between mb-3`}>
              <TouchableOpacity
                onPress={handleGoBack}
                style={[
                  tw`w-9 h-9 items-center justify-center rounded-full`,
                  {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                  },
                ]}
                activeOpacity={0.7}
              >
                <ArrowLeft size={18} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>

              <View style={tw`flex-row gap-2`}>
                <TouchableOpacity
                  onPress={handleTiers}
                  style={[
                    tw`w-9 h-9 rounded-full items-center justify-center`,
                    {
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Trophy size={15} color="#FFFFFF" strokeWidth={2.5} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleShareCode}
                  style={[
                    tw`w-9 h-9 rounded-full items-center justify-center`,
                    {
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <UserRoundPlus size={15} color="#FFFFFF" strokeWidth={2.5} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSettings}
                  style={[
                    tw`w-9 h-9 rounded-full items-center justify-center`,
                    {
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Settings size={15} color="#FFFFFF" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={tw`flex-row items-start gap-3 mb-4`}>
              <View style={tw`flex-1`}>
                <Text
                  style={[
                    tw`text-2xl font-black mb-1`,
                    {
                      color: '#FFFFFF',
                      textShadowColor: isObsidianTier ? 'rgba(139, 92, 246, 0.6)' : 'rgba(0, 0, 0, 0.4)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 3,
                    },
                  ]}
                >
                  {group.name}
                </Text>

                <View style={tw`flex-row items-center gap-2 flex-wrap`}>
                  <View
                    style={[
                      tw`px-2.5 py-1 rounded-full`,
                      {
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.4)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        tw`text-xs font-bold`,
                        {
                          color: '#FFFFFF',
                          textShadowColor: 'rgba(0, 0, 0, 0.3)',
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 2,
                        },
                      ]}
                    >
                      {t('groups.dashboard.level', { level: group.level })}
                    </Text>
                  </View>

                  <View
                    style={[
                      tw`px-2.5 py-1 rounded-full flex-row items-center gap-1`,
                      {
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.4)',
                      },
                    ]}
                  >
                    <Flame size={12} color="#FFFFFF" fill="#FFFFFF" />
                    <Text
                      style={[
                        tw`text-xs font-bold`,
                        {
                          color: '#FFFFFF',
                          textShadowColor: 'rgba(0, 0, 0, 0.3)',
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 2,
                        },
                      ]}
                    >
                      {formatStreak(group.current_streak)}
                    </Text>
                  </View>

                  {/* Badge bonus +200 XP si tous les jours passés sont complétés */}
                  {weeklyBonusStatus.bonusOnTrack && (
                    <Animated.View
                      style={[
                        tw`px-2.5 py-1 rounded-full flex-row items-center gap-1`,
                        {
                          backgroundColor: weeklyBonusStatus.weekComplete ? '#fbbf24' : '#fef3c7',
                          borderWidth: 1.5,
                          borderColor: weeklyBonusStatus.weekComplete ? '#f59e0b' : '#fcd34d',
                          transform: [{ scale: bonusPulseAnim }],
                          shadowColor: '#fbbf24',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.3,
                          shadowRadius: 4,
                          elevation: 4,
                        },
                      ]}
                    >
                      <Star size={12} color={weeklyBonusStatus.weekComplete ? '#FFFFFF' : '#f59e0b'} fill={weeklyBonusStatus.weekComplete ? '#FFFFFF' : '#f59e0b'} />
                      <Text
                        style={[
                          tw`text-xs font-bold`,
                          {
                            color: weeklyBonusStatus.weekComplete ? '#FFFFFF' : '#b45309',
                          },
                        ]}
                      >
                        +200 XP
                      </Text>
                    </Animated.View>
                  )}
                </View>
              </View>
            </View>

            <View>
              <View style={tw`flex-row items-center justify-between mb-1.5`}>
                <Text
                  style={[
                    tw`text-xs font-bold`,
                    {
                      color: '#FFFFFF',
                      textShadowColor: 'rgba(0, 0, 0, 0.3)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    },
                  ]}
                >
                  {xpInfo.xpInCurrentLevel} / {xpInfo.xpNeededForNextLevel} XP
                </Text>
                <Text
                  style={[
                    tw`text-xs font-semibold`,
                    {
                      color: 'rgba(255, 255, 255, 0.9)',
                      textShadowColor: 'rgba(0, 0, 0, 0.3)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    },
                  ]}
                >
                  {progress}%
                </Text>
              </View>
              <View
                style={[
                  tw`h-2.5 rounded-full overflow-hidden`,
                  {
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                ]}
              >
                <Animated.View
                  style={[
                    tw`h-full rounded-full`,
                    {
                      backgroundColor: '#FFFFFF',
                      width: xpProgress.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </ImageBackground>
      </LinearGradient>

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`px-5 py-5`}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        <View style={tw`flex-row items-center justify-between mb-4`}>
          <View>
            <Text style={tw`text-xl font-black text-stone-800`}>{t('groups.dashboard.habits')}</Text>
            <Text style={tw`text-sm text-stone-500 mt-0.5`}>{t('groups.dashboard.habitsCount', { count: habits.length })}</Text>
          </View>

          <TouchableOpacity onPress={handleAddHabit} activeOpacity={0.8}>
            <LinearGradient
              colors={tierTheme.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                tw`flex-row items-center gap-1.5 rounded-xl px-3.5 py-2`,
                {
                  shadowColor: tierTheme.accent,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                },
              ]}
            >
              <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={tw`text-sm font-bold text-white`}>{t('groups.dashboard.addHabit')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {habits.length === 0 ? (
          <View
            style={[
              tw`rounded-2xl p-6 items-center`,
              {
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: 'rgba(0, 0, 0, 0.05)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
              },
            ]}
          >
            <View
              style={[
                tw`w-16 h-16 rounded-xl items-center justify-center mb-3`,
                {
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                },
              ]}
            >
              <Text style={tw`text-3xl`}>🎯</Text>
            </View>
            <Text style={tw`text-lg font-bold text-stone-800 mb-1.5`}>{t('groups.dashboard.noHabits')}</Text>
            <Text style={tw`text-sm text-stone-500 text-center mb-5 px-2`}>{t('groups.dashboard.noHabitsDescription')}</Text>
            <TouchableOpacity onPress={handleAddHabit} activeOpacity={0.8}>
              <LinearGradient
                colors={tierTheme.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  tw`rounded-xl px-5 py-2.5`,
                  {
                    shadowColor: tierTheme.accent,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                  },
                ]}
              >
                <Text style={tw`text-sm font-bold text-white`}>{t('groups.dashboard.createHabit')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {habits.map((habit) => (
              <GroupHabitCard
                key={habit.id}
                habit={habit}
                groupId={groupId}
                groupLevel={group.level}
                members={group.members}
                onRefresh={() => loadGroupData(true)}
                onDelete={() => handleDeleteHabit(habit.id, habit.name)}
              />
            ))}
          </View>
        )}

        <View style={tw`h-6`} />
      </ScrollView>

      <GroupTierUpModal />
      <GroupLevelUpModal />

      <StreakSaverModal
        visible={streakSaver.showModal}
        habitName={streakSaver.eligibility.habitName || t('groups.dashboard.groupHabit')}
        previousStreak={streakSaver.eligibility.previousStreak || 0}
        availableSavers={streakSaver.inventory.available}
        loading={streakSaver.using}
        success={streakSaver.success}
        newStreak={streakSaver.newStreak}
        onUse={streakSaver.useStreakSaver}
        onClose={handleStreakSaverModalClose}
      />

      <StreakSaverShopModal
        visible={showStreakSaverShop}
        onClose={handleStreakSaverShopClose}
        onPurchaseSuccess={() => {
          streakSaver.loadInventory();
        }}
      />
    </View>
  );
}
