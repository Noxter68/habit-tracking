// src/components/GoalBattery.tsx
import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, interpolate, Easing, FadeIn, withSpring } from 'react-native-reanimated';
import Svg, { Path, Rect, Circle, G, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Battery, TrendingUp, AlertTriangle, Zap, Target } from 'lucide-react-native';
import tw from '../lib/tailwind';

interface GoalBatteryProps {
  totalDays: number;
  completedDays: number;
  missedDays: number;
  startDate: Date;
  habitName?: string;
  habitType?: 'good' | 'bad';
}

const GoalBattery: React.FC<GoalBatteryProps> = ({ totalDays, completedDays, missedDays, startDate, habitName, habitType = 'good' }) => {
  const pulse = useSharedValue(0);
  const batteryFill = useSharedValue(0);
  const glowAnimation = useSharedValue(0);

  // Calculate days since start
  const today = new Date();
  const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const expectedDays = Math.min(daysSinceStart, totalDays);
  const daysRemaining = Math.max(0, totalDays - daysSinceStart);

  // Calculate actual missed days
  const actualMissedDays = Math.max(0, expectedDays - completedDays);

  // Calculate success probability with improved algorithm
  const completionRate = expectedDays > 0 ? (completedDays / expectedDays) * 100 : 100;
  const missedRatio = actualMissedDays / totalDays;
  const successProbability = Math.max(0, Math.min(100, completionRate - missedRatio * 50));

  // Determine battery level and colors
  const getBatteryColor = () => {
    if (successProbability > 80) return ['#10b981', '#059669']; // Green gradient
    if (successProbability > 60) return ['#3b82f6', '#2563eb']; // Blue gradient
    if (successProbability > 40) return ['#f59e0b', '#d97706']; // Orange gradient
    if (successProbability > 20) return ['#ef4444', '#dc2626']; // Red gradient
    return ['#991b1b', '#7f1d1d']; // Dark red gradient
  };

  const getStatusIcon = () => {
    if (successProbability > 80) return '🚀';
    if (successProbability > 60) return '⚡';
    if (successProbability > 40) return '🔋';
    if (successProbability > 20) return '⚠️';
    return '🆘';
  };

  const getMotivationalMessage = () => {
    if (successProbability > 80) {
      return {
        title: 'Outstanding Performance!',
        message: "You're crushing it! Keep this amazing momentum going.",
        tone: 'success',
      };
    }
    if (successProbability > 60) {
      return {
        title: 'Great Progress!',
        message: "You're doing well! Stay consistent to reach your goal.",
        tone: 'info',
      };
    }
    if (successProbability > 40) {
      return {
        title: 'Room for Improvement',
        message: 'You can do better! Focus on consistency.',
        tone: 'warning',
      };
    }
    if (successProbability > 20) {
      return {
        title: 'Critical - Action Needed',
        message: 'Your goal is at risk. Time to refocus and commit!',
        tone: 'danger',
      };
    }
    return {
      title: 'Emergency Mode',
      message: "Don't give up! Every day is a new opportunity to restart.",
      tone: 'critical',
    };
  };

  useEffect(() => {
    // Animate battery fill
    batteryFill.value = withSpring(successProbability, {
      damping: 15,
      stiffness: 100,
    });

    // Pulse animation for low battery
    if (successProbability < 40) {
      pulse.value = withRepeat(withSequence(withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) })), -1, false);
    } else {
      pulse.value = 0;
    }

    // Glow animation for high performance
    if (successProbability > 80) {
      glowAnimation.value = withRepeat(withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }), -1, true);
    }
  }, [successProbability]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [1, 0.7]),
  }));

  const animatedFillStyle = useAnimatedStyle(() => ({
    width: `${batteryFill.value}%`,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowAnimation.value, [0, 1], [0.3, 0.6]),
  }));

  const batteryColors = getBatteryColor();
  const status = getMotivationalMessage();

  return (
    <Animated.View entering={FadeIn.duration(400)} style={tw`bg-white rounded-2xl shadow-sm overflow-hidden`}>
      {/* Header with gradient background */}
      <LinearGradient colors={[batteryColors[0] + '10', batteryColors[0] + '05']} style={tw`px-5 pt-5 pb-3`}>
        <View style={tw`flex-row items-center justify-between`}>
          <View style={tw`flex-1`}>
            <Text style={tw`text-lg font-bold text-gray-900`}>Goal Achievement</Text>
            {habitName && <Text style={tw`text-sm text-gray-600 mt-0.5`}>{habitName}</Text>}
          </View>
          <View style={tw`items-center`}>
            <Text style={tw`text-3xl`}>{getStatusIcon()}</Text>
            <Text style={tw`text-xs text-gray-500 mt-1`}>Day {daysSinceStart + 1}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Enhanced Battery Visualization */}
      <View style={tw`px-5 py-4`}>
        <Animated.View style={[successProbability < 40 && animatedContainerStyle]}>
          <View style={tw`relative`}>
            {/* Glow effect for high performance */}
            {successProbability > 80 && <Animated.View style={[tw`absolute inset-0 rounded-2xl`, glowStyle, { backgroundColor: batteryColors[0] + '20' }]} />}

            {/* Battery Container */}
            <View style={tw`bg-gray-100 rounded-2xl h-20 relative overflow-hidden`}>
              {/* Grid pattern background */}
              <View style={tw`absolute inset-0 opacity-10`}>
                {[...Array(10)].map((_, i) => (
                  <View key={i} style={[tw`absolute h-full w-px bg-gray-400`, { left: `${(i + 1) * 10}%` }]} />
                ))}
              </View>

              {/* Battery Fill with gradient */}
              <Animated.View style={[tw`absolute inset-y-0 left-0`, animatedFillStyle]}>
                <LinearGradient colors={batteryColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`h-full`} />
              </Animated.View>

              {/* Center Content */}
              <View style={tw`absolute inset-0 items-center justify-center`}>
                <Text style={tw`text-3xl font-bold text-gray-900`}>{Math.round(successProbability)}%</Text>
                <Text style={tw`text-xs text-gray-600`}>Success Rate</Text>
              </View>

              {/* Lightning bolt for charging */}
              {successProbability > 70 && (
                <View style={tw`absolute right-4 top-1/2 -translate-y-1/2`}>
                  <Zap size={24} color="#ffffff" fill="#ffffff" strokeWidth={2} />
                </View>
              )}

              {/* Warning icon for low battery */}
              {successProbability <= 40 && successProbability > 20 && (
                <View style={tw`absolute right-4 top-1/2 -translate-y-1/2`}>
                  <AlertTriangle size={24} color="#ffffff" strokeWidth={2} />
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Status Message Card */}
        <View
          style={[
            tw`mt-4 p-3 rounded-xl`,
            status.tone === 'success'
              ? tw`bg-green-50`
              : status.tone === 'info'
              ? tw`bg-blue-50`
              : status.tone === 'warning'
              ? tw`bg-amber-50`
              : status.tone === 'danger'
              ? tw`bg-red-50`
              : tw`bg-red-100`,
          ]}
        >
          <Text
            style={[
              tw`text-sm font-semibold`,
              status.tone === 'success' ? tw`text-green-900` : status.tone === 'info' ? tw`text-blue-900` : status.tone === 'warning' ? tw`text-amber-900` : tw`text-red-900`,
            ]}
          >
            {status.title}
          </Text>
          <Text
            style={[tw`text-xs mt-1`, status.tone === 'success' ? tw`text-green-700` : status.tone === 'info' ? tw`text-blue-700` : status.tone === 'warning' ? tw`text-amber-700` : tw`text-red-700`]}
          >
            {status.message}
          </Text>
        </View>
      </View>

      {/* Enhanced Stats Grid */}
      <View style={tw`px-5 pb-5`}>
        <View style={tw`bg-gray-50 rounded-xl p-3`}>
          <View style={tw`flex-row`}>
            {/* Days Expected */}
            <View style={tw`flex-1 items-center`}>
              <View style={tw`w-12 h-12 rounded-xl bg-gray-100 items-center justify-center mb-2`}>
                <Target size={20} color="#6b7280" strokeWidth={2} />
              </View>
              <Text style={tw`text-lg font-bold text-gray-700`}>{expectedDays}</Text>
              <Text style={tw`text-xs text-gray-500`}>Expected</Text>
            </View>

            {/* Completed */}
            <View style={tw`flex-1 items-center`}>
              <View style={tw`w-12 h-12 rounded-xl bg-green-100 items-center justify-center mb-2`}>
                <Text style={tw`text-xl`}>✓</Text>
              </View>
              <Text style={tw`text-lg font-bold text-green-600`}>{completedDays}</Text>
              <Text style={tw`text-xs text-gray-500`}>Complete</Text>
            </View>

            {/* Missed */}
            <View style={tw`flex-1 items-center`}>
              <View style={tw`w-12 h-12 rounded-xl bg-red-100 items-center justify-center mb-2`}>
                <Text style={tw`text-xl`}>×</Text>
              </View>
              <Text style={[tw`text-lg font-bold`, actualMissedDays > 5 ? tw`text-red-600` : tw`text-amber-600`]}>{actualMissedDays}</Text>
              <Text style={tw`text-xs text-gray-500`}>Missed</Text>
            </View>

            {/* Days Left */}
            <View style={tw`flex-1 items-center`}>
              <View style={tw`w-12 h-12 rounded-xl bg-indigo-100 items-center justify-center mb-2`}>
                <Text style={tw`text-xl`}>📅</Text>
              </View>
              <Text style={tw`text-lg font-bold text-indigo-600`}>{daysRemaining}</Text>
              <Text style={tw`text-xs text-gray-500`}>Remaining</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Critical Warning */}
      {successProbability <= 20 && (
        <View style={tw`mx-5 mb-5 p-3 bg-red-100 rounded-xl border border-red-200`}>
          <View style={tw`flex-row items-start`}>
            <AlertTriangle size={16} color="#dc2626" style={tw`mr-2 mt-0.5`} />
            <View style={tw`flex-1`}>
              <Text style={tw`text-xs text-red-800 font-semibold mb-1`}>⚠️ Critical Alert</Text>
              <Text style={tw`text-xs text-red-700 leading-4`}>
                You've missed {actualMissedDays} days. Each missed day significantly reduces your chance of forming this habit. Take action today to get back on track!
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Success Celebration */}
      {successProbability >= 95 && (
        <View style={tw`mx-5 mb-5`}>
          <LinearGradient colors={['#10b981', '#059669']} style={tw`p-3 rounded-xl`}>
            <View style={tw`flex-row items-center`}>
              <View style={tw`w-8 h-8 bg-white/30 rounded-lg items-center justify-center mr-2`}>
                <TrendingUp size={18} color="#ffffff" strokeWidth={2.5} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-xs text-white font-semibold`}>Perfect Performance!</Text>
                <Text style={tw`text-xs text-white/90 mt-0.5`}>You're on track to achieve your goal!</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      )}
    </Animated.View>
  );
};

export default GoalBattery;
