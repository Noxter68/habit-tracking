// src/components/premium/PremiumStatsSection.tsx
import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { HapticFeedback } from '@/utils/haptics';

type TimeRange = 'week' | 'month';
type ViewMode = 'trend' | 'heatmap';

interface PremiumStatsSectionProps {
  habits: any[];
  selectedRange?: TimeRange;
  onRangeChange?: (range: TimeRange) => void;
  tierColors?: string[];
}

const PremiumStatsSection: React.FC<PremiumStatsSectionProps> = ({
  habits,
  selectedRange: externalRange,
  onRangeChange,
  tierColors = ['#60a5fa', '#3b82f6'], // Default crystal (cyan)
}) => {
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
    HapticFeedback.selection();
    setSelectedRange(range);
    setSelectedDataPoint(null);
    onRangeChange?.(range);
  };

  // Calculate chart data
  const chartData = useMemo(() => {
    const days = selectedRange === 'week' ? 7 : 30;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: days }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (days - 1 - i));
      const dateString = date.toISOString().split('T')[0];

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

      const value = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        value,
        habits: activeHabits,
        completedTasks,
        totalTasks,
        isToday: dateString === today.toISOString().split('T')[0],
      };
    });
  }, [habits, selectedRange]);

  // Generate heatmap data
  const heatmapData = useMemo(() => {
    const weeks = selectedRange === 'week' ? 1 : 4;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString().split('T')[0];

    return Array.from({ length: weeks }, (_, weekIndex) => {
      return Array.from({ length: 7 }, (_, dayIndex) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (weeks * 7 - 1 - (weekIndex * 7 + dayIndex)));
        const dateString = date.toISOString().split('T')[0];

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
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          fullDate: date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          value,
          habits: activeHabits,
          tasks: { completed: completedTasks, total: totalTasks },
          isToday: dateString === todayString,
        };
      });
    });
  }, [habits, selectedRange]);

  const maxValue = Math.max(...chartData.map((d) => d.value), 1);

  const handleBarPress = (index: number) => {
    HapticFeedback.light();
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
    HapticFeedback.light();
    const data = heatmapData[weekIndex][dayIndex];
    setSelectedDataPoint({
      index: weekIndex * 7 + dayIndex,
      value: Math.round(data.value * 100),
      date: data.fullDate,
      habits: data.habits,
      completedTasks: data.tasks.completed,
      totalTasks: data.tasks.total,
    });
  };

  const navigateDataPoint = (direction: 'prev' | 'next') => {
    if (!selectedDataPoint) return;

    HapticFeedback.light();
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

  const getIntensityColor = (value: number) => {
    const alpha = Math.max(0.15, value);
    return `${tierColors[0]}${Math.round(alpha * 255)
      .toString(16)
      .padStart(2, '0')}`;
  };

  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: tierColors[0],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      }}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 16,
          backgroundColor: `${tierColors[0]}08`,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937' }}>Analytics</Text>

          {/* Time Range */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['week', 'month'] as TimeRange[]).map((range) => (
              <TouchableOpacity key={range} onPress={() => handleRangeChange(range)} activeOpacity={0.7}>
                {selectedRange === range ? (
                  <LinearGradient colors={tierColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#FFFFFF' }}>{range === 'week' ? '7d' : '30d'}</Text>
                  </LinearGradient>
                ) : (
                  <View
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: `${tierColors[0]}15`,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: tierColors[0] }}>{range === 'week' ? '7d' : '30d'}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* View Mode Toggle */}
        <View style={{ flexDirection: 'row', gap: 8, backgroundColor: 'rgba(255, 255, 255, 0.6)', borderRadius: 12, padding: 4 }}>
          {[
            { value: 'trend' as ViewMode, label: 'Trend', icon: TrendingUp },
            { value: 'heatmap' as ViewMode, label: 'Calendar', icon: Calendar },
          ].map((mode) => {
            const Icon = mode.icon;
            const isActive = viewMode === mode.value;

            return (
              <TouchableOpacity
                key={mode.value}
                onPress={() => {
                  HapticFeedback.selection();
                  setViewMode(mode.value);
                  setSelectedDataPoint(null);
                }}
                activeOpacity={0.7}
                style={{ flex: 1 }}
              >
                {isActive ? (
                  <LinearGradient
                    colors={tierColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8, borderRadius: 8 }}
                  >
                    <Icon size={14} color="#FFFFFF" />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#FFFFFF' }}>{mode.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8 }}>
                    <Icon size={14} color={tierColors[0]} />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: tierColors[0] }}>{mode.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Chart Area */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 16 }}>
        {/* Navigation */}
        {selectedDataPoint && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => navigateDataPoint('prev')}
              disabled={selectedDataPoint?.index === 0}
              style={{
                padding: 8,
                borderRadius: 8,
                backgroundColor: `${tierColors[0]}10`,
                opacity: selectedDataPoint?.index === 0 ? 0.3 : 1,
              }}
            >
              <ChevronLeft size={18} color={tierColors[0]} strokeWidth={2.5} />
            </TouchableOpacity>

            <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, backgroundColor: `${tierColors[0]}10` }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: tierColors[0] }}>
                {selectedDataPoint.index + 1} / {viewMode === 'heatmap' ? heatmapData.length * 7 : chartData.length}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => navigateDataPoint('next')}
              disabled={selectedDataPoint?.index === (viewMode === 'heatmap' ? heatmapData.length * 7 - 1 : chartData.length - 1)}
              style={{
                padding: 8,
                borderRadius: 8,
                backgroundColor: `${tierColors[0]}10`,
                opacity: selectedDataPoint?.index === (viewMode === 'heatmap' ? heatmapData.length * 7 - 1 : chartData.length - 1) ? 0.3 : 1,
              }}
            >
              <ChevronRight size={18} color={tierColors[0]} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        )}

        {/* Trend Chart */}
        {viewMode === 'trend' && (
          <View style={{ backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 160, marginBottom: 12 }}>
              {chartData.map((data, index) => {
                const isSelected = selectedDataPoint?.index === index;
                const barHeight = data.totalTasks > 0 ? (data.value / maxValue) * 100 : 0;

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
                          borderColor: tierColors[0],
                          height: data.totalTasks > 0 ? `${Math.max(barHeight, 5)}%` : '15%',
                        }}
                      />
                    )}

                    {data.totalTasks === 0 ? (
                      <View style={{ width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6, height: '15%', backgroundColor: '#D1D5DB', opacity: 0.4 }} />
                    ) : (
                      <LinearGradient
                        colors={tierColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={{ width: '100%', borderTopLeftRadius: 8, borderTopRightRadius: 8, height: `${Math.max(barHeight, 5)}%` }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* X-axis labels */}
            {selectedRange === 'week' && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
                {chartData.map((data, idx) => (
                  <Text
                    key={idx}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      fontSize: 11,
                      fontWeight: selectedDataPoint?.index === idx ? '700' : '600',
                      color: selectedDataPoint?.index === idx ? tierColors[0] : '#9CA3AF',
                    }}
                  >
                    {data.dayName}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Heatmap */}
        {viewMode === 'heatmap' && (
          <View style={{ backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16 }}>
            {/* Day labels */}
            <View style={{ flexDirection: 'row', marginBottom: 12, marginLeft: 32 }}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                <View key={idx} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: tierColors[0] }}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Grid */}
            {heatmapData.map((week, weekIndex) => (
              <View key={weekIndex} style={{ flexDirection: 'row', marginBottom: 10 }}>
                <View style={{ width: 32, justifyContent: 'center', marginRight: 8 }}>
                  <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '500' }}>W{weekIndex + 1}</Text>
                </View>

                <View style={{ flex: 1, flexDirection: 'row', gap: 6 }}>
                  {week.map((day, dayIndex) => {
                    const isSelected = selectedDataPoint?.index === weekIndex * 7 + dayIndex;

                    return (
                      <TouchableOpacity key={dayIndex} onPress={() => handleHeatmapPress(weekIndex, dayIndex)} activeOpacity={0.7} style={{ flex: 1 }}>
                        <View
                          style={{
                            aspectRatio: 1,
                            borderRadius: 8,
                            backgroundColor: getIntensityColor(day.value),
                            borderWidth: isSelected || day.isToday ? 2 : 0,
                            borderColor: isSelected ? tierColors[0] : day.isToday ? `${tierColors[0]}60` : 'transparent',
                          }}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            {/* Legend */}
            <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '500' }}>Less</Text>
                {[0.15, 0.35, 0.55, 0.75, 0.95].map((intensity, idx) => (
                  <View key={idx} style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: getIntensityColor(intensity) }} />
                ))}
                <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '500' }}>More</Text>
              </View>
            </View>
          </View>
        )}

        {/* Detail Card */}
        {selectedDataPoint && (
          <View
            style={{
              marginTop: 16,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              shadowColor: tierColors[0],
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#1F2937' }}>{selectedDataPoint.date}</Text>
                <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Daily Summary</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedDataPoint(null)} style={{ padding: 6, borderRadius: 8, backgroundColor: `${tierColors[0]}10` }}>
                <X size={14} color={tierColors[0]} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: `${tierColors[0]}08` }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: tierColors[0], marginBottom: 4 }}>COMPLETION</Text>
                <Text style={{ fontSize: 24, fontWeight: '700', color: '#1F2937' }}>{selectedDataPoint.value}%</Text>
              </View>

              <View style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#F3F4F6' }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: '#6B7280', marginBottom: 4 }}>TASKS</Text>
                <Text style={{ fontSize: 24, fontWeight: '700', color: '#1F2937' }}>
                  {selectedDataPoint.completedTasks}/{selectedDataPoint.totalTasks}
                </Text>
              </View>
            </View>

            {selectedDataPoint.habits.length > 0 && (
              <View style={{ paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: tierColors[0], marginBottom: 8 }}>ACTIVE HABITS</Text>
                <View style={{ gap: 6 }}>
                  {selectedDataPoint.habits.map((habit, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: tierColors[0] }} />
                      <Text style={{ fontSize: 13, color: '#4B5563', fontWeight: '500', flex: 1 }}>{habit}</Text>
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
