// src/components/dashboard/DailyChallenge.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle2 } from 'lucide-react-native';
import { XPService } from '../../services/xpService';
import { supabase } from '../../lib/supabase';
import { useDebugMode } from '@/hooks/useDebugMode';

interface TierTheme {
  gradient: string[];
  accent: string;
  gemName: string;
}

interface DailyChallengeProps {
  completedToday: number;
  totalTasksToday: number;
  onCollect: (amount: number) => void;
  userId: string;
  currentLevelXP: number;
  xpForNextLevel: number;
  onLevelUp?: () => void;
  debugMode?: boolean;
  tierTheme?: TierTheme;
}

const DailyChallenge: React.FC<DailyChallengeProps> = ({ completedToday, totalTasksToday, onCollect, userId, currentLevelXP, xpForNextLevel, onLevelUp, debugMode = false, tierTheme }) => {
  const [isCollected, setIsCollected] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const isComplete = completedToday >= totalTasksToday && totalTasksToday > 0;
  const completionPercentage = totalTasksToday > 0 ? Math.min(100, Math.round((completedToday / totalTasksToday) * 100)) : 0;

  const { showTestButtons } = useDebugMode();

  // Default to Amethyst if no tier theme provided
  const defaultTheme = {
    gradient: ['#9333EA', '#7C3AED'],
    accent: '#9333EA',
    gemName: 'Amethyst',
  };

  const theme = tierTheme || defaultTheme;

  // Check collection status from DATABASE
  useEffect(() => {
    checkCollectionStatus();
  }, [userId, completedToday, totalTasksToday]);

  const checkCollectionStatus = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase.from('daily_challenges').select('xp_collected').eq('user_id', userId).eq('date', today).single();

      if (!error && data) {
        setIsCollected(data.xp_collected || false);
      } else {
        setIsCollected(false);
      }
    } catch (error) {
      console.error('Error checking collection status:', error);
      setIsCollected(false);
    }
  };

  const handleCollect = async () => {
    if (!isComplete || isCollected || isAnimating) return;

    setIsAnimating(true);

    try {
      const success = await XPService.collectDailyChallenge(userId);

      if (success) {
        setIsCollected(true);
        onCollect(20);

        // Check for level up
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
    try {
      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('daily_challenges')
        .update({
          xp_collected: false,
          collected_at: null,
        })
        .eq('user_id', userId)
        .eq('date', today);

      if (!error) {
        setIsCollected(false);
        console.log('Debug: Daily challenge reset');
      }
    } catch (error) {
      console.error('Error resetting daily challenge:', error);
    }
  };

  // Determine gradient and styles based on state
  const getCardStyle = () => {
    if (isCollected) {
      return {
        gradient: ['#F9FAFB', '#F3F4F6', '#F9FAFB'],
        iconBg: 'rgba(156, 163, 175, 0.15)',
        textPrimary: '#6B7280',
        textSecondary: '#9CA3AF',
        badgeBg: '#D1D5DB',
        shadowColor: '#9CA3AF',
        borderColor: 'rgba(156, 163, 175, 0.25)',
      };
    }
    if (isComplete) {
      return {
        gradient: ['#CFFAFE', '#A5F3FC', '#E0F2FE'],
        iconBg: 'rgba(6, 182, 212, 0.15)',
        textPrimary: '#0E7490',
        textSecondary: '#0891B2',
        badgeBg: '#06B6D4',
        shadowColor: '#06B6D4',
        borderColor: 'rgba(6, 182, 212, 0.4)',
      };
    }
    // In progress - use tier theme
    return {
      gradient: [`${theme.accent}08`, `${theme.accent}05`, '#FAF9F7'],
      iconBg: `${theme.accent}15`,
      textPrimary: '#1F2937',
      textSecondary: '#6B7280',
      badgeBg: theme.accent,
      shadowColor: theme.accent,
      progressBg: `${theme.accent}15`,
      progressGradient: theme.gradient,
      borderColor: `${theme.accent}30`,
    };
  };

  const cardStyle = getCardStyle();

  return (
    <View>
      <Pressable
        onPress={handleCollect}
        disabled={!isComplete || isCollected || isAnimating}
        style={({ pressed }) => [
          {
            transform: [{ scale: pressed && isComplete && !isCollected ? 0.98 : 1 }],
          },
        ]}
      >
        {/* Card with gradient, border and shadow */}
        <LinearGradient
          colors={cardStyle.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 16,
            padding: 16,
            borderWidth: 1.5,
            borderColor: cardStyle.borderColor,
            shadowColor: cardStyle.shadowColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 10,
            elevation: 4,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Left side: Icon + Text */}
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              {/* Icon */}
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: cardStyle.iconBg,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                }}
              >
                {isCollected ? (
                  <CheckCircle2 size={28} color="#9CA3AF" />
                ) : isComplete ? (
                  <Image source={require('../../../assets/interface/consumable-xp.png')} style={{ width: 40, height: 40 }} />
                ) : (
                  <Image source={require('../../../assets/interface/challenge.png')} style={{ width: 40, height: 40 }} />
                )}
              </View>

              {/* Text */}
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    color: cardStyle.textPrimary,
                  }}
                >
                  Daily Challenge
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    marginTop: 2,
                    color: cardStyle.textSecondary,
                    fontWeight: '600',
                  }}
                >
                  {isCollected ? 'Collected! See you tomorrow' : isComplete ? 'Tap to claim 20 XP!' : `${totalTasksToday - completedToday} tasks to go`}
                </Text>
              </View>
            </View>

            {/* Right side: XP Badge */}
            <View
              style={{
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: cardStyle.badgeBg,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '800',
                  color: '#FFFFFF',
                }}
              >
                {isCollected ? '✓' : '20 XP'}
              </Text>
            </View>
          </View>

          {/* Progress bar - only show if not complete and not collected */}
          {!isComplete && !isCollected && (
            <View style={{ marginTop: 12 }}>
              <View
                style={{
                  height: 8,
                  borderRadius: 20,
                  overflow: 'hidden',
                  backgroundColor: cardStyle.progressBg || `${theme.accent}15`,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                }}
              >
                <LinearGradient
                  colors={cardStyle.progressGradient || theme.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    height: '100%',
                    width: `${completionPercentage}%`,
                  }}
                />
              </View>
              <Text
                style={{
                  fontSize: 11,
                  color: '#6B7280',
                  marginTop: 6,
                  textAlign: 'center',
                  fontWeight: '600',
                }}
              >
                {completionPercentage}% Complete
              </Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>

      {/* Debug Reset Button */}
      {showTestButtons && isCollected && (
        <Pressable
          onPress={handleDebugReset}
          style={{
            marginTop: 8,
            backgroundColor: '#DC2626',
            borderRadius: 12,
            padding: 8,
          }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 11,
              textAlign: 'center',
              fontWeight: '700',
            }}
          >
            Reset (Debug)
          </Text>
        </Pressable>
      )}
    </View>
  );
};

export default DailyChallenge;
