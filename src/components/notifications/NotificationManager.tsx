// src/components/notifications/NotificationManager.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Notifications from 'expo-notifications';
import { Bell, X, ChevronRight } from 'lucide-react-native';
import tw from '../../lib/tailwind';
import TimePicker from '../TimePicker';
import { useHabits } from '../../context/HabitContext';
import { NotificationScheduleService } from '../../services/notificationScheduleService';
import { PushTokenService } from '../../services/pushTokenService';
import { useAuth } from '@/context/AuthContext';
import { NotificationPreferencesService } from '@/services/notificationPreferenceService';
import { getCategoryIcon } from '../../utils/categoryIcons';
import { supabase } from '@/lib/supabase';
import Logger from '@/utils/logger';

interface NotificationManagerProps {
  onClose: () => void;
}

interface HabitWithSchedule {
  id: string;
  name: string;
  category: string;
  type: string;
  notificationEnabled: boolean;
  notificationTime: string;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { habits, updateHabitNotification } = useHabits();
  const { user } = useAuth();

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [localHabits, setLocalHabits] = useState<HabitWithSchedule[]>([]);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [globalEnabled, setGlobalEnabled] = useState(true);

  // Consolidation: un seul useEffect pour charger toutes les données
  // Évite les appels DB dupliqués au montage
  useEffect(() => {
    if (!user) return;

    const loadAllData = async () => {
      await Promise.all([
        loadHabitsWithSchedules(),
        checkGlobalNotificationState(),
      ]);
    };

    loadAllData();
  }, [user]);

  const checkGlobalNotificationState = async () => {
    if (!user) return;
    try {
      const prefs = await NotificationPreferencesService.getPreferences(user.id);
      setGlobalEnabled(prefs.globalEnabled);
    } catch (error) {
      Logger.error('Error checking global notification state:', error);
    }
  };

  const loadHabitsWithSchedules = async (showLoading: boolean = true) => {
    if (!user) return;

    if (showLoading) {
      setIsLoading(true);
    }
    try {
      const { data: schedules, error } = await supabase.from('notification_schedules').select('habit_id, notification_time, enabled').eq('user_id', user.id);

      if (error) {
        Logger.error('Error fetching notification schedules:', error);
      }

      const scheduleMap = new Map<string, { time: string; enabled: boolean }>();

      if (schedules) {
        for (const schedule of schedules) {
          const timeStr = schedule.notification_time;
          const localTime = convertUTCTimeToLocal(timeStr);

          scheduleMap.set(schedule.habit_id, {
            time: localTime,
            enabled: schedule.enabled,
          });
        }
      }

      const habitsWithSchedules: HabitWithSchedule[] = habits.map((habit) => {
        const schedule = scheduleMap.get(habit.id);

        return {
          id: habit.id,
          name: habit.name,
          category: habit.category,
          type: habit.type,
          notificationEnabled: schedule?.enabled || habit.notifications || false,
          notificationTime: schedule?.time || habit.notificationTime || '09:00',
        };
      });

      setLocalHabits(habitsWithSchedules);
    } catch (error) {
      Logger.error('Error loading habits with schedules:', error);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  const convertUTCTimeToLocal = (utcTimeString: string): string => {
    try {
      const [hours, minutes] = utcTimeString.split(':').map(Number);
      const utcDate = new Date();
      utcDate.setUTCHours(hours, minutes, 0, 0);

      const localHours = utcDate.getHours();
      const localMinutes = utcDate.getMinutes();

      return `${localHours.toString().padStart(2, '0')}:${localMinutes.toString().padStart(2, '0')}`;
    } catch (error) {
      Logger.error('Error converting UTC time to local:', error);
      return '09:00';
    }
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '9:00 AM';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours > 12 ? hours - 12 : hours || 12;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const handleTimeChange = (habitId: string) => {
    if (showTimePicker) return;
    setSelectedHabitId(habitId);
    setShowTimePicker(true);
  };

  const getInitialTime = () => {
    if (!selectedHabitId) return { hour: 9, minute: 0 };
    const habit = localHabits.find((h) => h.id === selectedHabitId);
    if (!habit || !habit.notificationTime) return { hour: 9, minute: 0 };
    const [hour, minute] = habit.notificationTime.split(':').map(Number);
    return { hour: hour || 9, minute: minute || 0 };
  };

  const handleTimeConfirm = async (hour: number, minute: number) => {
    if (!selectedHabitId || !user) return;

    setShowTimePicker(false);
    setIsUpdating(selectedHabitId);
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    try {
      setLocalHabits((prev) => prev.map((habit) => (habit.id === selectedHabitId ? { ...habit, notificationTime: timeStr } : habit)));

      const habit = localHabits.find((h) => h.id === selectedHabitId);
      if (!habit) return;

      await updateHabitNotification(selectedHabitId, habit.notificationEnabled, timeStr);

      if (habit.notificationEnabled) {
        const isRegistered = await PushTokenService.isDeviceRegistered(user.id);
        if (!isRegistered) {
          await PushTokenService.registerDevice(user.id);
        }
        await NotificationScheduleService.scheduleHabitNotification(selectedHabitId, user.id, `${timeStr}:00`, true);
      }

      setSelectedHabitId(null);
    } catch (error) {
      Logger.error('Error updating notification time:', error);
      await loadHabitsWithSchedules(false);
      Alert.alert(t('notifications.error'), t('notifications.timeUpdateError'));
    } finally {
      setIsUpdating(null);
    }
  };

  const handleToggleNotification = async (habitId: string, enabled: boolean) => {
    if (!user) return;

    if (!globalEnabled && enabled) {
      Alert.alert(t('notifications.enableGlobalFirst'), t('notifications.enableGlobalFirstMessage'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('notifications.goToSettings'),
          onPress: () => onClose(),
        },
      ]);
      return;
    }

    setIsUpdating(habitId);

    try {
      setLocalHabits((prev) => prev.map((habit) => (habit.id === habitId ? { ...habit, notificationEnabled: enabled } : habit)));

      const habit = localHabits.find((h) => h.id === habitId);
      if (!habit) return;

      await updateHabitNotification(habitId, enabled, habit.notificationTime);

      if (enabled) {
        const { status } = await Notifications.getPermissionsAsync();
        let finalStatus = status;

        if (status !== 'granted') {
          const { status: newStatus } = await Notifications.requestPermissionsAsync();
          finalStatus = newStatus;
        }

        if (finalStatus !== 'granted') {
          Alert.alert(t('notifications.permissionRequired'), t('notifications.permissionRequiredMessage'), [
            {
              text: t('common.cancel'),
              style: 'cancel',
              onPress: () => {
                setLocalHabits((prev) => prev.map((h) => (h.id === habitId ? { ...h, notificationEnabled: false } : h)));
              },
            },
            {
              text: t('notifications.openSettings'),
              onPress: () => {
                Notifications.openSettingsAsync();
                setLocalHabits((prev) => prev.map((h) => (h.id === habitId ? { ...h, notificationEnabled: false } : h)));
              },
            },
          ]);
          return;
        }

        const isRegistered = await PushTokenService.isDeviceRegistered(user.id);
        if (!isRegistered) {
          const registered = await PushTokenService.registerDevice(user.id);
          if (!registered) {
            throw new Error('Failed to register device for push notifications');
          }
        }

        await NotificationScheduleService.scheduleHabitNotification(habitId, user.id, `${habit.notificationTime}:00`, true);
        Logger.debug('✅ Notification scheduled successfully');
      } else {
        await NotificationScheduleService.toggleNotification(habitId, user.id, false);
        Logger.debug('✅ Notification disabled successfully');
      }
    } catch (error) {
      Logger.error('Error toggling notification:', error);
      await loadHabitsWithSchedules(false);
      Alert.alert(t('notifications.error'), t('notifications.toggleError'));
    } finally {
      setIsUpdating(null);
    }
  };

  const activeCount = localHabits.filter((h) => h.notificationEnabled).length;

  if (isLoading) {
    return (
      <SafeAreaView style={tw`flex-1 bg-white`}>
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color="#52525B" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      {/* Header */}
      <View style={tw`px-6 py-5 border-b border-zinc-100`}>
        <View style={tw`flex-row items-center justify-between`}>
          <View style={tw`flex-row items-center`}>
            <View style={tw`w-10 h-10 rounded-xl bg-zinc-100 items-center justify-center mr-3`}>
              <Bell size={20} color="#52525B" strokeWidth={2.5} />
            </View>
            <View>
              <Text style={tw`text-2xl font-bold text-zinc-800`}>{t('notifications.title')}</Text>
              <Text style={tw`text-sm text-zinc-500 mt-0.5`}>
                {t('notifications.activeCount', {
                  active: activeCount,
                  total: localHabits.length,
                })}
              </Text>
            </View>
          </View>
          <Pressable onPress={onClose} style={({ pressed }) => [tw`p-2 rounded-full`, pressed && tw`bg-zinc-100`]}>
            <X size={24} color="#52525B" strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-6`} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={tw`mx-6 mt-6 p-4 ${globalEnabled ? 'bg-zinc-50 border-zinc-200' : 'bg-amber-50 border-amber-200'} rounded-2xl border`}>
          <Text style={tw`text-sm ${globalEnabled ? 'text-zinc-700' : 'text-amber-800'} leading-5`}>{globalEnabled ? t('notifications.infoBanner') : t('notifications.enableGlobalBanner')}</Text>
        </View>

        {/* Habits List */}
        <View style={tw`px-6 mt-6`}>
          {localHabits.length === 0 ? (
            <View style={tw`py-16 items-center`}>
              <View style={tw`w-20 h-20 rounded-full bg-zinc-100 items-center justify-center mb-4`}>
                <Bell size={32} color="#A1A1AA" strokeWidth={2} />
              </View>
              <Text style={tw`text-zinc-800 font-medium mb-2`}>{t('notifications.noHabits')}</Text>
              <Text style={tw`text-sm text-zinc-500 text-center`}>{t('notifications.noHabitsSubtitle')}</Text>
            </View>
          ) : (
            <View style={tw`gap-3`}>
              {localHabits.map((habit, index) => {
                const categoryIcon = getCategoryIcon(habit.category, habit.type);
                const HabitIcon = categoryIcon.icon;

                return (
                  <Animated.View key={habit.id} entering={FadeIn.delay(index * 50).duration(300)}>
                    <View style={[tw`bg-white rounded-2xl p-4 border shadow-sm`, habit.notificationEnabled ? tw`border-zinc-300` : tw`border-zinc-200`]}>
                      {/* Habit Header */}
                      <View style={tw`flex-row items-center justify-between`}>
                        <View style={tw`flex-row items-center flex-1`}>
                          <View style={[tw`w-11 h-11 rounded-xl items-center justify-center mr-3`, { backgroundColor: categoryIcon.bgColor }]}>
                            <HabitIcon size={20} color={categoryIcon.color} strokeWidth={2} />
                          </View>
                          <View style={tw`flex-1`}>
                            <Text style={tw`text-base font-semibold text-zinc-800`} numberOfLines={1}>
                              {habit.name}
                            </Text>
                            <View style={tw`flex-row items-center mt-1`}>
                              <View style={[tw`px-2 py-0.5 rounded-full`, habit.notificationEnabled ? tw`bg-zinc-200` : tw`bg-zinc-100`]}>
                                <Text style={[tw`text-xs font-medium`, habit.notificationEnabled ? tw`text-zinc-700` : tw`text-zinc-600`]}>
                                  {habit.notificationEnabled ? t('notifications.active') : t('notifications.inactive')}
                                </Text>
                              </View>
                              {habit.category && <Text style={tw`text-xs text-zinc-500 ml-2 capitalize`}>{habit.category.replace('-', ' ')}</Text>}
                            </View>
                          </View>
                        </View>
                        <Switch
                          value={habit.notificationEnabled}
                          onValueChange={(value) => handleToggleNotification(habit.id, value)}
                          trackColor={{ false: '#E4E4E7', true: '#A1A1AA' }}
                          thumbColor={habit.notificationEnabled ? '#52525B' : '#FFFFFF'}
                          disabled={isUpdating === habit.id}
                          style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
                        />
                      </View>

                      {/* Time Selector */}
                      <Pressable
                        onPress={() => handleTimeChange(habit.id)}
                        disabled={isUpdating === habit.id}
                        style={({ pressed }) => [
                          tw`flex-row items-center justify-between mt-3 py-3 px-4 rounded-xl`,
                          habit.notificationEnabled ? tw`bg-zinc-50 border border-zinc-200` : tw`bg-zinc-50 border border-zinc-100`,
                          pressed && tw`opacity-70`,
                          isUpdating === habit.id && tw`opacity-50`,
                        ]}
                      >
                        <Text style={[tw`text-sm font-medium`, habit.notificationEnabled ? tw`text-zinc-800` : tw`text-zinc-500`]}>
                          {t('notifications.dailyAt', {
                            time: formatTime(habit.notificationTime),
                          })}
                        </Text>
                        <ChevronRight size={18} color={habit.notificationEnabled ? '#52525B' : '#A1A1AA'} strokeWidth={2} />
                      </Pressable>

                      {/* Loading overlay */}
                      {isUpdating === habit.id && (
                        <View style={tw`absolute inset-0 rounded-2xl bg-white/80 items-center justify-center`}>
                          <ActivityIndicator size="small" color="#52525B" />
                        </View>
                      )}
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Time Picker Modal */}
      {showTimePicker && selectedHabitId && !isUpdating && (
        <Modal
          visible={showTimePicker}
          transparent
          animationType="none"
          onRequestClose={() => {
            setShowTimePicker(false);
            setSelectedHabitId(null);
          }}
        >
          <Animated.View entering={FadeIn.duration(200)} style={tw`flex-1`}>
            <TimePicker
              initialHour={getInitialTime().hour}
              initialMinute={getInitialTime().minute}
              onConfirm={handleTimeConfirm}
              onCancel={() => {
                setShowTimePicker(false);
                setSelectedHabitId(null);
              }}
            />
          </Animated.View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default NotificationManager;
