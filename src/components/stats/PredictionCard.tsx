// src/components/stats/PredictionCard.tsx
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, TrendingUp, TrendingDown, ArrowRight, ChevronDown, ChevronUp, Info, ChevronLeft, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import tw from '@/lib/tailwind';
import { Habit } from '@/types';
import { calculatePrediction, getPredictionTheme } from '@/utils/predictionUtils';
import { Svg, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

interface PredictionCardProps {
  habits: Habit[];
}

const PredictionCard: React.FC<PredictionCardProps> = ({ habits }) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedHabitIndex, setSelectedHabitIndex] = useState(0);
  const [showBufferInfo, setShowBufferInfo] = useState(false);

  // Safety check
  if (!habits || !Array.isArray(habits)) {
    return null;
  }

  // Filter valid habits
  const validHabits = habits.filter((h) => {
    if (!h || !h.createdAt) return false;
    const totalDays = h.totalDays || (h as any).total_days;
    return !!totalDays;
  });

  if (validHabits.length === 0) {
    return (
      <View style={tw`bg-white rounded-3xl p-6 border border-stone-200`}>
        <View style={tw`items-center`}>
          <Target size={40} color="#9CA3AF" strokeWidth={1.5} />
          <Text style={tw`text-center text-stone-600 text-sm mt-3`}>No habits to predict yet</Text>
        </View>
      </View>
    );
  }

  const validIndex = Math.min(selectedHabitIndex, validHabits.length - 1);
  const habit = validHabits[validIndex];

  if (!habit) return null;

  const prediction = calculatePrediction(habit);
  const theme = getPredictionTheme(prediction.status);

  const TrendIcon = prediction.trend === 'improving' ? TrendingUp : prediction.trend === 'declining' ? TrendingDown : ArrowRight;

  // Get darker border color based on theme
  const borderColor = prediction.status === 'excellent' ? '#047857' : prediction.status === 'onTrack' ? '#1d4ed8' : prediction.status === 'needsFocus' ? '#4c1d95' : '#991b1b';

  const goToPrevious = () => {
    if (selectedHabitIndex > 0) {
      setSelectedHabitIndex(selectedHabitIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedHabitIndex < validHabits.length - 1) {
      setSelectedHabitIndex(selectedHabitIndex + 1);
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(100).duration(400)} key={selectedHabitIndex}>
      <View style={[tw`rounded-3xl overflow-hidden shadow-lg`, { borderWidth: 2.5, borderColor: borderColor }]}>
        <LinearGradient colors={[theme.backgroundGradient[0], theme.backgroundGradient[1], '#FFFFFF']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
          {/* Header */}
          <View style={tw`px-5 pt-4 pb-3 flex-row items-center justify-between`}>
            <View style={tw`flex-1`}>
              <View style={tw`flex-row items-center gap-2 mb-0.5`}>
                <Target size={16} color={theme.accent} strokeWidth={2.5} />
                <Text style={tw`text-sm font-bold text-stone-800`}>Success Prediction</Text>
              </View>
              <Text style={tw`text-xs text-stone-500 font-medium`}>{habit.name}</Text>
            </View>

            {/* Navigation Arrows */}
            {validHabits.length > 1 && (
              <View style={tw`flex-row items-center gap-2 mr-2`}>
                <Pressable
                  onPress={goToPrevious}
                  disabled={selectedHabitIndex === 0}
                  style={tw`w-8 h-8 rounded-full ${selectedHabitIndex === 0 ? 'bg-stone-200' : 'bg-white'} items-center justify-center shadow-sm`}
                >
                  <ChevronLeft size={16} color={selectedHabitIndex === 0 ? '#9CA3AF' : theme.accent} strokeWidth={2.5} />
                </Pressable>

                <Pressable
                  onPress={goToNext}
                  disabled={selectedHabitIndex === validHabits.length - 1}
                  style={tw`w-8 h-8 rounded-full ${selectedHabitIndex === validHabits.length - 1 ? 'bg-stone-200' : 'bg-white'} items-center justify-center shadow-sm`}
                >
                  <ChevronRight size={16} color={selectedHabitIndex === validHabits.length - 1 ? '#9CA3AF' : theme.accent} strokeWidth={2.5} />
                </Pressable>
              </View>
            )}

            <Pressable onPress={() => setExpanded(!expanded)} style={tw`w-8 h-8 rounded-full bg-white items-center justify-center shadow-sm`}>
              {expanded ? <ChevronUp size={14} color={theme.accent} strokeWidth={2.5} /> : <ChevronDown size={14} color={theme.accent} strokeWidth={2.5} />}
            </Pressable>
          </View>

          {/* Main Content */}
          <View style={tw`px-5 pb-4`}>
            {/* Circular Progress with Gradient */}
            <View style={tw`items-center mb-4`}>
              <View style={tw`relative`}>
                <Svg width={120} height={120}>
                  <Defs>
                    <SvgLinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor={theme.gradient[0]} stopOpacity="1" />
                      <Stop offset="50%" stopColor={theme.gradient[1]} stopOpacity="1" />
                      <Stop offset="100%" stopColor={theme.gradient[2]} stopOpacity="1" />
                    </SvgLinearGradient>
                  </Defs>

                  {/* Background circle */}
                  <Circle cx={60} cy={60} r={52} stroke="#F3F4F6" strokeWidth={8} fill="none" />

                  {/* Progress circle with gradient */}
                  <Circle
                    cx={60}
                    cy={60}
                    r={52}
                    stroke="url(#progressGradient)"
                    strokeWidth={8}
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    strokeDashoffset={`${2 * Math.PI * 52 * (1 - prediction.successRate / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />

                  {/* Inner glow circle */}
                  <Circle
                    cx={60}
                    cy={60}
                    r={52}
                    stroke={theme.accent}
                    strokeWidth={2}
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    strokeDashoffset={`${2 * Math.PI * 52 * (1 - prediction.successRate / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    opacity={0.3}
                  />
                </Svg>

                <View style={tw`absolute inset-0 items-center justify-center`}>
                  <Text style={tw`text-3xl font-black text-stone-900`}>{prediction.successRate}%</Text>
                </View>
              </View>

              {/* Status Badge */}
              <View style={tw`mt-3 flex-row items-center justify-center gap-1 bg-white/90 px-3 py-1.5 rounded-full shadow-sm`}>
                <TrendIcon size={11} color={theme.accent} strokeWidth={2.5} />
                <Text style={tw`text-xs font-bold text-stone-700`}>{theme.label}</Text>
              </View>

              {/* Message */}
              <Text style={tw`text-sm text-stone-600 mt-2 text-center font-semibold`}>{theme.message}</Text>
            </View>

            {/* Stats Grid */}
            <View style={tw`bg-white/70 rounded-2xl p-3 mb-3 shadow-sm`}>
              <View style={tw`flex-row items-center justify-around`}>
                <View style={tw`items-center flex-1`}>
                  <Text style={tw`text-xl font-black text-stone-900`}>{prediction.completedDays}</Text>
                  <Text style={tw`text-xs text-stone-500 mt-0.5 font-semibold`}>Completed</Text>
                </View>

                <View style={tw`w-px h-8 bg-stone-300`} />

                <View style={tw`items-center flex-1`}>
                  <Text style={tw`text-xl font-black text-stone-900`}>{prediction.requiredDays}</Text>
                  <Text style={tw`text-xs text-stone-500 mt-0.5 font-semibold`}>Required</Text>
                </View>

                <View style={tw`w-px h-8 bg-stone-300`} />

                <View style={tw`items-center flex-1`}>
                  <Text style={tw`text-xl font-black text-stone-900`}>{prediction.daysRemaining}</Text>
                  <Text style={tw`text-xs text-stone-500 mt-0.5 font-semibold`}>Remaining</Text>
                </View>
              </View>
            </View>

            {/* Pagination Dots - Visual indicator only */}
            {validHabits.length > 1 && (
              <View style={tw`flex-row items-center justify-center gap-1.5`}>
                {validHabits.map((_, index) => (
                  <View key={index} style={[tw`h-1.5 rounded-full`, index === selectedHabitIndex ? { width: 20, backgroundColor: theme.accent } : { width: 5, backgroundColor: '#D1D5DB' }]} />
                ))}
              </View>
            )}
          </View>

          {/* Expandable Details */}
          {expanded && (
            <Animated.View entering={FadeInUp.duration(400)} exiting={FadeInDown.duration(400)}>
              <View style={tw`px-5 pb-4 border-t border-stone-200/50`}>
                <View style={tw`pt-4 gap-3`}>
                  {/* Metrics Cards */}
                  <View style={tw`gap-2.5`}>
                    {/* Predicted Completion */}
                    <View style={tw`bg-white rounded-xl p-3 shadow-sm flex-row items-center justify-between`}>
                      <Text style={tw`text-sm text-stone-600 font-semibold`}>Predicted Completion</Text>
                      <Text style={tw`text-base font-black text-stone-900`}>{prediction.predictedCompletion}%</Text>
                    </View>

                    {/* Safety Margin with Info */}
                    <View style={tw`bg-white rounded-xl shadow-sm overflow-hidden`}>
                      <View style={tw`p-3 flex-row items-center justify-between`}>
                        <View style={tw`flex-row items-center gap-2`}>
                          <Text style={tw`text-sm text-stone-600 font-semibold`}>Safety Margin</Text>
                          <Pressable onPress={() => setShowBufferInfo(!showBufferInfo)} style={tw`w-4.5 h-4.5 rounded-full bg-stone-200 items-center justify-center`}>
                            <Info size={11} color="#6B7280" strokeWidth={2.5} />
                          </Pressable>
                        </View>
                        <Text style={tw`text-base font-black text-stone-900`}>
                          {prediction.bufferDays} {prediction.bufferDays === 1 ? 'day' : 'days'}
                        </Text>
                      </View>

                      {/* Info Tooltip */}
                      {showBufferInfo && (
                        <Animated.View entering={FadeInUp.duration(300)} style={tw`bg-stone-100 px-3 pb-3 pt-1.5`}>
                          <Text style={tw`text-xs text-stone-700 leading-relaxed font-medium`}>Days you can miss and still achieve 70% completion to succeed in your goal.</Text>
                        </Animated.View>
                      )}
                    </View>

                    {/* Can Still Succeed */}
                    <View style={tw`bg-white rounded-xl p-3 shadow-sm flex-row items-center justify-between`}>
                      <Text style={tw`text-sm text-stone-600 font-semibold`}>Can Still Succeed?</Text>
                      <Text style={tw`text-base font-black ${prediction.canStillSucceed ? 'text-green-600' : 'text-red-600'}`}>{prediction.canStillSucceed ? 'Yes ✓' : 'Challenging'}</Text>
                    </View>
                  </View>

                  {/* Suggested Pace - Lighter Topaz with Border */}
                  <View style={[tw`rounded-2xl overflow-hidden shadow-sm`, { borderWidth: 2.5, borderColor: '#d97706' }]}>
                    <LinearGradient colors={['#fef3c7', '#fde68a', '#fcd34d']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`p-3`}>
                      <Text style={tw`text-xs font-black text-amber-700 mb-1.5 uppercase tracking-wider`}>Suggested Pace</Text>
                      <Text style={tw`text-sm font-black text-amber-800`}>{prediction.suggestedPace}</Text>
                    </LinearGradient>
                  </View>

                  {/* Progress Timeline - Enhanced */}
                  <View style={tw`bg-white rounded-xl p-3 shadow-sm`}>
                    <Text style={tw`text-xs font-black text-stone-700 mb-2.5 uppercase tracking-wider`}>Progress Timeline</Text>
                    <View style={tw`h-2.5 bg-stone-200 rounded-full overflow-hidden mb-2.5 shadow-inner`}>
                      <LinearGradient
                        colors={[theme.gradient[0], theme.gradient[1], theme.gradient[2]]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                          width: `${(prediction.daysElapsed / prediction.totalDays) * 100}%`,
                          height: '100%',
                        }}
                      />
                    </View>
                    <View style={tw`flex-row justify-between items-center`}>
                      <Text style={tw`text-xs text-stone-500 font-semibold`}>Day 1</Text>
                      <View style={tw`bg-stone-900 px-2 py-0.5 rounded-full`}>
                        <Text style={tw`text-xs font-black text-white`}>Day {prediction.daysElapsed}</Text>
                      </View>
                      <Text style={tw`text-xs text-stone-500 font-semibold`}>Day {prediction.totalDays}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}
        </LinearGradient>
      </View>
    </Animated.View>
  );
};

export default PredictionCard;
