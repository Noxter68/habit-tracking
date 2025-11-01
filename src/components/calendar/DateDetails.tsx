// src/components/calendar/DateDetails.tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Umbrella, CheckCircle2, Circle, Clock, Sun } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import tw from '@/lib/tailwind';
import { Habit } from '@/types';
import { HolidayPeriod } from '@/types/holiday.types';
import { HolidayModeService } from '@/services/holidayModeService';
import { HabitProgressionService } from '@/services/habitProgressionService';
import { tierThemes } from '@/utils/tierTheme';
import { getLocalDateString } from '@/utils/dateHelpers';

interface DateDetailsProps {
  habit: Habit;
  selectedDate: Date;
  activeHoliday?: HolidayPeriod | null;
  allHolidays?: HolidayPeriod[];
}

const DateDetails: React.FC<DateDetailsProps> = ({ habit, selectedDate, activeHoliday = null, allHolidays = [] }) => {
  const dateString = getLocalDateString(selectedDate);
  const dayTasks = habit.dailyTasks[dateString];
  const totalTasks = habit.tasks?.length || 0;
  const completedTaskIds = dayTasks?.completedTasks || [];
  const completedCount = completedTaskIds.length;

  const { tier } = HabitProgressionService.calculateTierFromStreak(habit.currentStreak);
  const theme = tierThemes[tier.name];

  const taskIds = habit.tasks.map((t) => t.id);

  // ✅ FIX: Check against ALL holidays for historical data
  const isHoliday = HolidayModeService.isDateInAnyHoliday(selectedDate, allHolidays, habit.id, taskIds);

  // Check if it's the ACTIVE holiday for detailed info
  const isActiveHoliday = HolidayModeService.isDateInHoliday(selectedDate, activeHoliday, habit.id, taskIds);

  const holidayInfo = HolidayModeService.getHolidayInfoForDate(selectedDate, activeHoliday, habit.id);

  const isCompleted = dayTasks?.allCompleted || false;
  const isPartial = completedCount > 0 && !isCompleted;
  const percentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // ✅ FIX: Normalize both dates to midnight for accurate comparison
  const checkDate = new Date(selectedDate);
  checkDate.setHours(0, 0, 0, 0);

  const creationDate = new Date(habit.createdAt);
  creationDate.setHours(0, 0, 0, 0);

  // Only dates strictly BEFORE creation date are considered "before creation"
  const beforeCreation = checkDate.getTime() < creationDate.getTime();

  const isPast = selectedDate < new Date();
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // ============================================================================
  // HOLIDAY STATE - TOPAZ THEME
  // ✅ UPDATED: Shows full UI for ACTIVE holidays, simple badge for PAST holidays
  // ============================================================================
  if (isHoliday) {
    // If it's the ACTIVE holiday, show full UI
    if (isActiveHoliday && holidayInfo.isHoliday) {
      return (
        <Animated.View entering={FadeInDown.duration(400)} style={tw`mt-4`}>
          <LinearGradient colors={['#fbbf24', '#f59e0b', '#d97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-2xl p-4 shadow-lg`}>
            {/* Compact Header */}
            <View style={tw`flex-row items-center mb-3`}>
              <View style={tw`w-12 h-12 bg-white/30 rounded-full items-center justify-center mr-3`}>
                <Sun size={24} color="#FFFFFF" strokeWidth={2} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-lg font-black text-white`}>Holiday Mode</Text>
                <Text style={tw`text-white/90 text-xs`}>{holidayInfo.message}</Text>
              </View>
            </View>

            {/* Info Box */}
            <View style={tw`bg-white/20 rounded-xl p-3`}>
              <Text style={tw`text-white font-semibold text-sm text-center mb-1`}>Your streak is safe!</Text>
              <Text style={tw`text-white/90 text-xs text-center`}>Tracking paused. Enjoy your break!</Text>

              {completedCount > 0 && (
                <View style={tw`mt-3 pt-3 border-t border-white/30`}>
                  <Text style={tw`text-white text-xs font-semibold mb-2`}>
                    Completed during holiday ({completedCount}/{totalTasks})
                  </Text>
                  {habit.tasks.map((task: any, index: number) => {
                    const isTaskCompleted = completedTaskIds.includes(task.id);
                    return (
                      <View key={`holiday-task-${task.id}-${index}`} style={tw`flex-row items-center py-1.5`}>
                        {isTaskCompleted ? <CheckCircle2 size={14} color="#FFFFFF" strokeWidth={2.5} /> : <Circle size={14} color="rgba(255, 255, 255, 0.4)" strokeWidth={2} />}
                        <Text style={[tw`ml-2 flex-1 text-xs`, isTaskCompleted ? tw`text-white font-medium` : tw`text-white/60`]}>{task.name}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>
      );
    }

    // ✅ NEW: Otherwise, it's a PAST holiday - show simple historical badge
    return (
      <Animated.View entering={FadeInDown.duration(400)} style={tw`mt-4`}>
        <View style={tw`bg-amber-50 rounded-2xl p-4 border border-amber-200`}>
          {/* Header */}
          <View style={tw`flex-row items-center justify-center mb-2`}>
            <View style={tw`bg-white rounded-full p-2 mr-2 shadow-sm`}>
              <Sun size={18} color="#f59e0b" strokeWidth={2} />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-amber-900 font-bold text-sm`}>Holiday Period</Text>
              <Text style={tw`text-amber-700 text-xs`}>
                {selectedDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>

          {/* Info Message */}
          <View style={tw`bg-white/60 rounded-lg p-2.5 mt-2`}>
            <Text style={tw`text-amber-800 text-xs text-center font-medium`}>Streak was preserved during this period</Text>
          </View>

          {/* Show completed tasks if any */}
          {completedCount > 0 && (
            <View style={tw`mt-3 pt-3 border-t border-amber-200`}>
              <Text style={tw`text-amber-800 text-xs font-semibold mb-2`}>
                Tasks completed: {completedCount}/{totalTasks}
              </Text>
              {habit.tasks.map((task: any, index: number) => {
                const isTaskCompleted = completedTaskIds.includes(task.id);
                if (!isTaskCompleted) return null;

                return (
                  <View key={`past-holiday-task-${task.id}-${index}`} style={tw`flex-row items-center py-1`}>
                    <CheckCircle2 size={12} color="#f59e0b" strokeWidth={2.5} />
                    <Text style={tw`ml-2 flex-1 text-xs text-amber-800`}>{task.name}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </Animated.View>
    );
  }

  // ============================================================================
  // BEFORE CREATION STATE - Compact
  // ============================================================================
  if (beforeCreation) {
    return (
      <Animated.View entering={FadeInDown.duration(400)} style={tw`mt-4`}>
        <View style={tw`bg-gray-50 rounded-2xl p-4 border border-gray-200`}>
          <Text style={tw`text-xs text-gray-400 text-center mb-1`}>{formattedDate}</Text>
          <Text style={tw`text-gray-500 text-center font-medium text-sm`}>Habit not created yet</Text>
          <Text style={tw`text-xs text-gray-400 text-center mt-1`}>
            Created on{' '}
            {new Date(habit.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>
      </Animated.View>
    );
  }

  // ============================================================================
  // NORMAL STATE - Compact Version
  // ============================================================================
  return (
    <Animated.View entering={FadeInDown.duration(400)} style={tw`mt-4`}>
      <View style={tw`bg-white rounded-2xl shadow-lg overflow-hidden`}>
        {/* Compact Header */}
        <LinearGradient
          colors={isCompleted ? ['#10b981', '#059669'] : isPartial ? ['#f59e0b', '#d97706'] : isPast ? ['#ef4444', '#dc2626'] : [theme.accent, theme.accent + 'dd']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={tw`p-3.5`}
        >
          {/* Date and Status Row */}
          <View style={tw`flex-row items-center justify-between mb-2`}>
            <View style={tw`flex-1`}>
              <Text style={tw`text-white text-base font-bold`}>
                {selectedDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
              <Text style={tw`text-white/70 text-xs`}>{selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}</Text>
            </View>

            {/* Compact Status Badges */}
            <View style={tw`flex-row`}>
              {isToday && (
                <View style={tw`bg-white/30 px-2 py-0.5 rounded-full mr-1`}>
                  <Text style={tw`text-white text-xs font-bold`}>TODAY</Text>
                </View>
              )}
              <View style={tw`bg-white/30 px-2 py-0.5 rounded-full flex-row items-center`}>
                {isCompleted ? (
                  <>
                    <CheckCircle2 size={10} color="#ffffff" strokeWidth={3} />
                    <Text style={tw`text-white text-xs font-bold ml-1`}>DONE</Text>
                  </>
                ) : isPartial ? (
                  <>
                    <Clock size={10} color="#ffffff" strokeWidth={2.5} />
                    <Text style={tw`text-white text-xs font-bold ml-1`}>
                      {completedCount}/{totalTasks}
                    </Text>
                  </>
                ) : isPast ? (
                  <Text style={tw`text-white text-xs font-bold`}>MISSED</Text>
                ) : (
                  <Text style={tw`text-white text-xs font-bold`}>TODO</Text>
                )}
              </View>
            </View>
          </View>

          {/* Compact Progress Bar */}
          <View style={tw`h-1.5 bg-white/20 rounded-full overflow-hidden`}>
            <Animated.View entering={FadeIn.duration(600)} style={[tw`h-full bg-white rounded-full`, { width: `${percentage}%` }]} />
          </View>
        </LinearGradient>

        {/* Compact Task List */}
        <View style={tw`p-3.5`}>
          {habit.tasks.length === 0 ? (
            <Text style={tw`text-gray-400 text-xs text-center py-2`}>No tasks defined</Text>
          ) : (
            <>
              {habit.tasks.map((task: any, index: number) => {
                const isTaskCompleted = completedTaskIds.includes(task.id);

                return (
                  <Animated.View
                    key={`task-${task.id}-${index}`}
                    entering={FadeIn.delay(index * 50).duration(300)}
                    style={[tw`flex-row items-center p-2.5 rounded-xl mb-2`, isTaskCompleted ? tw`bg-green-50 border border-green-200` : tw`bg-gray-50 border border-gray-200`]}
                  >
                    {/* Compact Checkbox */}
                    <View style={tw`mr-2.5`}>
                      {isTaskCompleted ? (
                        <View style={tw`w-5 h-5 rounded-full bg-green-500 items-center justify-center`}>
                          <CheckCircle2 size={12} color="#ffffff" strokeWidth={3} />
                        </View>
                      ) : (
                        <View style={tw`w-5 h-5 rounded-full border-2 border-gray-300`} />
                      )}
                    </View>

                    {/* Task Info */}
                    <View style={tw`flex-1`}>
                      <Text style={[tw`text-sm font-semibold`, isTaskCompleted ? tw`text-green-700` : tw`text-gray-700`]}>{task.name}</Text>
                      {task.description && <Text style={[tw`text-xs mt-0.5`, isTaskCompleted ? tw`text-green-600` : tw`text-gray-500`]}>{task.description}</Text>}
                    </View>

                    {/* Duration Badge */}
                    {task.duration && (
                      <View style={[tw`px-1.5 py-0.5 rounded-lg ml-2`, isTaskCompleted ? tw`bg-green-100` : tw`bg-gray-100`]}>
                        <Text style={[tw`text-xs font-medium`, isTaskCompleted ? tw`text-green-700` : tw`text-gray-600`]}>{task.duration}</Text>
                      </View>
                    )}
                  </Animated.View>
                );
              })}
            </>
          )}

          {/* Compact Summary */}
          {totalTasks > 0 && (
            <View style={tw`mt-2 pt-2 border-t border-gray-100`}>
              {isPartial ? (
                <View style={tw`bg-amber-50 rounded-lg p-2.5`}>
                  <Text style={tw`text-amber-700 font-semibold text-xs`}>
                    {totalTasks - completedCount} task{totalTasks - completedCount > 1 ? 's' : ''} remaining
                  </Text>
                </View>
              ) : isPast ? (
                <View style={tw`bg-red-50 rounded-lg p-2.5`}>
                  <Text style={tw`text-red-700 font-semibold text-xs`}>Missed • Tomorrow is a new opportunity</Text>
                </View>
              ) : !isCompleted ? (
                <View style={tw`bg-blue-50 rounded-lg p-2.5`}>
                  <Text style={tw`text-blue-700 font-semibold text-xs`}>
                    {totalTasks} task{totalTasks > 1 ? 's' : ''} ready to start
                  </Text>
                </View>
              ) : null}
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

export default DateDetails;
