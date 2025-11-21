// src/components/calendar/DateDetails.tsx
import React from 'react';
import { View, Text, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sun, CheckCircle2, Flame, Calendar, Repeat, CalendarDays } from 'lucide-react-native';
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
  showStats?: boolean;
}

const DateDetails: React.FC<DateDetailsProps> = ({ habit, selectedDate, activeHoliday = null, allHolidays = [], showStats = true }) => {
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
  // NORMAL STATE - Minimalist & Gamified with Tier Theme
  // ============================================================================
  return (
    <Animated.View entering={FadeInDown.duration(400)} style={tw`mt-4`}>
      <ImageBackground
        source={theme.texture}
        style={tw`rounded-2xl overflow-hidden`}
        imageStyle={tw`opacity-70`}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[theme.gradient[0] + 'e6', theme.gradient[1] + 'dd', theme.gradient[2] + 'cc']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={tw`p-3`}
        >
          {/* Habit Name + Percentage - Top Row */}
          <View style={tw`flex-row items-center justify-between mb-1`}>
            <Text style={tw`text-white font-black text-lg flex-1 mr-2`} numberOfLines={1}>
              {habit.name}
            </Text>
            <View style={tw`bg-white/20 rounded-full px-3 py-1.5`}>
              <Text style={tw`text-white text-base font-black`}>{percentage}%</Text>
            </View>
          </View>

          {/* Frequency Badge + Today Badge - Second Row */}
          <View style={tw`flex-row items-center mb-3`}>
            <View style={tw`flex-row items-center bg-white/20 border border-white/30 rounded-full px-2 py-0.5`}>
              {habit.frequency === 'weekly' ? (
                <CalendarDays size={10} color="#fff" strokeWidth={2.5} />
              ) : (
                <Repeat size={10} color="#fff" strokeWidth={2.5} />
              )}
              <Text style={tw`text-white text-[9px] font-bold ml-1 uppercase`}>
                {habit.frequency === 'weekly' ? t('calendar.frequency.weekly') : t('calendar.frequency.daily')}
              </Text>
            </View>
            {isToday && (
              <View style={tw`ml-1.5 bg-white/20 rounded-full px-1.5 py-0.5`}>
                <Text style={tw`text-white text-[9px] font-bold uppercase`}>{t('calendar.today')}</Text>
              </View>
            )}
          </View>

          {/* Stats Row - Duolingo Style with Icons Above */}
          {showStats && (
            <View style={tw`flex-row justify-between`}>
              <View style={tw`items-center flex-1`}>
                <Flame size={22} color="#fff" fill="#fff" />
                <Text style={tw`text-xl font-black text-white mt-1`}>{habit.currentStreak}</Text>
                <Text style={tw`text-xs font-bold text-white/70`}>{t('calendar.stats.current')}</Text>
              </View>
              <View style={tw`items-center flex-1`}>
                <Flame size={22} color="#fff" fill="#fff" />
                <Text style={tw`text-xl font-black text-white mt-1`}>{habit.bestStreak}</Text>
                <Text style={tw`text-xs font-bold text-white/70`}>{t('calendar.stats.best')}</Text>
              </View>
              <View style={tw`items-center flex-1`}>
                <Calendar size={20} color="#fff" fill="#fff" />
                <Text style={tw`text-xl font-black text-white mt-1`}>{habit.completedDays.length}</Text>
                <Text style={tw`text-xs font-bold text-white/70`}>{t('calendar.stats.total')}</Text>
              </View>
            </View>
          )}
        </LinearGradient>
      </ImageBackground>
    </Animated.View>
  );
};

export default DateDetails;
