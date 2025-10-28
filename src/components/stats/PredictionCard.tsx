// src/components/stats/PredictionCard.tsx
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Info, ChevronLeft, ChevronRight, Zap } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import tw from '@/lib/tailwind';
import { Habit } from '@/types';
import { calculatePrediction, getPredictionTheme } from '@/utils/predictionUtils';
import { Svg, Circle } from 'react-native-svg';

interface PredictionCardProps {
  habits: Habit[];
}

const PredictionCard: React.FC<PredictionCardProps> = ({ habits }) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedHabitIndex, setSelectedHabitIndex] = useState(0);
  const [showBufferInfo, setShowBufferInfo] = useState(false);

  if (!habits || !Array.isArray(habits)) return null;

  const validHabits = habits.filter((h) => {
    if (!h || !h.createdAt) return false;
    const totalDays = h.totalDays || (h as any).total_days;
    return !!totalDays;
  });

  if (validHabits.length === 0) {
    return (
      <View style={tw`bg-white rounded-2xl p-8 border border-stone-100`}>
        <View style={tw`items-center`}>
          <View style={tw`w-12 h-12 rounded-full bg-stone-50 items-center justify-center mb-3`}>
            <Target size={24} color="#9CA3AF" strokeWidth={1.5} />
          </View>
          <Text style={tw`text-stone-400 text-sm`}>No habits to track yet</Text>
        </View>
      </View>
    );
  }

  const validIndex = Math.min(selectedHabitIndex, validHabits.length - 1);
  const habit = validHabits[validIndex];
  if (!habit) return null;

  const prediction = calculatePrediction(habit);
  const theme = getPredictionTheme(prediction.status);

  const TrendIcon = prediction.trend === 'improving' ? TrendingUp : prediction.trend === 'declining' ? TrendingDown : Minus;

  return (
    <Animated.View entering={FadeIn.delay(100).duration(500)} key={selectedHabitIndex}>
      <View style={tw`bg-white rounded-2xl overflow-hidden border border-stone-100`}>
        {/* Header */}
        <View style={tw`px-6 pt-5 pb-4 border-b border-stone-50`}>
          <View style={tw`flex-row items-start justify-between mb-2`}>
            <View style={tw`flex-1`}>
              <Text style={tw`text-xs text-stone-400 uppercase tracking-wider mb-1`}>Success Prediction</Text>
              <Text style={tw`text-base font-semibold text-stone-900`}>{habit.name}</Text>
            </View>

            {/* Navigation */}
            {validHabits.length > 1 && (
              <View style={tw`flex-row items-center gap-1.5 ml-3`}>
                <Pressable
                  onPress={() => selectedHabitIndex > 0 && setSelectedHabitIndex(selectedHabitIndex - 1)}
                  disabled={selectedHabitIndex === 0}
                  style={tw`w-7 h-7 rounded-lg ${selectedHabitIndex === 0 ? 'bg-stone-50' : 'bg-stone-100'} items-center justify-center`}
                >
                  <ChevronLeft size={14} color={selectedHabitIndex === 0 ? '#D1D5DB' : '#57534E'} strokeWidth={2} />
                </Pressable>

                <Pressable
                  onPress={() => selectedHabitIndex < validHabits.length - 1 && setSelectedHabitIndex(selectedHabitIndex + 1)}
                  disabled={selectedHabitIndex === validHabits.length - 1}
                  style={tw`w-7 h-7 rounded-lg ${selectedHabitIndex === validHabits.length - 1 ? 'bg-stone-50' : 'bg-stone-100'} items-center justify-center`}
                >
                  <ChevronRight size={14} color={selectedHabitIndex === validHabits.length - 1 ? '#D1D5DB' : '#57534E'} strokeWidth={2} />
                </Pressable>
              </View>
            )}
          </View>

          {/* Pagination Dots */}
          {validHabits.length > 1 && (
            <View style={tw`flex-row items-center gap-1 mt-2`}>
              {validHabits.map((_, index) => (
                <View key={index} style={[tw`h-1 rounded-full`, index === selectedHabitIndex ? { width: 16, backgroundColor: theme.accent } : { width: 4, backgroundColor: '#E5E7EB' }]} />
              ))}
            </View>
          )}
        </View>

        {/* Main Content */}
        <View style={tw`px-6 py-6`}>
          {/* Circular Progress */}
          <View style={tw`items-center mb-6`}>
            <View style={tw`relative mb-4`}>
              <Svg width={140} height={140}>
                <Circle cx={70} cy={70} r={60} stroke="#F3F4F6" strokeWidth={12} fill="none" />
                <Circle
                  cx={70}
                  cy={70}
                  r={60}
                  stroke={theme.accent}
                  strokeWidth={12}
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 60}`}
                  strokeDashoffset={`${2 * Math.PI * 60 * (1 - prediction.successRate / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 70 70)"
                />
              </Svg>

              <View style={tw`absolute inset-0 items-center justify-center`}>
                <Text style={tw`text-4xl font-bold text-stone-900`}>{prediction.successRate}%</Text>
              </View>
            </View>

            {/* Status Badge */}
            <View style={tw`flex-row items-center gap-2 px-3 py-1.5 rounded-full bg-stone-50`}>
              <TrendIcon size={12} color={theme.accent} strokeWidth={2} />
              <Text style={tw`text-xs font-medium text-stone-700`}>{theme.label}</Text>
            </View>

            <Text style={tw`text-sm text-stone-500 mt-3 text-center max-w-xs`}>{theme.message}</Text>
          </View>

          {/* Stats Grid */}
          <View style={tw`flex-row border border-stone-100 rounded-xl overflow-hidden`}>
            <View style={tw`flex-1 p-4 items-center`}>
              <Text style={tw`text-2xl font-bold text-stone-900`}>{prediction.completedDays}</Text>
              <Text style={tw`text-xs text-stone-400 mt-1`}>Completed</Text>
            </View>

            <View style={tw`w-px bg-stone-100`} />

            <View style={tw`flex-1 p-4 items-center`}>
              <Text style={tw`text-2xl font-bold text-stone-900`}>{prediction.requiredDays}</Text>
              <Text style={tw`text-xs text-stone-400 mt-1`}>Required</Text>
            </View>

            <View style={tw`w-px bg-stone-100`} />

            <View style={tw`flex-1 p-4 items-center`}>
              <Text style={tw`text-2xl font-bold text-stone-900`}>{prediction.daysRemaining}</Text>
              <Text style={tw`text-xs text-stone-400 mt-1`}>Remaining</Text>
            </View>
          </View>

          {/* Expand Button */}
          <Pressable onPress={() => setExpanded(!expanded)} style={tw`mt-4 py-3 items-center justify-center rounded-lg bg-stone-50 flex-row gap-2`}>
            <Text style={tw`text-sm font-medium text-stone-600`}>{expanded ? 'Show Less' : 'View Details'}</Text>
            {expanded ? <ChevronUp size={16} color="#57534E" strokeWidth={2} /> : <ChevronDown size={16} color="#57534E" strokeWidth={2} />}
          </Pressable>
        </View>

        {/* Expandable Details */}
        {expanded && (
          <Animated.View entering={FadeIn.duration(300)}>
            <View style={tw`px-6 pb-6 pt-2 border-t border-stone-50`}>
              <View style={tw`gap-3`}>
                {/* Metrics */}
                <View style={tw`flex-row justify-between py-3 border-b border-stone-50`}>
                  <Text style={tw`text-sm text-stone-500`}>Predicted Completion</Text>
                  <Text style={tw`text-sm font-semibold text-stone-900`}>{prediction.predictedCompletion}%</Text>
                </View>

                <View style={tw`border-b border-stone-50`}>
                  <Pressable onPress={() => setShowBufferInfo(!showBufferInfo)} style={tw`flex-row justify-between items-center py-3`}>
                    <View style={tw`flex-row items-center gap-2`}>
                      <Text style={tw`text-sm text-stone-500`}>Safety Margin</Text>
                      <View style={tw`w-4 h-4 rounded-full bg-stone-100 items-center justify-center`}>
                        <Info size={10} color="#78716C" strokeWidth={2} />
                      </View>
                    </View>
                    <Text style={tw`text-sm font-semibold text-stone-900`}>
                      {prediction.bufferDays} {prediction.bufferDays === 1 ? 'day' : 'days'}
                    </Text>
                  </Pressable>

                  {showBufferInfo && (
                    <Animated.View entering={FadeIn.duration(200)} style={tw`pb-3 px-4`}>
                      <Text style={tw`text-xs text-stone-400 leading-relaxed`}>Days you can miss and still achieve 70% completion to succeed in your goal.</Text>
                    </Animated.View>
                  )}
                </View>

                <View style={tw`flex-row justify-between py-3 border-b border-stone-50`}>
                  <Text style={tw`text-sm text-stone-500`}>Can Still Succeed?</Text>
                  <Text style={tw`text-sm font-semibold ${prediction.canStillSucceed ? 'text-green-600' : 'text-red-600'}`}>{prediction.canStillSucceed ? 'Yes' : 'Challenging'}</Text>
                </View>

                {/* Suggested Pace - Improved Design */}
                <View style={tw`mt-3 rounded-xl overflow-hidden border-2`} style={{ borderColor: theme.accent }}>
                  <LinearGradient colors={[theme.backgroundGradient[0], '#FFFFFF']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
                    <View style={tw`p-5`}>
                      <View style={tw`flex-row items-center gap-2 mb-3`}>
                        <View style={[tw`w-8 h-8 rounded-lg items-center justify-center`, { backgroundColor: theme.accent }]}>
                          <Zap size={16} color="#FFFFFF" strokeWidth={2.5} fill="#FFFFFF" />
                        </View>
                        <Text style={tw`text-xs uppercase tracking-wider font-bold`} style={{ color: theme.accent }}>
                          Suggested Pace
                        </Text>
                      </View>
                      <Text style={tw`text-base font-semibold text-stone-900 leading-relaxed`}>{prediction.suggestedPace}</Text>
                    </View>
                  </LinearGradient>
                </View>

                {/* Progress Timeline */}
                <View style={tw`mt-2 p-4 bg-stone-50 rounded-xl`}>
                  <Text style={tw`text-xs text-stone-400 uppercase tracking-wider mb-3`}>Progress Timeline</Text>

                  <View style={tw`h-2 bg-white rounded-full overflow-hidden mb-3`}>
                    <View
                      style={[
                        tw`h-full rounded-full`,
                        {
                          width: `${(prediction.daysElapsed / prediction.totalDays) * 100}%`,
                          backgroundColor: theme.accent,
                        },
                      ]}
                    />
                  </View>

                  <View style={tw`flex-row justify-between items-center`}>
                    <Text style={tw`text-xs text-stone-400`}>Day 1</Text>
                    <View style={tw`px-2 py-1 rounded-md bg-stone-900`}>
                      <Text style={tw`text-xs font-medium text-white`}>Day {prediction.daysElapsed}</Text>
                    </View>
                    <Text style={tw`text-xs text-stone-400`}>Day {prediction.totalDays}</Text>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
};

export default PredictionCard;
