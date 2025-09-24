// src/components/dashboard/DashboardHeader.tsx
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { Flame, Target } from 'lucide-react-native';
import tw from '../../lib/tailwind';

// Components
import FloatingXP from './FloatingXp';
import AchievementBadge from './AchievementBadge';
import DailyChallenge from './DailyChallenge';
import LevelProgress from './LevelProgress';
import StatsCard from './statsCard';
import NextAchievement from './NextAchievement';

// Utils & Services
import { getGreeting } from '../../utils/progressStatus';
import { achievementTitles } from '../../utils/achievements';
import { HabitService } from '../../services/habitService';
import { XPService } from '../../services/xpService';
import { useAuth } from '../../context/AuthContext';

interface DashboardHeaderProps {
  userTitle: string;
  userLevel: number;
  totalStreak: number;
  activeHabits: number;
  completedTasksToday?: number;
  totalTasksToday?: number;
  onXPCollected?: (amount: number) => void;
  refreshTrigger?: number;
  currentAchievement?: any;
  currentLevelXP?: number;
  xpForNextLevel?: number;
  levelProgress?: number;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userTitle,
  userLevel,
  totalStreak,
  activeHabits,
  completedTasksToday = 0,
  totalTasksToday = 0,
  onXPCollected,
  refreshTrigger = 0,
  currentAchievement,
  currentLevelXP = 0,
  xpForNextLevel = 100,
  levelProgress = 0,
}) => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const greeting = getGreeting();

  const [showFloatingXP, setShowFloatingXP] = useState(false);
  const [floatingXPAmount, setFloatingXPAmount] = useState(0);
  const [collectedXP, setCollectedXP] = useState(0);
  const [realTimeStats, setRealTimeStats] = useState({
    totalXP: 0,
    dailyStreak: totalStreak,
  });

  useEffect(() => {
    fetchRealTimeStats();
  }, [refreshTrigger, user?.id]);

  const fetchRealTimeStats = async () => {
    if (!user?.id) return;

    try {
      const xpStats = await XPService.getUserXPStats(user.id);
      const habitStats = await HabitService.getAggregatedStats(user.id);

      setRealTimeStats({
        totalXP: xpStats?.total_xp || 0,
        dailyStreak: habitStats?.totalDaysTracked || totalStreak,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleXPCollect = async (amount: number) => {
    setFloatingXPAmount(amount);
    setShowFloatingXP(true);

    if (user?.id) {
      await XPService.awardXP(user.id, { amount: amount, source_type: 'daily_challenge' });
      await fetchRealTimeStats();
    }

    setTimeout(() => {
      setCollectedXP((prev) => prev + amount);
      onXPCollected?.(amount);
    }, 800);
  };

  const handleAchievementPress = () => {
    navigation.navigate('Achievements' as never);
  };

  // Get next achievement title
  const nextTitle = achievementTitles?.find((t) => t.level === userLevel + 1);
  const xpToNextLevel = xpForNextLevel - currentLevelXP;

  return (
    <View style={tw`relative`}>
      <FloatingXP amount={floatingXPAmount} show={showFloatingXP} onComplete={() => setShowFloatingXP(false)} />

      <Animated.View entering={FadeIn}>
        {/* Greeting and Level with Achievement Icon */}
        <View style={tw`mb-4`}>
          <Text style={tw`text-lg font-medium text-amber-700`}>{greeting}</Text>
          <View style={tw`flex-row items-center justify-between mt-1`}>
            <View>
              <Text style={tw`text-2xl font-black text-amber-900`}>{userTitle}</Text>
              <View style={tw`flex-row items-center mt-1`}>
                <View style={tw`bg-amber-800 rounded-full px-2 py-0.5 mr-2`}>
                  <Text style={tw`text-xs font-bold text-white`}>LEVEL {userLevel}</Text>
                </View>
                <Text style={tw`text-xs text-amber-600`}>{currentLevelXP + collectedXP} Total XP</Text>
              </View>
            </View>
            <AchievementBadge achievement={currentAchievement} onPress={handleAchievementPress} />
          </View>
        </View>

        {/* Level Progress Bar */}
        <LevelProgress currentLevel={userLevel} currentLevelXP={currentLevelXP + collectedXP} xpForNextLevel={xpForNextLevel} levelProgress={levelProgress} />

        {/* Stats Grid */}
        <View style={tw`flex-row gap-3 mb-4`}>
          <StatsCard label="Streak" value={realTimeStats.dailyStreak} icon={Flame} subtitle="days" isStreak={true} streakValue={totalStreak} />
          <StatsCard label="Active" value={activeHabits} icon={Target} subtitle="Quests" />
        </View>

        {/* Daily Challenge */}
        <View style={tw`mt-6`}>{user?.id && <DailyChallenge completedToday={completedTasksToday} totalTasksToday={totalTasksToday} onCollect={handleXPCollect} userId={user.id} />}</View>

        {/* Next Achievement Preview */}
        <NextAchievement nextTitle={nextTitle} xpToNextLevel={xpToNextLevel} />
      </Animated.View>
    </View>
  );
};

export default DashboardHeader;
