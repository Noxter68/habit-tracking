import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import tw from '../lib/tailwind';
import { useHabits } from '../context/HabitContext';
import { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'HabitDetails'>;
type RouteProps = RouteProp<RootStackParamList, 'HabitDetails'>;

const HabitDetails: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { habits } = useHabits();

  const habit = habits.find((h) => h.id === route.params.habitId);

  if (!habit) {
    return null;
  }

  const progress = (habit.completedDays.length / habit.totalDays) * 100;

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-50`}>
      <View style={tw`flex-1`}>
        {/* Header */}
        <View style={tw`px-6 py-4 bg-white border-b border-slate-200 flex-row items-center`}>
          <Pressable onPress={() => navigation.goBack()} style={tw`mr-4 p-2`}>
            <Text style={tw`text-2xl`}>←</Text>
          </Pressable>
          <View>
            <Text style={tw`text-xl font-bold text-slate-800`}>{habit.name}</Text>
            <Text style={tw`text-sm text-slate-600`}>
              {habit.type === 'good' ? 'Building' : 'Quitting'} • {habit.frequency}
            </Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView style={tw`flex-1 px-6 py-4`}>
          {/* Progress Card */}
          <View style={tw`bg-white rounded-xl p-4 mb-4`}>
            <Text style={tw`text-lg font-semibold text-slate-800 mb-3`}>Progress</Text>
            <View style={tw`mb-2`}>
              <Text style={tw`text-3xl font-bold text-teal-600`}>{Math.round(progress)}%</Text>
              <Text style={tw`text-slate-600`}>
                {habit.completedDays.length} of {habit.totalDays} days completed
              </Text>
            </View>
            <View style={tw`h-3 bg-slate-100 rounded-full overflow-hidden`}>
              <View style={[tw`h-full rounded-full`, habit.type === 'good' ? tw`bg-teal-500` : tw`bg-red-500`, { width: `${progress}%` }]} />
            </View>
          </View>

          {/* Streak Stats */}
          <View style={tw`flex-row gap-4 mb-4`}>
            <View style={tw`flex-1 bg-white rounded-xl p-4`}>
              <Text style={tw`text-sm text-slate-500 mb-1`}>Current Streak</Text>
              <Text style={tw`text-2xl font-bold text-slate-800`}>{habit.currentStreak}</Text>
              <Text style={tw`text-xs text-slate-600`}>days</Text>
            </View>
            <View style={tw`flex-1 bg-white rounded-xl p-4`}>
              <Text style={tw`text-sm text-slate-500 mb-1`}>Best Streak</Text>
              <Text style={tw`text-2xl font-bold text-slate-800`}>{habit.bestStreak}</Text>
              <Text style={tw`text-xs text-slate-600`}>days</Text>
            </View>
          </View>

          {/* Calendar placeholder */}
          <View style={tw`bg-white rounded-xl p-4`}>
            <Text style={tw`text-lg font-semibold text-slate-800 mb-3`}>Calendar View</Text>
            <Text style={tw`text-slate-600 text-center py-8`}>Calendar visualization coming soon...</Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default HabitDetails;
