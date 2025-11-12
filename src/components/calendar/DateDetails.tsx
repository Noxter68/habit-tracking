// src/components/calendar/DateDetails.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sun, CheckCircle2, Clock } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation();
  const dateString = getLocalDateString(selectedDate);
  const dayTasks = habit.dailyTasks[dateString];
  const totalTasks = habit.tasks?.length || 0;
  const completedTaskIds = dayTasks?.completedTasks || [];
  const completedCount = completedTaskIds.length;

  const { tier } = HabitProgressionService.calculateTierFromStreak(habit.currentStreak);
  const theme = tierThemes[tier.name];

  const taskIds = habit.tasks.map((t) => t.id);
  const isHoliday = HolidayModeService.isDateInAnyHoliday(selectedDate, allHolidays, habit.id, taskIds);

  const isActiveHoliday = HolidayModeService.isDateInHoliday(selectedDate, activeHoliday, habit.id, taskIds);

  const holidayInfo = HolidayModeService.getHolidayInfoForDate(selectedDate, activeHoliday, habit.id);

  const isCompleted = dayTasks?.allCompleted || false;
  const isPartial = completedCount > 0 && !isCompleted;
  const percentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const checkDate = new Date(selectedDate);
  checkDate.setHours(0, 0, 0, 0);

  const creationDate = new Date(habit.createdAt);
  creationDate.setHours(0, 0, 0, 0);

  const beforeCreation = checkDate.getTime() < creationDate.getTime();

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const isPast = checkDate < now && !isHoliday;
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const formattedDate = selectedDate.toLocaleDateString(i18n.language, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // ============================================================================
  // HOLIDAY STATE - Active Holiday
  // ============================================================================
  if (isHoliday) {
    if (isActiveHoliday && holidayInfo.isHoliday) {
      return (
        <Animated.View entering={FadeInDown.duration(400)} style={tw`mt-4`}>
          <LinearGradient colors={['#fbbf24', '#f59e0b', '#d97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-2xl p-4 shadow-lg`}>
            <View style={tw`flex-row items-center mb-3`}>
              <View style={tw`w-12 h-12 bg-white/30 rounded-full items-center justify-center mr-3`}>
                <Sun size={24} color="#FFFFFF" strokeWidth={2} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-lg font-black text-white`}>{t('calendar.holiday.mode')}</Text>
                <Text style={tw`text-white/90 text-xs`}>{holidayInfo.message}</Text>
              </View>
            </View>

            <View style={tw`bg-white/20 rounded-xl p-3`}>
              <Text style={tw`text-white font-semibold text-sm text-center mb-1`}>{t('calendar.messages.yourStreakSafe')}</Text>
              <Text style={tw`text-white/90 text-xs text-center`}>{t('calendar.messages.trackingPaused')}</Text>
            </View>
          </LinearGradient>
        </Animated.View>
      );
    }

    // Past holiday
    return (
      <Animated.View entering={FadeInDown.duration(400)} style={tw`mt-4`}>
        <View style={tw`bg-amber-50 rounded-2xl p-4 border border-amber-200`}>
          <View style={tw`flex-row items-center justify-center mb-2`}>
            <View style={tw`bg-white rounded-full p-2 mr-2 shadow-sm`}>
              <Sun size={18} color="#f59e0b" strokeWidth={2} />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-amber-900 font-bold text-sm`}>{t('calendar.status.holidayPeriod')}</Text>
              <Text style={tw`text-amber-700 text-xs`}>
                {selectedDate.toLocaleDateString(i18n.language, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>

          <View style={tw`bg-white/60 rounded-lg p-2.5 mt-2`}>
            <Text style={tw`text-amber-800 text-xs text-center font-medium`}>{t('calendar.messages.streakPreserved')}</Text>
          </View>

          {completedCount > 0 && (
            <View style={tw`mt-3 pt-3 border-t border-amber-200`}>
              <Text style={tw`text-amber-800 text-xs font-semibold mb-2`}>
                {t('calendar.messages.tasksCompleted', {
                  completed: completedCount,
                  total: totalTasks,
                })}
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
  // BEFORE CREATION STATE
  // ============================================================================
  if (beforeCreation) {
    return (
      <Animated.View entering={FadeInDown.duration(400)} style={tw`mt-4`}>
        <View style={tw`bg-gray-50 rounded-2xl p-4 border border-gray-200`}>
          <Text style={tw`text-xs text-gray-400 text-center mb-1`}>{formattedDate}</Text>
          <Text style={tw`text-gray-500 text-center font-medium text-sm`}>{t('calendar.messages.habitNotCreated')}</Text>
          <Text style={tw`text-xs text-gray-400 text-center mt-1`}>
            {t('calendar.messages.createdOn')}{' '}
            {new Date(habit.createdAt).toLocaleDateString(i18n.language, {
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
  // NORMAL STATE
  // ============================================================================
  return (
    <Animated.View entering={FadeInDown.duration(400)} style={tw`mt-4`}>
      <View style={tw`bg-white rounded-2xl shadow-lg overflow-hidden`}>
        {/* Header */}
        <LinearGradient
          colors={isCompleted ? ['#10b981', '#059669'] : isPartial ? ['#f59e0b', '#d97706'] : isPast ? ['#ef4444', '#dc2626'] : [theme.accent, theme.accent + 'dd']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={tw`p-3.5`}
        >
          <View style={tw`flex-row items-center justify-between mb-2`}>
            <View style={tw`flex-1`}>
              <Text style={tw`text-white text-base font-bold`}>
                {selectedDate.toLocaleDateString(i18n.language, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
              <Text style={tw`text-white/70 text-xs`}>{selectedDate.toLocaleDateString(i18n.language, { weekday: 'long' })}</Text>
            </View>

            {/* Status Badges */}
            <View style={tw`flex-row`}>
              {isToday && (
                <View style={tw`bg-white/30 px-2 py-0.5 rounded-full mr-1`}>
                  <Text style={tw`text-white text-xs font-bold`}>{t('calendar.today').toUpperCase()}</Text>
                </View>
              )}
              <View style={tw`bg-white/30 px-2 py-0.5 rounded-full flex-row items-center`}>
                {isCompleted ? (
                  <>
                    <CheckCircle2 size={10} color="#ffffff" strokeWidth={3} />
                    <Text style={tw`text-white text-xs font-bold ml-1`}>{t('calendar.status.complete').toUpperCase()}</Text>
                  </>
                ) : isPartial ? (
                  <>
                    <Clock size={10} color="#ffffff" strokeWidth={2.5} />
                    <Text style={tw`text-white text-xs font-bold ml-1`}>
                      {completedCount}/{totalTasks}
                    </Text>
                  </>
                ) : isPast && !isHoliday ? (
                  <Text style={tw`text-white text-xs font-bold`}>{t('calendar.status.missed').toUpperCase()}</Text>
                ) : (
                  <Text style={tw`text-white text-xs font-bold`}>TODO</Text>
                )}
              </View>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={tw`h-1.5 bg-white/20 rounded-full overflow-hidden`}>
            <Animated.View entering={FadeIn.duration(600)} style={[tw`h-full bg-white rounded-full`, { width: `${percentage}%` }]} />
          </View>
        </LinearGradient>

        {/* Task List */}
        <View style={tw`p-3.5`}>
          {habit.tasks.length === 0 ? (
            <Text style={tw`text-gray-400 text-xs text-center py-2`}>{t('calendar.messages.noTasksDefined')}</Text>
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
                    <View style={tw`mr-2.5`}>
                      {isTaskCompleted ? (
                        <View style={tw`w-5 h-5 rounded-full bg-green-500 items-center justify-center`}>
                          <CheckCircle2 size={12} color="#ffffff" strokeWidth={3} />
                        </View>
                      ) : (
                        <View style={tw`w-5 h-5 rounded-full border-2 border-gray-300`} />
                      )}
                    </View>

                    <View style={tw`flex-1`}>
                      <Text style={[tw`text-sm font-semibold`, isTaskCompleted ? tw`text-green-700` : tw`text-gray-700`]}>{task.name}</Text>
                      {task.description && <Text style={[tw`text-xs mt-0.5`, isTaskCompleted ? tw`text-green-600` : tw`text-gray-500`]}>{task.description}</Text>}
                    </View>

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

          {/* Summary */}
          {totalTasks > 0 && !isCompleted && (
            <View style={tw`mt-2 pt-2 border-t border-gray-100`}>
              {isPartial ? (
                <View style={tw`bg-amber-50 rounded-lg p-2.5`}>
                  <Text style={tw`text-amber-700 font-semibold text-xs`}>
                    {t('calendar.messages.tasksRemaining', {
                      count: totalTasks - completedCount,
                    })}
                  </Text>
                </View>
              ) : isPast && !isHoliday ? (
                <View style={tw`bg-red-50 rounded-lg p-2.5`}>
                  <Text style={tw`text-red-700 font-semibold text-xs`}>{t('calendar.messages.missed')}</Text>
                </View>
              ) : (
                <View style={tw`bg-blue-50 rounded-lg p-2.5`}>
                  <Text style={tw`text-blue-700 font-semibold text-xs`}>{t('calendar.messages.tasksReady', { count: totalTasks })}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

export default DateDetails;
