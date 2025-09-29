// src/components/dashboard/DailyChallenge.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle2 } from 'lucide-react-native';
import tw from '../../lib/tailwind';
import { XPService } from '../../services/xpService';
import { useStats } from '../../context/StatsContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DailyChallengeProps {
  completedToday: number;
  totalTasksToday: number;
  onCollect: (amount: number) => void;
  userId: string;
  currentLevelXP: number;
  xpForNextLevel: number;
  onLevelUp?: () => void;
  debugMode?: boolean;
}

const DailyChallenge: React.FC<DailyChallengeProps> = ({ completedToday, totalTasksToday, onCollect, userId, currentLevelXP, xpForNextLevel, onLevelUp, debugMode = false }) => {
  const [isCollected, setIsCollected] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { refreshStats } = useStats();

  const isComplete = completedToday >= totalTasksToday && totalTasksToday > 0;
  const completionPercentage = totalTasksToday > 0 ? Math.min(100, Math.round((completedToday / totalTasksToday) * 100)) : 0;

  // Check collection status from database
  useEffect(() => {
    checkCollectionStatus();
  }, [userId, completedToday, totalTasksToday]);

  const checkCollectionStatus = async () => {
    const status = await XPService.getDailyChallengeStatus(userId);
    if (status) {
      setIsCollected(status.xp_collected);
    }
  };

  const handleCollect = async () => {
    if (!isComplete || isCollected || isAnimating) return;

    setIsAnimating(true);
    const today = new Date().toISOString().split('T')[0];
    const key = `daily_challenge_${userId}_${today}`;

    try {
      // FIX: Use correct parameters for awardXP
      const success = await XPService.awardXP(userId, {
        amount: 20,
        source_type: 'daily_challenge',
        description: 'Daily Challenge Completed!',
      });

      if (success) {
        // Mark as collected locally
        await AsyncStorage.setItem(key, 'true');
        setIsCollected(true);

        // Trigger callback - this will refresh stats
        onCollect(20);

        // Optional: Check for level up
        if (currentLevelXP + 20 >= xpForNextLevel && onLevelUp) {
          setTimeout(() => {
            onLevelUp();
          }, 500);
        }
      }
    } catch (error) {
      console.error('Error collecting daily challenge:', error);
    } finally {
      setIsAnimating(false);
    }
  };

  const handleDebugReset = async () => {
    // For debug: manually reset the collection status in database
    // You might want to add a debug method in XPService for this
    console.log('Debug reset - would need to reset database status');
    await checkCollectionStatus(); // Refresh from database
  };

  return (
    <View>
      <Pressable onPress={handleCollect} disabled={!isComplete || isCollected || isAnimating} style={({ pressed }) => [pressed && isComplete && !isCollected && tw`scale-[0.98]`]}>
        <LinearGradient
          colors={isCollected ? ['#E5E7EB', '#D1D5DB'] : isComplete ? ['#6B7280', '#4B5563'] : ['#F3F4F6', '#E5E7EB']}
          style={tw`rounded-2xl p-4 border ${isCollected ? 'border-quartz-300' : isComplete ? 'border-quartz-400' : 'border-quartz-200'}`}
        >
          <View style={tw`flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center flex-1`}>
              <View style={tw`w-12 h-12 rounded-2xl items-center justify-center ${isCollected ? 'bg-quartz-300' : isComplete ? 'bg-white bg-opacity-30' : 'bg-quartz-200'}`}>
                {isCollected ? (
                  <CheckCircle2 size={28} color="#6B7280" />
                ) : isComplete ? (
                  <Image source={require('../../../assets/interface/consumable-xp.png')} style={{ width: 40, height: 40 }} />
                ) : (
                  <Image source={require('../../../assets/interface/challenge.png')} style={{ width: 40, height: 40 }} />
                )}
              </View>

              <View style={tw`ml-3 flex-1`}>
                <Text style={tw`text-xs font-bold ${isCollected ? 'text-quartz-500' : isComplete ? 'text-white' : 'text-quartz-700'} uppercase`}>Daily Challenge</Text>
                <Text style={tw`text-sm mt-0.5 ${isCollected ? 'text-quartz-400' : isComplete ? 'text-white' : 'text-quartz-600'}`}>
                  {isCollected ? 'Collected! See you tomorrow' : isComplete ? 'Tap to claim 20 XP!' : `${totalTasksToday - completedToday} tasks to go`}
                </Text>
              </View>
            </View>

            {/* XP Badge */}
            <View style={tw`${isCollected ? 'bg-quartz-400' : isComplete ? 'bg-white bg-opacity-25' : 'bg-quartz-600'} rounded-full px-3 py-1.5`}>
              <Text style={tw`text-sm font-bold text-white`}>{isCollected ? '✓' : '20 XP'}</Text>
            </View>
          </View>

          {/* Progress bar */}
          {!isComplete && !isCollected && (
            <View style={tw`mt-3`}>
              <View style={tw`h-2 bg-quartz-200 rounded-full overflow-hidden`}>
                <View style={[tw`h-full bg-quartz-400`, { width: `${completionPercentage}%` }]} />
              </View>
              <Text style={tw`text-xs text-quartz-500 mt-1 text-center`}>{completionPercentage}% Complete</Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>

      {/* Debug Reset Button */}
      {debugMode && isCollected && (
        <Pressable onPress={handleDebugReset} style={tw`mt-2 bg-red-500 rounded-lg p-2`}>
          <Text style={tw`text-white text-xs text-center`}>Reset (Debug)</Text>
        </Pressable>
      )}
    </View>
  );
};

export default DailyChallenge;
