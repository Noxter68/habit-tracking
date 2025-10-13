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

  // Generate chart data based on selected range
  const chartData = React.useMemo(() => calculateAnalyticsData(habits, selectedRange), [habits, selectedRange]);
  const maxValue = Math.max(...chartData.map((d) => d.value), 1);

  // Calculate summary statistics
  const summaryStats = React.useMemo(() => calculateSummaryStats(habits, selectedRange), [habits, selectedRange]);

  // Generate week view for heatmap
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
      style={{
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        shadowColor: '#9333EA',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      }}
    >
      {/* Elegant Header with Amethyst Gradient */}
      <LinearGradient colors={['#F5F3FF', '#EDE9FE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={20} color="#9333EA" />
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#1F2937', letterSpacing: 0.5 }}>Analytics</Text>
          </View>

          {/* Time Range Pills */}
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {timeRanges.map((range) => (
              <TouchableOpacity key={range.value} onPress={() => handleRangeChange(range.value)} activeOpacity={0.7}>
                {selectedRange === range.value ? (
                  <LinearGradient colors={['#9333EA', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>{range.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(147, 51, 234, 0.1)' }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#9333EA' }}>{range.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* View Mode Tabs */}
        <View style={{ flexDirection: 'row', gap: 6, backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: 14, padding: 4 }}>
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
                style={{ flex: 1 }}
              >
                {isActive ? (
                  <LinearGradient
                    colors={['#9333EA', '#7C3AED']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10 }}
                  >
                    <Icon size={14} color="#FFFFFF" />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>{mode.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 }}>
                    <Icon size={14} color="#9333EA" />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#9333EA' }}>{mode.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>

      {/* Chart Area */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 16 }}>
        {/* Navigation Arrows */}
        {(viewMode === 'trend' || viewMode === 'heatmap') && selectedDataPoint && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <TouchableOpacity onPress={() => navigateDataPoint('prev')} activeOpacity={0.7} disabled={selectedDataPoint?.index === 0} style={{ opacity: selectedDataPoint?.index === 0 ? 0.3 : 1 }}>
              <LinearGradient colors={['#F5F3FF', '#EDE9FE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 8, borderRadius: 10 }}>
                <ChevronLeft size={18} color="#9333EA" strokeWidth={2.5} />
              </LinearGradient>
            </TouchableOpacity>

            <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: '#F5F3FF' }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#9333EA' }}>
                {selectedDataPoint.index + 1} / {viewMode === 'heatmap' ? heatmapData.length * 7 : chartData.length}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => navigateDataPoint('next')}
              activeOpacity={0.7}
              disabled={selectedDataPoint?.index === (viewMode === 'heatmap' ? heatmapData.length * 7 - 1 : chartData.length - 1)}
              style={{ opacity: selectedDataPoint?.index === (viewMode === 'heatmap' ? heatmapData.length * 7 - 1 : chartData.length - 1) ? 0.3 : 1 }}
            >
              <LinearGradient colors={['#F5F3FF', '#EDE9FE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 8, borderRadius: 10 }}>
                <ChevronRight size={18} color="#9333EA" strokeWidth={2.5} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {viewMode === 'trend' && (
          <View style={{ backgroundColor: '#FAF9F7', borderRadius: 16, padding: 16 }}>
            {/* Bar Chart with Vibrant Gradients */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 160, marginBottom: 12 }}>
              {chartData.map((data, index) => {
                const isSelected = selectedDataPoint?.index === index;
                const hasData = data.totalTasks > 0;
                const barHeight = hasData ? (data.value / maxValue) * 100 : 0;
                const isToday = index === chartData.length - 1;

                // Color gradients based on completion
                let colors = ['#E5E7EB', '#D1D5DB'];
                if (data.value > 80) colors = ['#9333EA', '#7C3AED']; // Amethyst
                else if (data.value > 60) colors = ['#DC2626', '#B91C1C']; // Ruby
                else if (data.value > 40) colors = ['#06B6D4', '#0891B2']; // Crystal
                else if (data.value > 20) colors = ['#EC4899', '#DB2777']; // Quartz

                return (
                  <TouchableOpacity key={index} onPress={() => handleBarPress(index)} activeOpacity={0.7} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', marginHorizontal: 2 }}>
                    {isSelected && (
                      <View
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          width: '100%',
                          borderTopLeftRadius: 8,
                          borderTopRightRadius: 8,
                          borderWidth: 2,
                          borderBottomWidth: 0,
                          borderColor: '#9333EA',
                          height: hasData ? `${Math.max(barHeight, 5)}%` : '15%',
                        }}
                      />
                    )}

                    {isToday && !isSelected && (
                      <View
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          width: '100%',
                          borderTopLeftRadius: 6,
                          borderTopRightRadius: 6,
                          borderWidth: 2,
                          borderBottomWidth: 0,
                          borderColor: '#EC4899',
                          opacity: 0.5,
                          height: hasData ? `${Math.max(barHeight, 5)}%` : '15%',
                        }}
                      />
                    )}

                    {!hasData && (
                      <View
                        style={{
                          width: '100%',
                          borderTopLeftRadius: 6,
                          borderTopRightRadius: 6,
                          height: '15%',
                          backgroundColor: '#E5E7EB',
                          opacity: 0.4,
                        }}
                      />
                    )}

                    {hasData && (
                      <LinearGradient
                        colors={colors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={{
                          width: '100%',
                          borderTopLeftRadius: 8,
                          borderTopRightRadius: 8,
                          height: `${Math.max(barHeight, 5)}%`,
                        }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* X-axis */}
            {selectedRange === 'week' && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
                {chartData.map((data, idx) => {
                  const isToday = idx === chartData.length - 1;
                  const isSelected = selectedDataPoint?.index === idx;
                  return (
                    <Text
                      key={idx}
                      style={{ fontSize: 11, flex: 1, textAlign: 'center', fontWeight: isSelected || isToday ? '700' : '600', color: isSelected ? '#9333EA' : isToday ? '#EC4899' : '#9CA3AF' }}
                    >
                      {data.date.split(' ')[1]}
                    </Text>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {viewMode === 'heatmap' && (
          <View style={{ backgroundColor: '#FAF9F7', borderRadius: 16, padding: 16 }}>
            {/* Day labels */}
            <View style={{ flexDirection: 'row', marginBottom: 12, marginLeft: 32 }}>
              {dayLabels.map((day, idx) => (
                <View key={idx} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#9333EA' }}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Heatmap Grid with Vibrant Colors */}
            {heatmapData.map((week, weekIndex) => (
              <View key={weekIndex} style={{ flexDirection: 'row', marginBottom: 10 }}>
                <View style={{ width: 32, justifyContent: 'center', marginRight: 8 }}>
                  <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '600' }}>W{weekIndex + 1}</Text>
                </View>

                <View style={{ flex: 1, flexDirection: 'row', gap: 6 }}>
                  {week.map((day, dayIndex) => {
                    const isSelected = selectedDataPoint?.index === weekIndex * 7 + dayIndex;

                    // Vibrant gradient colors
                    let colors = ['#F3F4F6', '#E5E7EB'];
                    if (day.value > 0.8) colors = ['#9333EA', '#7C3AED'];
                    else if (day.value > 0.6) colors = ['#DC2626', '#B91C1C'];
                    else if (day.value > 0.4) colors = ['#06B6D4', '#0891B2'];
                    else if (day.value > 0.2) colors = ['#EC4899', '#DB2777'];
                    else if (day.value > 0) colors = ['#A855F7', '#9333EA'];

                    return (
                      <TouchableOpacity key={dayIndex} onPress={() => handleHeatmapPress(weekIndex, dayIndex)} activeOpacity={0.7} style={{ flex: 1 }}>
                        <LinearGradient
                          colors={colors}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{
                            aspectRatio: 1,
                            borderRadius: 8,
                            borderWidth: isSelected ? 2 : day.isToday ? 2 : 0,
                            borderColor: isSelected ? '#9333EA' : day.isToday ? '#EC4899' : 'transparent',
                          }}
                        >
                          {day.isToday && !isSelected && <View style={{ position: 'absolute', top: 2, right: 2, width: 6, height: 6, borderRadius: 3, backgroundColor: '#EC4899' }} />}
                          {isSelected && <View style={{ position: 'absolute', top: 2, right: 2, width: 6, height: 6, borderRadius: 3, backgroundColor: '#9333EA' }} />}
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            {/* Legend */}
            <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '600' }}>0%</Text>
                <LinearGradient colors={['#F3F4F6', '#E5E7EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 16, height: 16, borderRadius: 4 }} />
                <LinearGradient colors={['#EC4899', '#DB2777']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 16, height: 16, borderRadius: 4 }} />
                <LinearGradient colors={['#06B6D4', '#0891B2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 16, height: 16, borderRadius: 4 }} />
                <LinearGradient colors={['#DC2626', '#B91C1C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 16, height: 16, borderRadius: 4 }} />
                <LinearGradient colors={['#9333EA', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 16, height: 16, borderRadius: 4 }} />
                <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '600' }}>100%</Text>
              </View>
            </View>
          </View>
        )}

        {viewMode === 'summary' && (
          <View style={{ backgroundColor: '#FAF9F7', borderRadius: 16, padding: 16 }}>
            <View style={{ gap: 16 }}>
              {/* Average Completion with Amethyst Gradient */}
              <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#9333EA' }}>Average Completion</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <TrendingUp size={14} color={summaryStats.trend >= 0 ? '#9333EA' : '#DC2626'} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: summaryStats.trend >= 0 ? '#9333EA' : '#DC2626' }}>
                      {summaryStats.trend > 0 ? '+' : ''}
                      {summaryStats.trend}%
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 36, fontWeight: '900', color: '#1F2937', marginBottom: 10 }}>{summaryStats.averageCompletion}%</Text>
                <View style={{ height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: '#E5E7EB' }}>
                  <LinearGradient
                    colors={['#9333EA', '#7C3AED']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ height: '100%', borderRadius: 4, width: `${summaryStats.averageCompletion}%` }}
                  />
                </View>
              </View>

              {/* Stats Grid with Jewel Tones */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14 }}>
                  <LinearGradient
                    colors={['#DC2626', '#B91C1C']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}
                  >
                    <Calendar size={18} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4, fontWeight: '600' }}>Active Days</Text>
                  <Text style={{ fontSize: 24, fontWeight: '900', color: '#1F2937' }}>{summaryStats.activeDays}</Text>
                </View>

                <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14 }}>
                  <LinearGradient
                    colors={['#06B6D4', '#0891B2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}
                  >
                    <BarChart3 size={18} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4, fontWeight: '600' }}>Best Day</Text>
                  <Text style={{ fontSize: 24, fontWeight: '900', color: '#1F2937' }}>{summaryStats.bestDay}</Text>
                </View>
              </View>

              {/* Performance Breakdown with Vibrant Colors */}
              <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#9333EA', marginBottom: 12 }}>Performance</Text>
                <View style={{ gap: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <LinearGradient colors={['#9333EA', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 10, height: 10, borderRadius: 5 }} />
                      <Text style={{ fontSize: 13, color: '#4B5563', fontWeight: '600' }}>High (≥70%)</Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#1F2937' }}>{summaryStats.highPerformanceDays}%</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <LinearGradient colors={['#DC2626', '#B91C1C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 10, height: 10, borderRadius: 5 }} />
                      <Text style={{ fontSize: 13, color: '#4B5563', fontWeight: '600' }}>Moderate (40-69%)</Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#1F2937' }}>{summaryStats.moderatePerformanceDays}%</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <LinearGradient colors={['#EC4899', '#DB2777']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 10, height: 10, borderRadius: 5 }} />
                      <Text style={{ fontSize: 13, color: '#4B5563', fontWeight: '600' }}>Low (&lt;40%)</Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#1F2937' }}>{summaryStats.lowPerformanceDays}%</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Detail Card with Amethyst Accent */}
        {selectedDataPoint && (viewMode === 'trend' || viewMode === 'heatmap') && (
          <View
            style={{
              marginTop: 16,
              borderRadius: 16,
              padding: 16,
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#E5E7EB',
              shadowColor: '#9333EA',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <View>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#1F2937' }}>{selectedDataPoint.date}</Text>
                <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2, fontWeight: '600' }}>Daily Summary</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedDataPoint(null)}>
                <View style={{ padding: 6, borderRadius: 8, backgroundColor: '#F5F3FF' }}>
                  <X size={14} color="#9333EA" />
                </View>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
              <LinearGradient colors={['#F5F3FF', '#EDE9FE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, padding: 12, borderRadius: 12 }}>
                <Text style={{ fontSize: 10, color: '#9333EA', marginBottom: 6, fontWeight: '700', letterSpacing: 0.5 }}>COMPLETION</Text>
                <Text style={{ fontSize: 28, fontWeight: '900', color: '#1F2937' }}>{selectedDataPoint.value}%</Text>
              </LinearGradient>

              <LinearGradient colors={['#FEF2F2', '#FEE2E2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, padding: 12, borderRadius: 12 }}>
                <Text style={{ fontSize: 10, color: '#DC2626', marginBottom: 6, fontWeight: '700', letterSpacing: 0.5 }}>TASKS</Text>
                <Text style={{ fontSize: 28, fontWeight: '900', color: '#1F2937' }}>
                  {selectedDataPoint.completedTasks}/{selectedDataPoint.totalTasks}
                </Text>
              </LinearGradient>
            </View>

            {selectedDataPoint.habits.length > 0 && (
              <View style={{ paddingTop: 14, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#9333EA', marginBottom: 8, letterSpacing: 0.5 }}>ACTIVE HABITS</Text>
                <View style={{ gap: 6 }}>
                  {selectedDataPoint.habits.map((habit, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <LinearGradient colors={['#9333EA', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 5, height: 5, borderRadius: 2.5 }} />
                      <Text style={{ fontSize: 13, color: '#4B5563', flex: 1, fontWeight: '600' }}>{habit}</Text>
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
