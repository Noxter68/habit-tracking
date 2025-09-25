// src/components/dashboard/DailyChallenge.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Vibration } from 'react-native';
import { Gift, Check, Sparkles } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { XPService } from '../../services/xpService';
import FloatingXP from './FloatingXp';
import { Image } from 'expo-image';

interface DailyChallengeProps {
  completedToday: number;
  totalTasksToday: number;
  onCollect: (amount: number) => void;
  userId: string;
  debugMode?: boolean;
  currentLevelXP?: number;
  xpForNextLevel?: number;
  onLevelUp?: () => void;
}

const DailyChallenge: React.FC<DailyChallengeProps> = ({ completedToday, totalTasksToday, onCollect, userId, debugMode = false, currentLevelXP = 0, xpForNextLevel = 100, onLevelUp }) => {
  const [isCollected, setIsCollected] = useState(false);
  const [showFloatingXP, setShowFloatingXP] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const completionPercentage = totalTasksToday > 0 ? Math.round((completedToday / totalTasksToday) * 100) : 0;

  const isComplete = completionPercentage >= 100;

  useEffect(() => {
    checkIfCollected();
  }, [userId]);

  const checkIfCollected = async () => {
    if (!userId) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const collectedKey = `daily_challenge_${userId}_${today}`;
      const localCollected = await AsyncStorage.getItem(collectedKey);

      if (localCollected === 'true') {
        setIsCollected(true);
      }
    } catch (error) {
      console.error('Error checking daily challenge:', error);
    }
  };

  const handlePress = async () => {
    console.log('DailyChallenge: handlePress called');
    console.log('isComplete:', isComplete, 'isCollected:', isCollected, 'userId:', userId);
    console.log('Current XP:', currentLevelXP, 'XP for next level:', xpForNextLevel);

    if (!isComplete || isCollected || !userId) {
      console.log('DailyChallenge: Cannot collect - conditions not met');
      return;
    }

    // Haptic feedback
    Vibration.vibrate(50);

    // Calculate if this will cause a level up
    const xpReward = 20;
    const newTotalXP = currentLevelXP + xpReward;
    const willLevelUp = newTotalXP >= xpForNextLevel;

    console.log('Will level up?', willLevelUp, 'New XP:', newTotalXP);

    // Show XP animation immediately
    console.log('DailyChallenge: Showing XP animation');
    setShowFloatingXP(true);

    // Mark as collected immediately to prevent double-tap
    setIsCollected(true);

    try {
      // Save to local storage
      const today = new Date().toISOString().split('T')[0];
      const collectedKey = `daily_challenge_${userId}_${today}`;
      await AsyncStorage.setItem(collectedKey, 'true');

      // Update backend ONCE
      await XPService.awardXP(userId, {
        amount: xpReward,
        source_type: 'daily_challenge',
        description: 'Daily challenge reward',
      });

      // Call parent callback to update UI
      // The parent should handle fetching updated stats from backend
      onCollect(xpReward);

      // Show level up animation if needed
      if (willLevelUp) {
        console.log('DailyChallenge: Level up detected!');
        // Wait for XP animation to finish, then show level up
        setTimeout(() => {
          setShowFloatingXP(false);
          setShowLevelUp(true);
          if (onLevelUp) onLevelUp();

          // Hide level up after animation
          setTimeout(() => {
            setShowLevelUp(false);
          }, 3000);
        }, 2000);
      } else {
        // Just hide XP animation after duration
        setTimeout(() => {
          setShowFloatingXP(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error collecting daily challenge:', error);
      // Revert on error
      setIsCollected(false);
    }
  };

  const handleDebugReset = async () => {
    if (!debugMode || !userId) return;

    const today = new Date().toISOString().split('T')[0];
    const collectedKey = `daily_challenge_${userId}_${today}`;
    await AsyncStorage.removeItem(collectedKey);
    setIsCollected(false);
    console.log('Debug: Reset daily challenge');
  };

  const getGradientColors = () => {
    if (isCollected) return ['#e5e7eb', '#d1d5db'];
    if (isComplete) return ['#fbbf24', '#f59e0b'];
    return ['#fef3c7', '#fde68a'];
  };

  return (
    <View style={{ position: 'relative' }}>
      {/* Floating XP Animation */}
      <FloatingXP
        amount={20}
        show={showFloatingXP}
        onComplete={() => {
          console.log('DailyChallenge: XP animation completed');
        }}
        type="xp"
      />

      {/* Level Up Animation */}
      <FloatingXP
        show={showLevelUp}
        onComplete={() => {
          console.log('DailyChallenge: Level up animation completed');
        }}
        type="level-up"
      />

      <Pressable onPress={handlePress} disabled={!isComplete || isCollected}>
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: isCollected ? '#e5e7eb' : isComplete ? '#f59e0b' : '#fde68a',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isCollected ? '#d1d5db' : isComplete ? 'rgba(255, 255, 255, 0.3)' : '#fed7aa',
                }}
              >
                {isCollected ? (
                  <Image source={require('../../../assets/interface/chest-reward-opened.png')} style={{ width: 40, height: 40 }} />
                ) : isComplete ? (
                  <Image source={require('../../../assets/interface/chest-reward.png')} style={{ width: 40, height: 40 }} />
                ) : (
                  <Image source={require('../../../assets/interface/challenge.png')} style={{ width: 40, height: 40 }} />
                )}
              </View>

              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: isCollected ? '#6b7280' : isComplete ? '#ffffff' : '#92400e',
                    textTransform: 'uppercase',
                  }}
                >
                  Daily Challenge
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    marginTop: 2,
                    color: isCollected ? '#9ca3af' : isComplete ? '#ffffff' : '#b45309',
                  }}
                >
                  {isCollected ? 'Collected! See you tomorrow' : isComplete ? 'Tap to claim 20 XP!' : `${totalTasksToday - completedToday} tasks to go`}
                </Text>
              </View>
            </View>

            {/* XP Badge */}
            <View
              style={{
                backgroundColor: isCollected ? '#9ca3af' : isComplete ? 'rgba(255, 255, 255, 0.25)' : '#92400e',
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: '#ffffff',
                }}
              >
                {isCollected ? '✓' : '20 XP'}
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          {!isComplete && !isCollected && (
            <View style={{ marginTop: 12 }}>
              <View
                style={{
                  height: 8,
                  backgroundColor: '#fed7aa',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    height: '100%',
                    backgroundColor: '#f59e0b',
                    width: `${completionPercentage}%`,
                  }}
                />
              </View>
              <Text
                style={{
                  fontSize: 12,
                  color: '#b45309',
                  marginTop: 4,
                  textAlign: 'center',
                }}
              >
                {completionPercentage}% Complete
              </Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>

      {/* Debug Reset Button */}
      {debugMode && isCollected && (
        <Pressable
          onPress={handleDebugReset}
          style={{
            marginTop: 8,
            backgroundColor: '#ef4444',
            borderRadius: 8,
            padding: 8,
          }}
        >
          <Text style={{ color: 'white', fontSize: 12, textAlign: 'center' }}>Reset (Debug)</Text>
        </Pressable>
      )}
    </View>
  );
};

export default DailyChallenge;
