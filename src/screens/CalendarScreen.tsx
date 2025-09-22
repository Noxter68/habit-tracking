// src/screens/CalendarScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import tw from '../lib/tailwind';
import { useHabits } from '../context/HabitContext';
import CalendarView from '../components/CalendarView';
import HabitSelector from '../components/calendar/HabitSelector';
import DynamicCalendarHeader from '../components/calendar/DynamicCalendarHeader';
import { Habit } from '../types';
import { Dumbbell, Heart, Apple, BookOpen, Zap, Brain, Moon, Droplets, Cigarette, Ban, ShoppingBag, Smartphone, Clock, ThumbsDown, Beer, Bed, Target } from 'lucide-react-native';

const { height: screenHeight } = Dimensions.get('window');

// Helper function to get local date string
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CalendarScreen: React.FC = () => {
  const { habits, loading, refreshHabits } = useHabits();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // Always default to current day
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  useEffect(() => {
    // Reset to current day when component mounts or habits change
    setSelectedDate(new Date());

    if (habits.length > 0) {
      if (!selectedHabit) {
        setSelectedHabit(habits[0]);
      } else {
        const updatedHabit = habits.find((h) => h.id === selectedHabit.id);
        if (updatedHabit) {
          setSelectedHabit(updatedHabit);
        }
      }
    } else {
      setSelectedHabit(null);
    }
  }, [habits]);

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, { icon: any; color: string }> = {
      fitness: { icon: Dumbbell, color: '#ef4444' },
      health: { icon: Heart, color: '#ec4899' },
      nutrition: { icon: Apple, color: '#84cc16' },
      learning: { icon: BookOpen, color: '#3b82f6' },
      productivity: { icon: Zap, color: '#f59e0b' },
      mindfulness: { icon: Brain, color: '#8b5cf6' },
      sleep: { icon: Moon, color: '#6366f1' },
      hydration: { icon: Droplets, color: '#06b6d4' },
      smoking: { icon: Cigarette, color: '#dc2626' },
      'junk-food': { icon: Ban, color: '#f97316' },
      shopping: { icon: ShoppingBag, color: '#ec4899' },
      'screen-time': { icon: Smartphone, color: '#6b7280' },
      procrastination: { icon: Clock, color: '#f59e0b' },
      'negative-thinking': { icon: ThumbsDown, color: '#7c3aed' },
      alcohol: { icon: Beer, color: '#ca8a04' },
      oversleeping: { icon: Bed, color: '#64748b' },
    };
    return icons[category] || { icon: Target, color: '#6b7280' };
  };

  // Dynamic header height - adjusted for larger text/icons
  const headerHeight = selectedHabit ? 125 : 65;

  if (habits.length === 0) {
    // Compact empty state
    return (
      <SafeAreaView style={tw`flex-1 bg-gray-50`}>
        <View style={tw`flex-1 items-center justify-center px-8`}>
          <View style={tw`w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-4`}>
            <Plus size={32} color="#9ca3af" strokeWidth={1.5} />
          </View>
          <Text style={tw`text-xl font-bold text-gray-900 mb-2`}>No habits yet</Text>
          <Text style={tw`text-sm text-gray-500 text-center`}>Create your first habit to start tracking</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <View style={tw`flex-1`}>
        {/* Fixed Compact Header */}
        <DynamicCalendarHeader selectedHabit={selectedHabit} selectedDate={selectedDate} getLocalDateString={getLocalDateString} />

        {/* Habit Selector - Overlaid at top of content */}
        <View style={tw`bg-white shadow-sm`}>
          <HabitSelector habits={habits} selectedHabit={selectedHabit} onSelectHabit={setSelectedHabit} getCategoryIcon={getCategoryIcon} />
        </View>

        {/* Main Content */}
        <ScrollView
          style={tw`flex-1`}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshHabits} tintColor="#6366f1" progressViewOffset={20} />}
        >
          {selectedHabit && (
            <Animated.View entering={FadeInDown.delay(100).duration(300)} style={tw`px-4 pt-4 pb-6`}>
              <CalendarView key={selectedHabit.id} habit={selectedHabit} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
            </Animated.View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default CalendarScreen;
