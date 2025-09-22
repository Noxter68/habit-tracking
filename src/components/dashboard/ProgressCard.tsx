// src/components/dashboard/ProgressCard.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, withSpring, withTiming, interpolate, Extrapolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Target, Award, ChevronRight, Activity } from 'lucide-react-native';
import tw from '../../lib/tailwind';
import { ProgressStatus } from '../../utils/progressStatus';
import { useNavigation } from '@react-navigation/native';

interface ProgressCardProps {
  status: ProgressStatus;
  completionRate: number;
  habitsCompleted: number;
  totalHabits: number;
  totalCompletions: number;
}

const ProgressCard: React.FC<ProgressCardProps> = ({ status, completionRate, habitsCompleted, totalHabits, totalCompletions }) => {
  const navigation = useNavigation();

  const progressStyle = useAnimatedStyle(() => ({
    width: withSpring(`${completionRate}%`, {
      damping: 20,
      stiffness: 90,
    }),
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: withTiming(completionRate === 100 ? 1 : 0, { duration: 300 }),
  }));

  // Determine milestone progress
  const nextMilestone = Math.ceil(totalCompletions / 50) * 50;
  const milestoneProgress = ((totalCompletions % 50) / 50) * 100;

  // Get status icon and color
  const getStatusIcon = () => {
    if (completionRate === 100) return Award;
    if (completionRate >= 75) return TrendingUp;
    if (completionRate >= 50) return Target;
    return Activity;
  };

  const StatusIcon = getStatusIcon();

  // Calm color palette
  const getProgressGradient = () => {
    if (completionRate === 100) {
      return ['#86efac', '#65d98a']; // Soft green
    } else if (completionRate >= 75) {
      return ['#a5b4fc', '#8b93f6']; // Soft purple
    } else if (completionRate >= 50) {
      return ['#93c5fd', '#7ab8f8']; // Soft blue
    }
    return ['#e0e7ff', '#c7d2fe']; // Very soft indigo
  };

  return (
    <Animated.View entering={FadeIn.duration(500).springify()} style={tw`px-5 pb-4 mt-4`}>
      <View style={tw`bg-white rounded-3xl overflow-hidden shadow-sm`}>
        {/* Main Content Area */}
        <View style={tw`p-5`}>
          {/* Top Section - Current Progress */}
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <View style={tw`flex-1`}>
              <View style={tw`flex-row items-center mb-1`}>
                <StatusIcon size={18} color={completionRate >= 50 ? '#6366f1' : '#9ca3af'} strokeWidth={2.5} />
                <Text style={tw`text-xs font-medium text-gray-500 ml-2`}>TODAY'S PROGRESS</Text>
              </View>
              <View style={tw`flex-row items-baseline`}>
                <Text style={tw`text-3xl font-bold text-gray-900`}>{habitsCompleted}</Text>
                <Text style={tw`text-lg text-gray-400 ml-1`}>/ {totalHabits}</Text>
                <View style={tw`ml-3 px-2.5 py-0.5 rounded-full bg-indigo-50`}>
                  <Text style={tw`text-sm font-bold text-indigo-600`}>{completionRate}%</Text>
                </View>
              </View>
            </View>

            {/* Visual Progress Circle */}
            <View style={tw`relative w-16 h-16`}>
              <View style={tw`absolute inset-0 items-center justify-center`}>
                <View style={tw`w-full h-full rounded-full border-4 border-gray-100`} />
              </View>
              <View
                style={[
                  tw`absolute inset-0 rounded-full`,
                  {
                    borderWidth: 4,
                    borderColor: getProgressGradient()[0],
                    borderRightColor: completionRate < 25 ? 'transparent' : getProgressGradient()[0],
                    borderBottomColor: completionRate < 50 ? 'transparent' : getProgressGradient()[0],
                    borderLeftColor: completionRate < 75 ? 'transparent' : getProgressGradient()[0],
                    transform: [{ rotate: '-45deg' }],
                  },
                ]}
              />
              <Animated.View style={[tw`absolute inset-0 items-center justify-center`, pulseStyle]}>
                <Award size={24} color="#10b981" strokeWidth={2.5} />
              </Animated.View>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={tw`h-2.5 bg-gray-50 rounded-full overflow-hidden mb-3`}>
            <Animated.View style={[progressStyle]}>
              <LinearGradient colors={getProgressGradient()} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`h-full rounded-full`} />
            </Animated.View>
          </View>

          {/* Status Message */}
          <Text style={tw`text-xs text-gray-500 text-center mb-4`}>{status.message}</Text>
        </View>

        {/* Bottom Section - Lifetime Stats */}
        <LinearGradient colors={['#fafafa', '#ffffff']} style={tw`border-t border-gray-100`}>
          <Pressable onPress={() => navigation.navigate('Stats' as never)} style={({ pressed }) => [tw`px-5 py-4`, pressed && tw`opacity-70`]}>
            <View style={tw`flex-row items-center justify-between`}>
              <View style={tw`flex-1`}>
                <View style={tw`flex-row items-center mb-1`}>
                  <Award size={14} color="#9ca3af" strokeWidth={2} />
                  <Text style={tw`text-xs font-medium text-gray-500 ml-1.5`}>LIFETIME ACHIEVEMENT</Text>
                </View>
                <View style={tw`flex-row items-center`}>
                  <Text style={tw`text-xl font-bold text-gray-900 mr-3`}>{totalCompletions}</Text>
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-xs text-gray-600`}>habits completed</Text>
                    <View style={tw`flex-row items-center mt-0.5`}>
                      <View style={tw`h-1 bg-gray-100 rounded-full flex-1 mr-2`}>
                        <View style={[tw`h-full bg-indigo-400 rounded-full`, { width: `${milestoneProgress}%` }]} />
                      </View>
                      <Text style={tw`text-xs text-gray-400`}>
                        {nextMilestone - totalCompletions} to {nextMilestone}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={tw`ml-4 flex-row items-center`}>
                <Text style={tw`text-xs font-medium text-indigo-600 mr-1`}>View Details</Text>
                <ChevronRight size={16} color="#6366f1" strokeWidth={2.5} />
              </View>
            </View>
          </Pressable>
        </LinearGradient>
      </View>
    </Animated.View>
  );
};

export default ProgressCard;
