// src/components/GoalBattery.tsx
import React, { useEffect, createElement } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, interpolate, Easing, FadeIn, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Battery, TrendingUp, AlertTriangle, Zap, Target, Calendar, CheckCircle2, XCircle, Rocket, BatteryWarning, AlertOctagon, Trophy, Flame, Shield, Clock, ChevronUp } from 'lucide-react-native';
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
  const iconScale = useSharedValue(1);

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
    if (successProbability > 80) return Rocket;
    if (successProbability > 60) return Zap;
    if (successProbability > 40) return Battery;
    if (successProbability > 20) return BatteryWarning;
    return AlertOctagon;
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
      // Celebrate with icon animation
      iconScale.value = withRepeat(withSequence(withSpring(1.2, { damping: 10 }), withSpring(1, { damping: 10 })), -1, false);
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

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const batteryColors = getBatteryColor();
  const status = getMotivationalMessage();
  const StatusIcon = getStatusIcon();

  return (
    <Animated.View entering={FadeIn.duration(400)} style={tw`bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100`}>
      {/* Modern Header with Gradient */}
      <LinearGradient colors={[batteryColors[0] + '15', batteryColors[0] + '08']} style={tw`px-6 pt-6 pb-4`}>
        <View style={tw`flex-row items-center justify-between`}>
          <View style={tw`flex-1`}>
            <Text style={tw`text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1`}>Goal Progress</Text>
            <Text style={tw`text-xl font-bold text-gray-900`}>{habitName || 'Daily Achievement'}</Text>
            {habitType && (
              <View style={tw`flex-row items-center mt-2`}>
                <View style={[tw`px-2 py-1 rounded-full flex-row items-center`, { backgroundColor: batteryColors[0] + '20' }]}>
                  <Shield size={12} color={batteryColors[0]} strokeWidth={2.5} />
                  <Text style={[tw`text-xs font-medium ml-1`, { color: batteryColors[0] }]}>{habitType === 'good' ? 'Building' : 'Quitting'}</Text>
                </View>
              </View>
            )}
          </View>
          <Animated.View style={iconAnimatedStyle}>
            <View style={[tw`w-16 h-16 rounded-2xl items-center justify-center`, { backgroundColor: batteryColors[0] + '20' }]}>
              {createElement(StatusIcon, {
                size: 32,
                color: batteryColors[0],
                strokeWidth: 2,
              })}
            </View>
          </Animated.View>
        </View>

        {/* Current Day Badge */}
        <View style={tw`mt-4`}>
          <View style={tw`bg-white/80 rounded-xl px-3 py-2 self-start`}>
            <View style={tw`flex-row items-center`}>
              <Clock size={14} color={batteryColors[0]} strokeWidth={2.5} />
              <Text style={tw`text-sm font-semibold text-gray-900 ml-2`}>
                Day {daysSinceStart + 1} of {totalDays}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Enhanced Battery Visualization */}
      <View style={tw`px-6 py-6`}>
        <Animated.View style={[successProbability < 40 && animatedContainerStyle]}>
          <View style={tw`relative`}>
            {/* Glow effect for high performance */}
            {successProbability > 80 && (
              <Animated.View
                style={[
                  tw`absolute -inset-2 rounded-3xl`,
                  glowStyle,
                  {
                    backgroundColor: batteryColors[0] + '30',
                    // Remove blur effect as it's not supported in React Native
                  },
                ]}
              />
            )}

            {/* Modern Battery Container */}
            <View style={tw`bg-gray-50 rounded-2xl h-24 relative overflow-hidden border border-gray-200`}>
              {/* Subtle grid pattern */}
              <View style={tw`absolute inset-0 opacity-5`}>
                {[...Array(10)].map((_, i) => (
                  <View key={i} style={[tw`absolute h-full w-px bg-gray-600`, { left: `${(i + 1) * 10}%` }]} />
                ))}
              </View>

              {/* Battery Fill with gradient and animation */}
              <Animated.View style={[tw`absolute inset-y-0 left-0`, animatedFillStyle]}>
                <LinearGradient colors={batteryColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`h-full`}>
                  {/* Animated pattern overlay */}
                  <View style={tw`absolute inset-0 opacity-20`}>
                    {successProbability > 70 && (
                      <View style={tw`flex-row items-center justify-end h-full pr-4`}>
                        <Zap size={32} color="#ffffff" fill="#ffffff" strokeWidth={1} />
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </Animated.View>

              {/* Center Content with better typography */}
              <View style={tw`absolute inset-0 items-center justify-center`}>
                <View style={tw`items-center`}>
                  <Text style={tw`text-4xl font-bold text-gray-900`}>{Math.round(successProbability)}%</Text>
                  <Text style={tw`text-xs font-medium text-gray-600 uppercase tracking-wider mt-1`}>Success Rate</Text>
                </View>
              </View>

              {/* Status indicator on right side */}
              {successProbability <= 40 && successProbability > 20 && (
                <View style={tw`absolute right-4 top-1/2 -translate-y-1/2`}>
                  <View style={tw`w-10 h-10 bg-amber-500/20 rounded-xl items-center justify-center`}>
                    <AlertTriangle size={24} color="#f59e0b" strokeWidth={2.5} />
                  </View>
                </View>
              )}

              {successProbability <= 20 && (
                <View style={tw`absolute right-4 top-1/2 -translate-y-1/2`}>
                  <View style={tw`w-10 h-10 bg-red-500/20 rounded-xl items-center justify-center`}>
                    <AlertOctagon size={24} color="#ef4444" strokeWidth={2.5} />
                  </View>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Modern Status Message Card */}
        <View
          style={[
            tw`mt-6 p-4 rounded-2xl border`,
            status.tone === 'success'
              ? tw`bg-green-50 border-green-200`
              : status.tone === 'info'
              ? tw`bg-blue-50 border-blue-200`
              : status.tone === 'warning'
              ? tw`bg-amber-50 border-amber-200`
              : status.tone === 'danger'
              ? tw`bg-red-50 border-red-200`
              : tw`bg-red-100 border-red-300`,
          ]}
        >
          <View style={tw`flex-row items-start`}>
            <View
              style={[
                tw`w-10 h-10 rounded-xl items-center justify-center mr-3`,
                status.tone === 'success' ? tw`bg-green-500/20` : status.tone === 'info' ? tw`bg-blue-500/20` : status.tone === 'warning' ? tw`bg-amber-500/20` : tw`bg-red-500/20`,
              ]}
            >
              {status.tone === 'success' && <Trophy size={20} color="#10b981" strokeWidth={2.5} />}
              {status.tone === 'info' && <TrendingUp size={20} color="#3b82f6" strokeWidth={2.5} />}
              {status.tone === 'warning' && <AlertTriangle size={20} color="#f59e0b" strokeWidth={2.5} />}
              {(status.tone === 'danger' || status.tone === 'critical') && <AlertOctagon size={20} color="#ef4444" strokeWidth={2.5} />}
            </View>
            <View style={tw`flex-1`}>
              <Text
                style={[
                  tw`text-sm font-bold mb-1`,
                  status.tone === 'success' ? tw`text-green-900` : status.tone === 'info' ? tw`text-blue-900` : status.tone === 'warning' ? tw`text-amber-900` : tw`text-red-900`,
                ]}
              >
                {status.title}
              </Text>
              <Text
                style={[
                  tw`text-xs leading-relaxed`,
                  status.tone === 'success' ? tw`text-green-700` : status.tone === 'info' ? tw`text-blue-700` : status.tone === 'warning' ? tw`text-amber-700` : tw`text-red-700`,
                ]}
              >
                {status.message}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Modern Stats Grid with Icons */}
      <View style={tw`px-6 pb-6`}>
        <View style={tw`bg-gray-50 rounded-2xl p-4 border border-gray-100`}>
          <View style={tw`flex-row`}>
            {/* Days Expected */}
            <View style={tw`flex-1 items-center`}>
              <View style={tw`w-14 h-14 rounded-2xl bg-white border border-gray-200 items-center justify-center mb-2`}>
                <Target size={24} color="#6b7280" strokeWidth={2} />
              </View>
              <Text style={tw`text-xl font-bold text-gray-900`}>{expectedDays}</Text>
              <Text style={tw`text-xs text-gray-500 font-medium`}>Expected</Text>
            </View>

            {/* Completed */}
            <View style={tw`flex-1 items-center`}>
              <View style={tw`w-14 h-14 rounded-2xl bg-green-50 border border-green-200 items-center justify-center mb-2`}>
                <CheckCircle2 size={24} color="#10b981" strokeWidth={2} />
              </View>
              <Text style={tw`text-xl font-bold text-green-600`}>{completedDays}</Text>
              <Text style={tw`text-xs text-gray-500 font-medium`}>Complete</Text>
            </View>

            {/* Missed */}
            <View style={tw`flex-1 items-center`}>
              <View style={tw`w-14 h-14 rounded-2xl bg-red-50 border border-red-200 items-center justify-center mb-2`}>
                <XCircle size={24} color="#ef4444" strokeWidth={2} />
              </View>
              <Text style={[tw`text-xl font-bold`, actualMissedDays > 5 ? tw`text-red-600` : tw`text-amber-600`]}>{actualMissedDays}</Text>
              <Text style={tw`text-xs text-gray-500 font-medium`}>Missed</Text>
            </View>

            {/* Days Left */}
            <View style={tw`flex-1 items-center`}>
              <View style={tw`w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 items-center justify-center mb-2`}>
                <Calendar size={24} color="#6366f1" strokeWidth={2} />
              </View>
              <Text style={tw`text-xl font-bold text-indigo-600`}>{daysRemaining}</Text>
              <Text style={tw`text-xs text-gray-500 font-medium`}>Remaining</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Critical Warning with better design */}
      {successProbability <= 20 && (
        <View style={tw`mx-6 mb-6`}>
          <View style={tw`bg-red-50 rounded-2xl p-4 border border-red-200`}>
            <View style={tw`flex-row items-start`}>
              <View style={tw`w-10 h-10 bg-red-500/20 rounded-xl items-center justify-center mr-3`}>
                <AlertOctagon size={20} color="#dc2626" strokeWidth={2.5} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-sm font-bold text-red-900 mb-1`}>Critical Alert</Text>
                <Text style={tw`text-xs text-red-700 leading-5`}>
                  You've missed {actualMissedDays} days. Each missed day significantly reduces your chance of forming this habit. Take action today to get back on track!
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Success Celebration with better design */}
      {successProbability >= 95 && (
        <View style={tw`mx-6 mb-6`}>
          <LinearGradient colors={['#10b981', '#059669']} style={tw`rounded-2xl p-4`}>
            <View style={tw`flex-row items-center`}>
              <View style={tw`w-10 h-10 bg-white/20 rounded-xl items-center justify-center mr-3`}>
                <Trophy size={20} color="#ffffff" strokeWidth={2.5} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-sm font-bold text-white mb-0.5`}>Perfect Performance!</Text>
                <Text style={tw`text-xs text-white/90 leading-4`}>You're on track to achieve your goal! Keep up the amazing work.</Text>
              </View>
              <Animated.View style={iconAnimatedStyle}>
                <ChevronUp size={24} color="#ffffff" strokeWidth={2.5} />
              </Animated.View>
            </View>
          </LinearGradient>
        </View>
      )}
    </Animated.View>
  );
};

export default GoalBattery;
