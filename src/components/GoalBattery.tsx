// src/components/GoalBattery.tsx
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, interpolate, Easing } from 'react-native-reanimated';
import Svg, { Path, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import tw from '../lib/tailwind';

interface GoalBatteryProps {
  totalDays: number;
  completedDays: number;
  missedDays: number;
  startDate: Date;
}

const GoalBattery: React.FC<GoalBatteryProps> = ({ totalDays, completedDays, missedDays, startDate }) => {
  const pulse = useSharedValue(0);

  // Calculate days since start
  const today = new Date();
  const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const expectedDays = Math.min(daysSinceStart, totalDays);

  // Calculate actual missed days (expected - completed)
  const actualMissedDays = Math.max(0, expectedDays - completedDays);

  // Calculate success probability based on missed days
  const missedRatio = actualMissedDays / totalDays;
  const successProbability = Math.max(0, 100 - missedRatio * 150); // More aggressive penalty

  // Determine battery level and color
  const getBatteryColor = () => {
    if (successProbability > 70) return '#10b981'; // Green
    if (successProbability > 40) return '#f59e0b'; // Orange
    if (successProbability > 20) return '#ef4444'; // Red
    return '#dc2626'; // Dark red
  };

  const getBatteryMessage = () => {
    if (successProbability > 80) return "You're on fire! Keep it up! 🔥";
    if (successProbability > 60) return 'Going strong! Stay consistent 💪';
    if (successProbability > 40) return 'Caution: Need more consistency ⚠️';
    if (successProbability > 20) return 'Critical: Your goal is at risk! 🚨';
    return 'Emergency: Take action now! 🆘';
  };

  const getEmoji = () => {
    if (successProbability > 80) return '🚀';
    if (successProbability > 60) return '⚡';
    if (successProbability > 40) return '🔋';
    if (successProbability > 20) return '🪫';
    return '💀';
  };

  useEffect(() => {
    // Pulse animation for low battery
    if (successProbability < 40) {
      pulse.value = withRepeat(withSequence(withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) })), -1, false);
    } else {
      pulse.value = 0;
    }
  }, [successProbability]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [1, 0.6]),
  }));

  const batteryColor = getBatteryColor();
  const batteryWidth = (successProbability / 100) * 100;

  return (
    <View style={tw`bg-white rounded-2xl p-5 shadow-sm`}>
      {/* Header */}
      <View style={tw`flex-row items-center justify-between mb-4`}>
        <View>
          <Text style={tw`text-lg font-bold text-slate-800`}>Goal Achievement Power</Text>
          <Text style={tw`text-sm text-slate-600 mt-1`}>{actualMissedDays === 0 ? 'Perfect streak!' : `${actualMissedDays} day${actualMissedDays === 1 ? '' : 's'} missed`}</Text>
        </View>
        <Text style={tw`text-3xl`}>{getEmoji()}</Text>
      </View>

      {/* Battery Visualization */}
      <View style={tw`items-center mb-4`}>
        <Animated.View style={[tw`w-full`, successProbability < 40 && animatedStyle]}>
          <Svg width="100%" height="80" viewBox="0 0 200 80">
            {/* Battery Body */}
            <Rect x="10" y="20" width="170" height="40" rx="8" fill="none" stroke="#e2e8f0" strokeWidth="3" />

            {/* Battery Terminal */}
            <Rect x="180" y="32" width="10" height="16" rx="2" fill="#e2e8f0" />

            {/* Battery Fill */}
            <Rect x="13" y="23" width={(batteryWidth / 100) * 164} height="34" rx="6" fill={batteryColor} opacity="0.9" />

            {/* Lightning Bolt for charging (if doing well) */}
            {successProbability > 70 && <Path d="M95 25 L85 40 L92 40 L82 55 L105 35 L95 35 Z" fill="white" opacity="0.9" />}

            {/* Warning icon for low battery */}
            {successProbability <= 40 && successProbability > 20 && <Path d="M90 30 L90 42 M90 48 L90 50" stroke="white" strokeWidth="3" strokeLinecap="round" />}

            {/* Critical icon for very low battery */}
            {successProbability <= 20 && <Path d="M85 35 L95 45 M95 35 L85 45" stroke="white" strokeWidth="3" strokeLinecap="round" />}
          </Svg>
        </Animated.View>

        {/* Percentage Display */}
        <View style={tw`mt-2`}>
          <Text style={[tw`text-3xl font-bold text-center`, { color: batteryColor }]}>{Math.round(successProbability)}%</Text>
          <Text style={tw`text-xs text-slate-600 text-center`}>Success Probability</Text>
        </View>
      </View>

      {/* Message */}
      <View style={[tw`p-3 rounded-xl`, successProbability > 70 ? tw`bg-green-50` : successProbability > 40 ? tw`bg-amber-50` : tw`bg-red-50`]}>
        <Text style={[tw`text-sm font-medium text-center`, successProbability > 70 ? tw`text-green-800` : successProbability > 40 ? tw`text-amber-800` : tw`text-red-800`]}>{getBatteryMessage()}</Text>
      </View>

      {/* Stats Grid */}
      <View style={tw`flex-row justify-between mt-4 pt-4 border-t border-slate-100`}>
        <View style={tw`items-center`}>
          <Text style={tw`text-lg font-bold text-slate-700`}>{expectedDays}</Text>
          <Text style={tw`text-xs text-slate-500`}>Days Expected</Text>
        </View>
        <View style={tw`items-center`}>
          <Text style={tw`text-lg font-bold text-teal-600`}>{completedDays}</Text>
          <Text style={tw`text-xs text-slate-500`}>Completed</Text>
        </View>
        <View style={tw`items-center`}>
          <Text style={[tw`text-lg font-bold`, actualMissedDays > 5 ? tw`text-red-600` : tw`text-amber-600`]}>{actualMissedDays}</Text>
          <Text style={tw`text-xs text-slate-500`}>Missed</Text>
        </View>
        <View style={tw`items-center`}>
          <Text style={tw`text-lg font-bold text-slate-700`}>{Math.max(0, totalDays - daysSinceStart)}</Text>
          <Text style={tw`text-xs text-slate-500`}>Days Left</Text>
        </View>
      </View>

      {/* Warning for critical levels */}
      {successProbability <= 20 && (
        <View style={tw`mt-3 p-3 bg-red-100 rounded-lg`}>
          <Text style={tw`text-xs text-red-800 font-medium text-center`}>
            ⚠️ You've missed {actualMissedDays} days. Each missed day significantly reduces your chance of forming this habit. Get back on track today!
          </Text>
        </View>
      )}
    </View>
  );
};

export default GoalBattery;
