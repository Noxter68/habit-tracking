// src/screens/CalendarScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import tw from '../lib/tailwind';
import { useHabits } from '../context/HabitContext';
import { Habit } from '../types';
import { RootStackParamList } from '../navigation/types';

import CalendarHeader from '../components/calendar/CalendarHeader';
import HabitSelector from '../components/calendar/HabitSelector';
import StatsBar from '../components/calendar/StatsBar';
import CalendarGrid from '../components/calendar/CalendarGrid';
import DateDetails from '../components/calendar/DateDetails';
import EmptyState from '../components/calendar/EmptyState';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CalendarScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { habits, loading, refreshHabits } = useHabits();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Initialize selected habit
  useEffect(() => {
    if (habits.length > 0) {
      if (!selectedHabit) {
        setSelectedHabit(habits[0]);
      } else {
        const updatedHabit = habits.find((h) => h.id === selectedHabit.id);
        setSelectedHabit(updatedHabit || habits[0]);
      }
    } else {
      setSelectedHabit(null);
    }
  }, [habits.length]);

  const handleCreateHabit = () => {
    navigation.navigate('HabitWizard');
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + (direction === 'prev' ? -1 : 1));
      return newMonth;
    });
  };

  // Empty state
  if (habits.length === 0) {
    return (
      <SafeAreaView style={tw`flex-1 bg-stone-50`}>
        <EmptyState onCreateHabit={handleCreateHabit} />
      </SafeAreaView>
    );
  }

  if (!selectedHabit) {
    return (
      <SafeAreaView style={tw`flex-1 bg-stone-50 items-center justify-center`}>
        <Text style={tw`text-sand-500`}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-stone-50`}>
      <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshHabits} tintColor={tw.color('sand-400')} />}>
        {/* Header */}
        <CalendarHeader habit={selectedHabit} />

        {/* Habit Selector */}
        <HabitSelector habits={habits} selectedHabit={selectedHabit} onSelectHabit={setSelectedHabit} />

        {/* Stats */}
        <StatsBar habit={selectedHabit} />

        {/* Calendar */}
        <View style={tw`mx-5 mt-4 mb-6`}>
          <CalendarGrid habit={selectedHabit} currentMonth={currentMonth} selectedDate={selectedDate} onSelectDate={setSelectedDate} onNavigateMonth={navigateMonth} />

          {/* Selected Date Details */}
          <DateDetails habit={selectedHabit} selectedDate={selectedDate} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CalendarScreen;
