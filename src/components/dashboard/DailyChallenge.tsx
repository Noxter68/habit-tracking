// src/components/dashboard/DailyChallenge.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle2 } from 'lucide-react-native';
import tw, { quartzGradients } from '../../lib/tailwind';
import { XPService } from '../../services/xpService';
import { supabase } from '../../lib/supabase';
import { useDebugMode } from '@/hooks/useDebugMode';

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

  const isComplete = completedToday >= totalTasksToday && totalTasksToday > 0;
  const completionPercentage = totalTasksToday > 0 ? Math.min(100, Math.round((completedToday / totalTasksToday) * 100)) : 0;

  const { showTestButtons } = useDebugMode();

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
        gradient: quartzGradients.locked.card, // Soft sand for collected
        iconBg: 'bg-sand-200',
        textPrimary: 'text-stone-700',
        textSecondary: 'text-sand-600',
        badgeBg: 'bg-sand-300',
      };
    }
    if (isComplete) {
      return {
        gradient: quartzGradients.success, // Soft sky blue for ready to claim
        iconBg: 'bg-white/30',
        textPrimary: 'text-white',
        textSecondary: 'text-white/90',
        badgeBg: 'bg-white/25',
      };
    }
    return {
      gradient: quartzGradients.light, // Light stone for in progress
      iconBg: 'bg-sand-100',
      textPrimary: 'text-stone-800',
      textSecondary: 'text-sand-700',
      badgeBg: 'bg-stone-500',
    };
  };

  const cardStyle = getCardStyle();

  return (
    <View>
      <Pressable onPress={handleCollect} disabled={!isComplete || isCollected || isAnimating} style={({ pressed }) => [pressed && isComplete && !isCollected && tw`scale-[0.98]`]}>
        {/* Card with gradient and subtle shadow */}
        <LinearGradient
          colors={cardStyle.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            tw`rounded-2xl p-4`,
            {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            },
          ]}
        >
          <View style={tw`flex-row items-center justify-between`}>
            {/* Left side: Icon + Text */}
            <View style={tw`flex-row items-center flex-1`}>
              {/* Icon */}
              <View
                style={[
                  tw`w-12 h-12 rounded-2xl items-center justify-center ${cardStyle.iconBg}`,
                  {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                  },
                ]}
              >
                {isCollected ? (
                  <CheckCircle2 size={28} color="#6B7280" />
                ) : isComplete ? (
                  <Image source={require('../../../assets/interface/consumable-xp.png')} style={{ width: 40, height: 40 }} />
                ) : (
                  <Image source={require('../../../assets/interface/challenge.png')} style={{ width: 40, height: 40 }} />
                )}
              </View>

              {/* Text */}
              <View style={tw`ml-3 flex-1`}>
                <Text style={[tw`text-xs font-bold uppercase tracking-wide`, tw`${cardStyle.textPrimary}`]}>Daily Challenge</Text>
                <Text style={[tw`text-sm mt-0.5`, tw`${cardStyle.textSecondary}`]}>
                  {isCollected ? 'Collected! See you tomorrow' : isComplete ? 'Tap to claim 20 XP!' : `${totalTasksToday - completedToday} tasks to go`}
                </Text>
              </View>
            </View>

            {/* Right side: XP Badge */}
            <View
              style={[
                tw`rounded-full px-3 py-1.5 ${cardStyle.badgeBg}`,
                {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                },
              ]}
            >
              <Text style={tw`text-sm font-bold text-white`}>{isCollected ? '✓' : '20 XP'}</Text>
            </View>
          </View>

          {/* Progress bar - only show if not complete and not collected */}
          {!isComplete && !isCollected && (
            <View style={tw`mt-3`}>
              <View
                style={[
                  tw`h-2 rounded-full overflow-hidden`,
                  {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                  },
                ]}
              >
                <LinearGradient colors={['#9CA3AF', '#6B7280']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[tw`h-full`, { width: `${completionPercentage}%` }]} />
              </View>
              <Text style={tw`text-xs text-sand-700 mt-1 text-center`}>{completionPercentage}% Complete</Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>

      {/* Debug Reset Button */}
      {showTestButtons && isCollected && (
        <Pressable onPress={handleDebugReset} style={tw`mt-2 bg-red-500 rounded-lg p-2`}>
          <Text style={tw`text-white text-xs text-center font-semibold`}>Reset (Debug)</Text>
        </Pressable>
      )}
    </View>
  );
};

export default DailyChallenge;
