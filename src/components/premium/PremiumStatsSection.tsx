// src/components/premium/PremiumStatsSection.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart3, Calendar, TrendingUp, X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { format, subDays, addDays } from 'date-fns';
import { calculateAnalyticsData, calculateSummaryStats } from '@/utils/analyticsData';

type TimeRange = 'week' | 'month';
type ViewMode = 'trend' | 'heatmap' | 'summary';

interface PremiumStatsSectionProps {
  habits: any[];
  selectedRange?: TimeRange;
  onRangeChange?: (range: TimeRange) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PremiumStatsSection: React.FC<PremiumStatsSectionProps> = ({ habits, selectedRange: externalRange, onRangeChange }) => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>(externalRange || 'week');
  const [viewMode, setViewMode] = useState<ViewMode>('trend');
  const [selectedDataPoint, setSelectedDataPoint] = useState<{
    index: number;
    value: number;
    date: string;
    habits: string[];
    completedTasks: number;
    totalTasks: number;
  } | null>(null);

  const handleRangeChange = (range: TimeRange) => {
    setSelectedRange(range);
    setSelectedDataPoint(null);
    onRangeChange?.(range);
  };

  const timeRanges: { value: TimeRange; label: string }[] = [
    { value: 'week', label: '7 Days' },
    { value: 'month', label: '30 Days' },
  ];

  const viewModes: { value: ViewMode; label: string; icon: any }[] = [
    { value: 'trend', label: 'Trend', icon: TrendingUp },
    { value: 'heatmap', label: 'Heatmap', icon: Calendar },
    { value: 'summary', label: 'Summary', icon: BarChart3 },
  ];

  // Generate chart data based on selected range - USE REAL DATA
  const chartData = React.useMemo(() => calculateAnalyticsData(habits, selectedRange), [habits, selectedRange]);
  const maxValue = Math.max(...chartData.map((d) => d.value), 1);

  // Calculate summary statistics
  const summaryStats = React.useMemo(() => calculateSummaryStats(habits, selectedRange), [habits, selectedRange]);

  // Generate week view for heatmap - USE REAL DATA
  const generateWeekData = () => {
    const weeks = selectedRange === 'week' ? 1 : 4;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = format(today, 'yyyy-MM-dd');
    const startDate = subDays(today, weeks * 7 - 1);

    return Array.from({ length: weeks }, (_, weekIndex) => {
      return Array.from({ length: 7 }, (_, dayIndex) => {
        const date = addDays(startDate, weekIndex * 7 + dayIndex);
        const dateString = format(date, 'yyyy-MM-dd');

        // Calculate real completion for this date
        let totalTasks = 0;
        let completedTasks = 0;
        const activeHabits: string[] = [];

        habits.forEach((habit) => {
          const habitTotalTasks = habit.tasks?.length || 0;
          totalTasks += habitTotalTasks;

          const dayTasks = habit.dailyTasks?.[dateString];
          if (dayTasks) {
            const completed = dayTasks.completedTasks?.length || 0;
            completedTasks += completed;
            if (completed > 0) {
              activeHabits.push(habit.name);
            }
          }
        });

        const value = totalTasks > 0 ? completedTasks / totalTasks : 0;

        return {
          date: format(date, 'MMM d'),
          fullDate: format(date, 'EEEE, MMM d'),
          dayName: format(date, 'EEE'),
          value,
          completed: value === 1,
          partial: value > 0 && value < 1,
          tasks: { completed: completedTasks, total: totalTasks },
          isToday: dateString === todayString,
        };
      });
    });
  };

  const heatmapData = React.useMemo(() => generateWeekData(), [habits, selectedRange]);
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleBarPress = (index: number) => {
    const data = chartData[index];
    setSelectedDataPoint({
      index,
      value: data.value,
      date: data.fullDate,
      habits: data.habits,
      completedTasks: data.completedTasks,
      totalTasks: data.totalTasks,
    });
  };

  const handleHeatmapPress = (weekIndex: number, dayIndex: number) => {
    const data = heatmapData[weekIndex][dayIndex];
    const habits = data.completed ? ['Completed all tasks'] : data.partial ? ['Partial completion'] : ['No tasks completed'];

    setSelectedDataPoint({
      index: weekIndex * 7 + dayIndex,
      value: Math.round(data.value * 100),
      date: data.fullDate,
      habits,
      completedTasks: data.tasks.completed,
      totalTasks: data.tasks.total,
    });
  };

  const navigateDataPoint = (direction: 'prev' | 'next') => {
    if (!selectedDataPoint) {
      if (direction === 'next' && chartData.length > 0) {
        handleBarPress(0);
      } else if (direction === 'prev' && chartData.length > 0) {
        handleBarPress(chartData.length - 1);
      }
      return;
    }

    const currentIndex = selectedDataPoint.index;
    const maxIndex = viewMode === 'heatmap' ? heatmapData.length * 7 - 1 : chartData.length - 1;

    if (direction === 'prev' && currentIndex > 0) {
      if (viewMode === 'heatmap') {
        const weekIndex = Math.floor((currentIndex - 1) / 7);
        const dayIndex = (currentIndex - 1) % 7;
        handleHeatmapPress(weekIndex, dayIndex);
      } else {
        handleBarPress(currentIndex - 1);
      }
    } else if (direction === 'next' && currentIndex < maxIndex) {
      if (viewMode === 'heatmap') {
        const weekIndex = Math.floor((currentIndex + 1) / 7);
        const dayIndex = (currentIndex + 1) % 7;
        handleHeatmapPress(weekIndex, dayIndex);
      } else {
        handleBarPress(currentIndex + 1);
      }
    }
  };

  return (
    <View
      style={[
        tw`rounded-3xl overflow-hidden bg-white`,
        {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 4,
        },
      ]}
    >
      {/* Header with Title and Time Range Selector */}
      <View style={tw`p-6 pb-4`}>
        <View style={tw`flex-row items-center justify-between mb-5`}>
          {/* Time Range Pills */}
          <View style={tw`flex-row gap-2`}>
            {timeRanges.map((range) => (
              <TouchableOpacity key={range.value} onPress={() => handleRangeChange(range.value)} activeOpacity={0.7}>
                <View style={[tw`px-3.5 py-1.5 rounded-full`, selectedRange === range.value ? tw`bg-stone-700` : tw`bg-sand-100`]}>
                  <Text style={[tw`text-xs font-semibold`, selectedRange === range.value ? tw`text-white` : tw`text-sand-700`]}>{range.label}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* View Mode Tabs */}
        <View style={tw`flex-row gap-2`}>
          {viewModes.map((mode) => {
            const Icon = mode.icon;
            const isActive = viewMode === mode.value;

            return (
              <TouchableOpacity
                key={mode.value}
                onPress={() => {
                  setViewMode(mode.value);
                  setSelectedDataPoint(null);
                }}
                activeOpacity={0.7}
                style={tw`flex-1`}
              >
                <View style={[tw`flex-row items-center justify-center gap-2 py-3 rounded-xl`, isActive ? tw`bg-sand-100` : tw`bg-transparent`]}>
                  <Icon size={16} color={isActive ? '#726454' : '#d6cec1'} />
                  <Text style={[tw`text-xs font-semibold`, isActive ? tw`text-sand-700` : tw`text-sand-400`]}>{mode.label}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Chart Area - Fixed height to prevent movement */}
      <View style={tw`px-6 pb-6`}>
        {/* Navigation Arrows - Minimalist Design */}
        {(viewMode === 'trend' || viewMode === 'heatmap') && selectedDataPoint && (
          <View style={tw`flex-row items-center justify-between mb-3`}>
            <TouchableOpacity
              onPress={() => navigateDataPoint('prev')}
              activeOpacity={0.7}
              disabled={selectedDataPoint?.index === 0}
              style={[tw`p-2 rounded-lg`, selectedDataPoint?.index === 0 && tw`opacity-30`]}
            >
              <ChevronLeft size={20} color="#57534e" strokeWidth={2.5} />
            </TouchableOpacity>

            <View style={tw`px-3 py-1 rounded-lg bg-sand-100`}>
              <Text style={tw`text-xs font-medium text-sand-700`}>
                {selectedDataPoint.index + 1} / {viewMode === 'heatmap' ? heatmapData.length * 7 : chartData.length}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => navigateDataPoint('next')}
              activeOpacity={0.7}
              disabled={selectedDataPoint?.index === (viewMode === 'heatmap' ? heatmapData.length * 7 - 1 : chartData.length - 1)}
              style={[tw`p-2 rounded-lg`, selectedDataPoint?.index === (viewMode === 'heatmap' ? heatmapData.length * 7 - 1 : chartData.length - 1) && tw`opacity-30`]}
            >
              <ChevronRight size={20} color="#57534e" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        )}

        {viewMode === 'trend' && (
          <View style={tw`bg-sand-50 rounded-2xl p-5`}>
            {/* Bar Chart with fixed height */}
            <View style={tw`flex-row items-end justify-between h-40 mb-3`}>
              {chartData.map((data, index) => {
                const isSelected = selectedDataPoint?.index === index;
                const hasData = data.totalTasks > 0;
                const barHeight = hasData ? (data.value / maxValue) * 100 : 0;
                const isToday = index === chartData.length - 1;

                return (
                  <TouchableOpacity key={index} onPress={() => handleBarPress(index)} activeOpacity={0.7} style={tw`flex-1 items-center justify-end mx-0.5`}>
                    {/* Selected day indicator - Amber border (same as today) */}
                    {isSelected && (
                      <View
                        style={[
                          tw`absolute bottom-0 w-full rounded-t-lg border-2 border-amber-600`,
                          {
                            height: hasData ? `${Math.max(barHeight, 5)}%` : '15%',
                            borderBottomWidth: 0,
                          },
                        ]}
                      />
                    )}

                    {/* Today indicator ring */}
                    {isToday && !isSelected && (
                      <View
                        style={[
                          tw`absolute bottom-0 w-full rounded-t-md border-2 border-amber-500`,
                          {
                            height: hasData ? `${Math.max(barHeight, 5)}%` : '15%',
                            borderBottomWidth: 0,
                            opacity: 0.6,
                          },
                        ]}
                      />
                    )}

                    {/* Background placeholder for no data */}
                    {!hasData && (
                      <View
                        style={[
                          tw`w-full rounded-t-md`,
                          {
                            height: '15%',
                            backgroundColor: isToday ? '#fbbf24' : '#e7e5e4',
                            opacity: isToday ? 0.2 : 0.3,
                          },
                        ]}
                      />
                    )}

                    {/* Actual data bar */}
                    {hasData && (
                      <View
                        style={[
                          tw`w-full rounded-t-md`,
                          {
                            height: `${Math.max(barHeight, 5)}%`,
                            backgroundColor: data.value > 70 ? '#57534e' : data.value > 40 ? '#78716c' : '#d6cec1',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: isSelected ? 0.15 : 0,
                            shadowRadius: 4,
                          },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* X-axis with dates */}
            {selectedRange === 'week' && (
              <View style={tw`flex-row justify-between px-1`}>
                {chartData.map((data, idx) => {
                  const isToday = idx === chartData.length - 1;
                  const isSelected = selectedDataPoint?.index === idx;
                  return (
                    <Text key={idx} style={[tw`text-xs flex-1 text-center`, isSelected ? tw`text-sand-700 font-bold` : isToday ? tw`text-amber-600 font-semibold` : tw`text-sand-600`]}>
                      {data.date.split(' ')[1]}
                    </Text>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {viewMode === 'heatmap' && (
          <View style={tw`bg-sand-50 rounded-2xl p-5`}>
            {/* Day labels header */}
            <View style={tw`flex-row mb-3 ml-8`}>
              {dayLabels.map((day, idx) => (
                <View key={idx} style={tw`flex-1 items-center`}>
                  <Text style={tw`text-xs font-semibold text-sand-700`}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Heatmap Grid with week labels */}
            {heatmapData.map((week, weekIndex) => (
              <View key={weekIndex} style={tw`flex-row mb-2.5`}>
                {/* Week label */}
                <View style={tw`w-8 justify-center mr-2`}>
                  <Text style={tw`text-xs text-sand-600`}>W{weekIndex + 1}</Text>
                </View>

                {/* Days */}
                <View style={tw`flex-1 flex-row gap-2`}>
                  {week.map((day, dayIndex) => {
                    const isSelected = selectedDataPoint?.index === weekIndex * 7 + dayIndex;

                    return (
                      <TouchableOpacity key={dayIndex} onPress={() => handleHeatmapPress(weekIndex, dayIndex)} activeOpacity={0.7} style={tw`flex-1`}>
                        <View
                          style={[
                            tw`aspect-square rounded-lg`,
                            // Selected state - Sand border (priority 1)
                            isSelected && tw`border-2 border-sand-600`,
                            // Today state - Amber border (priority 2, only if not selected)
                            !isSelected && day.isToday && tw`border-2 border-amber-500`,
                            {
                              backgroundColor: day.value > 0.8 ? '#44403c' : day.value > 0.6 ? '#57534e' : day.value > 0.4 ? '#78716c' : day.value > 0.2 ? '#a8a29e' : '#e7e5e4',
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: day.value > 0.2 ? 0.1 : 0,
                              shadowRadius: 2,
                            },
                          ]}
                        >
                          {/* Today dot indicator */}
                          {day.isToday && !isSelected && <View style={tw`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500`} />}
                          {/* Selected indicator dot */}
                          {isSelected && <View style={tw`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-sand-600`} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            {/* Legend with explanation */}
            <View style={tw`mt-4 pt-4 border-t border-sand-200`}>
              <View style={tw`flex-row items-center justify-between mb-2`}>
                <Text style={tw`text-xs font-semibold text-sand-700`}>Completion Rate</Text>
                <Text style={tw`text-xs text-sand-600`}>Based on daily habit completion</Text>
              </View>
              <View style={tw`flex-row items-center justify-center gap-2`}>
                <Text style={tw`text-xs text-sand-600`}>0%</Text>
                {[1, 2, 3, 4, 5].map((i) => (
                  <View
                    key={i}
                    style={[
                      tw`w-4 h-4 rounded`,
                      {
                        backgroundColor: i === 5 ? '#44403c' : i === 4 ? '#57534e' : i === 3 ? '#78716c' : i === 2 ? '#a8a29e' : '#e7e5e4',
                      },
                    ]}
                  />
                ))}
                <Text style={tw`text-xs text-sand-600`}>100%</Text>
              </View>
            </View>
          </View>
        )}

        {viewMode === 'summary' && (
          <View style={tw`bg-sand-50 rounded-2xl p-5`}>
            {/* Summary Stats Grid - No Chart */}
            <View style={tw`gap-5`}>
              {/* Primary Stat - Average Completion */}
              <View style={tw`bg-white rounded-xl p-5`}>
                <View style={tw`flex-row justify-between items-center mb-3`}>
                  <Text style={tw`text-sm font-semibold text-sand-700`}>Average Completion Rate</Text>
                  <View style={tw`flex-row items-center gap-1`}>
                    <TrendingUp size={16} color={summaryStats.trend >= 0 ? '#10b981' : '#ef4444'} />
                    <Text style={[tw`text-sm font-bold`, summaryStats.trend >= 0 ? tw`text-green-600` : tw`text-red-600`]}>
                      {summaryStats.trend > 0 ? '+' : ''}
                      {summaryStats.trend}%
                    </Text>
                  </View>
                </View>
                <Text style={tw`text-4xl font-bold text-stone-800 mb-2`}>{summaryStats.averageCompletion}%</Text>
                <View style={tw`h-2 rounded-full overflow-hidden bg-sand-100`}>
                  <LinearGradient colors={['#78716c', '#57534e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[tw`h-full rounded-full`, { width: `${summaryStats.averageCompletion}%` }]} />
                </View>
              </View>

              {/* Stats Grid */}
              <View style={tw`flex-row gap-3`}>
                <View style={tw`flex-1 bg-white rounded-xl p-4`}>
                  <View style={tw`w-10 h-10 rounded-full bg-sand-100 items-center justify-center mb-3`}>
                    <Calendar size={20} color="#78716c" />
                  </View>
                  <Text style={tw`text-xs text-sand-600 mb-1`}>Active Days</Text>
                  <Text style={tw`text-2xl font-bold text-stone-800`}>{summaryStats.activeDays}</Text>
                  <Text style={tw`text-xs text-sand-500 mt-1`}>Last {selectedRange === 'week' ? '7' : '30'} days</Text>
                </View>

                <View style={tw`flex-1 bg-white rounded-xl p-4`}>
                  <View style={tw`w-10 h-10 rounded-full bg-sand-100 items-center justify-center mb-3`}>
                    <BarChart3 size={20} color="#78716c" />
                  </View>
                  <Text style={tw`text-xs text-sand-600 mb-1`}>Best Day</Text>
                  <Text style={tw`text-2xl font-bold text-stone-800`}>{summaryStats.bestDay}</Text>
                  <Text style={tw`text-xs text-sand-500 mt-1`}>{summaryStats.bestDayPercentage}% completion</Text>
                </View>
              </View>

              {/* Performance Breakdown */}
              <View style={tw`bg-white rounded-xl p-5`}>
                <Text style={tw`text-sm font-semibold text-sand-700 mb-4`}>Performance Breakdown</Text>

                <View style={tw`gap-3`}>
                  <View style={tw`flex-row items-center justify-between`}>
                    <View style={tw`flex-row items-center gap-2`}>
                      <View style={tw`w-3 h-3 rounded-full bg-green-500`} />
                      <Text style={tw`text-sm text-stone-700`}>High Performance (≥70%)</Text>
                    </View>
                    <Text style={tw`text-sm font-bold text-stone-800`}>{summaryStats.highPerformanceDays}%</Text>
                  </View>

                  <View style={tw`flex-row items-center justify-between`}>
                    <View style={tw`flex-row items-center gap-2`}>
                      <View style={tw`w-3 h-3 rounded-full bg-yellow-500`} />
                      <Text style={tw`text-sm text-stone-700`}>Moderate Performance (40-69%)</Text>
                    </View>
                    <Text style={tw`text-sm font-bold text-stone-800`}>{summaryStats.moderatePerformanceDays}%</Text>
                  </View>

                  <View style={tw`flex-row items-center justify-between`}>
                    <View style={tw`flex-row items-center gap-2`}>
                      <View style={tw`w-3 h-3 rounded-full bg-red-400`} />
                      <Text style={tw`text-sm text-stone-700`}>Needs Improvement (&lt;40%)</Text>
                    </View>
                    <Text style={tw`text-sm font-bold text-stone-800`}>{summaryStats.lowPerformanceDays}%</Text>
                  </View>
                </View>
              </View>

              {/* Quick Stats Row */}
              <View style={tw`flex-row gap-3`}>
                <View style={tw`flex-1 bg-white rounded-xl p-4`}>
                  <Text style={tw`text-xs text-sand-600 mb-2`}>Consistency Score</Text>
                  <Text style={tw`text-2xl font-bold text-stone-800`}>{summaryStats.consistency}</Text>
                </View>

                <View style={tw`flex-1 bg-white rounded-xl p-4`}>
                  <Text style={tw`text-xs text-sand-600 mb-2`}>Current Streak</Text>
                  <Text style={tw`text-2xl font-bold text-stone-800`}>{summaryStats.currentStreak} Days</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Detail Card - Show for Trend and Heatmap */}
        {selectedDataPoint && (viewMode === 'trend' || viewMode === 'heatmap') && (
          <View
            style={[
              tw`mt-5 rounded-2xl p-5 bg-white border border-sand-100`,
              {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 3,
              },
            ]}
          >
            {/* Header */}
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <View>
                <Text style={tw`text-base font-bold text-stone-800`}>{selectedDataPoint.date}</Text>
                <Text style={tw`text-xs text-sand-600 mt-0.5`}>Daily Summary</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedDataPoint(null)} style={tw`p-2 rounded-lg bg-sand-50`}>
                <X size={16} color="#78716c" />
              </TouchableOpacity>
            </View>

            {/* Stats Grid */}
            <View style={tw`flex-row gap-3 mb-4`}>
              {/* Completion Rate */}
              <View style={tw`flex-1 p-4 rounded-xl bg-sand-50`}>
                <Text style={tw`text-xs text-sand-600 mb-1.5 uppercase font-semibold tracking-wide`}>Completion</Text>
                <Text style={tw`text-3xl font-bold text-stone-800`}>{selectedDataPoint.value}%</Text>
              </View>

              {/* Tasks */}
              <View style={tw`flex-1 p-4 rounded-xl bg-sand-50`}>
                <Text style={tw`text-xs text-sand-600 mb-1.5 uppercase font-semibold tracking-wide`}>Tasks Done</Text>
                <Text style={tw`text-3xl font-bold text-stone-800`}>
                  {selectedDataPoint.completedTasks}/{selectedDataPoint.totalTasks}
                </Text>
              </View>
            </View>

            {/* Active Habits */}
            {selectedDataPoint.habits.length > 0 && (
              <View style={tw`pt-4 border-t border-sand-100`}>
                <Text style={tw`text-xs font-semibold text-sand-700 mb-2.5 uppercase tracking-wide`}>Active Habits</Text>
                <View style={tw`gap-2`}>
                  {selectedDataPoint.habits.map((habit, idx) => (
                    <View key={idx} style={tw`flex-row items-center gap-2`}>
                      <View style={tw`w-1.5 h-1.5 rounded-full bg-stone-600`} />
                      <Text style={tw`text-sm text-stone-700 flex-1`}>{habit}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

export default PremiumStatsSection;
