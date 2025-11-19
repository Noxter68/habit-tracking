/**
 * ============================================================================
 * CalendarScreen.tsx
 * ============================================================================
 *
 * Ecran calendrier affichant l'historique des habitudes sous forme de grille
 * mensuelle. Permet de visualiser la progression, les séries et les périodes
 * de vacances pour chaque habitude.
 *
 * Fonctionnalités principales:
 * - Affichage du calendrier mensuel avec navigation
 * - Sélection et changement d'habitude
 * - Visualisation des statistiques de l'habitude
 * - Gestion des périodes de vacances (Holiday Mode)
 * - Détails de la date sélectionnée
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, RefreshControl, Text, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react-native';

import CalendarHeader from '../components/calendar/CalendarHeader';
import HabitSelector from '../components/calendar/HabitSelector';
import StatsBar from '../components/calendar/StatsBar';
import CalendarGrid from '../components/calendar/CalendarGrid';
import DateDetails from '../components/calendar/DateDetails';
import EmptyState from '../components/shared/EmptyState';

import { useAuth } from '../context/AuthContext';
import { useHabits } from '../context/HabitContext';

import { HolidayModeService } from '../services/holidayModeService';

import tw from '../lib/tailwind';
import { getTaskDetails } from '../utils/taskHelpers';
import { HapticFeedback } from '../utils/haptics';
import Logger from '@/utils/logger';

import { Habit } from '../types';
import { HolidayPeriod } from '../types/holiday.types';
import { RootStackParamList } from '../navigation/types';

// ============================================================================
// TYPES
// ============================================================================

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const CalendarScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { habits, loading, refreshHabits } = useHabits();

  // ============================================================================
  // HOOKS - State
  // ============================================================================

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeHoliday, setActiveHoliday] = useState<HolidayPeriod | null>(null);
  const [holidayLoading, setHolidayLoading] = useState(false);
  const [allHolidays, setAllHolidays] = useState<HolidayPeriod[]>([]);

  // ============================================================================
  // HOOKS - useCallback
  // ============================================================================

  /**
   * Normalise les tâches d'une habitude en récupérant les détails complets
   * si elles sont stockées sous forme d'IDs
   */
  const normalizeHabitTasks = useCallback((habit: Habit): Habit => {
    if (!habit || !Array.isArray(habit.tasks) || habit.tasks.length === 0) {
      return habit;
    }

    const firstTask = habit.tasks[0];
    if (typeof firstTask === 'string') {
      const normalizedTasks = getTaskDetails(habit.tasks, habit.category, habit.type);
      return {
        ...habit,
        tasks: normalizedTasks,
      };
    }

    return habit;
  }, []);

  /**
   * Charge les périodes de vacances depuis la base de données
   * Récupère à la fois la période active et l'historique complet
   */
  const loadHoliday = useCallback(async () => {
    if (!user?.id) return;

    try {
      setHolidayLoading(true);

      const [activeHolidayData, allHolidaysData] = await Promise.all([
        HolidayModeService.getActiveHoliday(user.id),
        HolidayModeService.getAllHolidays(user.id)
      ]);

      Logger.debug('Loaded holidays from database:', {
        active: activeHolidayData?.id,
        total: allHolidaysData.length,
        allHolidays: allHolidaysData.map((h) => ({
          id: h.id,
          startDate: h.startDate,
          endDate: h.endDate,
          isActive: h.isActive,
          deactivatedAt: h.deactivatedAt,
        })),
      });

      setActiveHoliday(activeHolidayData);
      setAllHolidays(allHolidaysData);
    } catch (error) {
      Logger.error('Error loading holidays:', error);
      setActiveHoliday(null);
      setAllHolidays([]);
    } finally {
      setHolidayLoading(false);
    }
  }, [user?.id]);

  /**
   * Gère la sélection d'une habitude avec normalisation des tâches
   */
  const handleHabitSelect = useCallback(
    (habit: Habit) => {
      HapticFeedback.selection();
      setSelectedHabit(normalizeHabitTasks(habit));
    },
    [normalizeHabitTasks]
  );

  /**
   * Gère la sélection d'une date avec retour haptique
   */
  const handleDateSelect = useCallback((date: Date) => {
    HapticFeedback.light();
    setSelectedDate(date);
  }, []);

  // ============================================================================
  // HOOKS - useEffect
  // ============================================================================

  // Initialise et met à jour l'habitude sélectionnée
  useEffect(() => {
    if (habits.length > 0) {
      if (!selectedHabit) {
        setSelectedHabit(normalizeHabitTasks(habits[0]));
      } else {
        const updatedHabit = habits.find((h) => h.id === selectedHabit.id);
        if (updatedHabit) {
          setSelectedHabit(normalizeHabitTasks(updatedHabit));
        } else {
          setSelectedHabit(normalizeHabitTasks(habits[0]));
        }
      }
    } else {
      setSelectedHabit(null);
    }
  }, [habits, normalizeHabitTasks]);

  // Charge les vacances au montage et quand l'utilisateur change
  useEffect(() => {
    loadHoliday();
  }, [loadHoliday]);

  // Rafraîchit les vacances quand l'écran reprend le focus
  useFocusEffect(
    useCallback(() => {
      Logger.debug('Screen focused - reloading holidays');
      loadHoliday();
    }, [loadHoliday])
  );

  // ============================================================================
  // GESTIONNAIRES D'EVENEMENTS
  // ============================================================================

  /**
   * Navigue vers l'écran de création d'habitude
   */
  const handleCreateHabit = () => {
    HapticFeedback.light();
    navigation.navigate('HabitWizard');
  };

  /**
   * Rafraîchit les données (habitudes et vacances)
   */
  const handleRefresh = async () => {
    HapticFeedback.light();
    Logger.debug('Manual refresh triggered');
    await Promise.all([refreshHabits(), loadHoliday()]);
  };

  /**
   * Navigue au mois précédent ou suivant
   */
  const navigateMonth = (direction: 'prev' | 'next') => {
    HapticFeedback.light();
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev.getFullYear(), prev.getMonth(), 1);

      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }

      Logger.debug('Month navigation:', {
        from: prev.toISOString().split('T')[0],
        to: newMonth.toISOString().split('T')[0],
        direction,
      });

      return newMonth;
    });
  };

  // ============================================================================
  // RENDU - États spéciaux
  // ============================================================================

  // État vide - aucune habitude
  if (habits.length === 0) {
    return (
      <ImageBackground
        source={require('../../assets/interface/textures/texture-white.png')}
        style={tw`flex-1`}
        imageStyle={{ opacity: 0.1 }}
        resizeMode="repeat"
      >
        <SafeAreaView style={tw`flex-1 bg-transparent`}>
          <EmptyState
            icon={Plus}
            iconColor="#9ca3af"
            title={t('calendar.emptyState.title')}
            description={t('calendar.emptyState.description')}
            actions={[{ label: t('calendar.emptyState.button'), onPress: handleCreateHabit }]}
            useGradient
            gradientColors={['#9CA3AF', '#6B7280']}
            animated
          />
        </SafeAreaView>
      </ImageBackground>
    );
  }

  // État de chargement - habitude non encore sélectionnée
  if (!selectedHabit) {
    return (
      <ImageBackground
        source={require('../../assets/interface/textures/texture-white.png')}
        style={tw`flex-1`}
        imageStyle={{ opacity: 0.15 }}
        resizeMode="repeat"
      >
        <SafeAreaView style={tw`flex-1 bg-transparent items-center justify-center`}>
          <Text style={tw`text-sand-500`}>Loading...</Text>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  // ============================================================================
  // RENDU PRINCIPAL
  // ============================================================================

  return (
    <ImageBackground
      source={require('../../assets/interface/textures/texture-white.png')}
      style={tw`flex-1`}
      imageStyle={{ opacity: 0.15 }}
      resizeMode="repeat"
    >
      <SafeAreaView style={tw`flex-1 bg-transparent`}>
        <ScrollView
          style={tw`flex-1`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`pb-20`}
          refreshControl={
            <RefreshControl
              refreshing={loading || holidayLoading}
              onRefresh={handleRefresh}
              tintColor={tw.color('sand-400')}
            />
          }
        >
          {/* En-tête avec nom de l'habitude */}
          <CalendarHeader habit={selectedHabit} />

          {/* Sélecteur d'habitude */}
          <HabitSelector
            habits={habits}
            selectedHabit={selectedHabit}
            onSelectHabit={handleHabitSelect}
          />

          {/* Barre de statistiques */}
          <StatsBar habit={selectedHabit} />

          {/* Grille du calendrier et détails */}
          <View style={tw`mx-5 mt-4 mb-6`}>
            <CalendarGrid
              habit={selectedHabit}
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              onSelectDate={handleDateSelect}
              onNavigateMonth={navigateMonth}
              activeHoliday={activeHoliday}
              allHolidays={allHolidays}
            />

            {/* Détails de la date sélectionnée */}
            <DateDetails
              habit={selectedHabit}
              selectedDate={selectedDate}
              activeHoliday={activeHoliday}
              allHolidays={allHolidays}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

export default CalendarScreen;
