import React, { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Droplet, Dumbbell, Moon, BookOpen, Target, Brain, Heart, Salad } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import tw from '../../lib/tailwind';
import { GoalId } from './GoalStep';

export interface QuickHabit {
  id: string;
  icon: React.ReactNode;
  color: string;
}

const HABIT_SUGGESTIONS: Record<GoalId, QuickHabit[]> = {
  routines: [
    { id: 'morning_routine', icon: <Target size={22} color="white" strokeWidth={2} />, color: '#3b82f6' },
    { id: 'drink_water', icon: <Droplet size={22} color="white" strokeWidth={2} />, color: '#06b6d4' },
    { id: 'read_10_pages', icon: <BookOpen size={22} color="white" strokeWidth={2} />, color: '#8b5cf6' },
  ],
  bad_habits: [
    { id: 'no_phone_morning', icon: <Brain size={22} color="white" strokeWidth={2} />, color: '#ef4444' },
    { id: 'eat_healthy', icon: <Salad size={22} color="white" strokeWidth={2} />, color: '#10b981' },
    { id: 'sleep_early', icon: <Moon size={22} color="white" strokeWidth={2} />, color: '#6366f1' },
  ],
  productivity: [
    { id: 'plan_my_day', icon: <Target size={22} color="white" strokeWidth={2} />, color: '#f59e0b' },
    { id: 'read_10_pages', icon: <BookOpen size={22} color="white" strokeWidth={2} />, color: '#8b5cf6' },
    { id: 'focus_session', icon: <Brain size={22} color="white" strokeWidth={2} />, color: '#3b82f6' },
  ],
  health: [
    { id: 'drink_water', icon: <Droplet size={22} color="white" strokeWidth={2} />, color: '#06b6d4' },
    { id: 'exercise_10min', icon: <Dumbbell size={22} color="white" strokeWidth={2} />, color: '#10b981' },
    { id: 'sleep_early', icon: <Moon size={22} color="white" strokeWidth={2} />, color: '#6366f1' },
  ],
  growth: [
    { id: 'read_10_pages', icon: <BookOpen size={22} color="white" strokeWidth={2} />, color: '#8b5cf6' },
    { id: 'meditate', icon: <Heart size={22} color="white" strokeWidth={2} />, color: '#ec4899' },
    { id: 'plan_my_day', icon: <Target size={22} color="white" strokeWidth={2} />, color: '#f59e0b' },
  ],
};

interface QuickHabitStepProps {
  gradient: string[];
  selectedGoals: GoalId[];
  selectedHabit: string | null;
  onHabitChange: (habitId: string) => void;
}

const QuickHabitStep: React.FC<QuickHabitStepProps> = ({
  selectedGoals,
  selectedHabit,
  onHabitChange,
}) => {
  const { t } = useTranslation();

  const suggestions = useMemo(() => {
    const primaryGoal = selectedGoals.length > 0 ? selectedGoals[0] : 'routines';
    const habits = HABIT_SUGGESTIONS[primaryGoal] || HABIT_SUGGESTIONS.routines;
    const seen = new Set<string>();
    return habits.filter((h) => {
      if (seen.has(h.id)) return false;
      seen.add(h.id);
      return true;
    });
  }, [selectedGoals]);

  const selectHabit = async (habitId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onHabitChange(habitId);
  };

  return (
    <View style={tw`items-center gap-6`}>
      <View style={tw`items-center gap-3`}>
        <Text style={tw`text-4xl font-black text-white text-center`}>
          {t('onboarding.quickHabit.title')}
        </Text>
        <Text style={tw`text-base text-white/80 text-center leading-6 max-w-[300px]`}>
          {t('onboarding.quickHabit.subtitle')}
        </Text>
      </View>

      <View style={tw`w-full gap-3`}>
        {suggestions.map((habit) => {
          const isSelected = selectedHabit === habit.id;
          return (
            <Pressable
              key={habit.id}
              onPress={() => selectHabit(habit.id)}
              style={({ pressed }) => [
                tw`flex-row items-center gap-4 rounded-2xl px-5 py-4`,
                {
                  backgroundColor: isSelected ? `${habit.color}30` : 'rgba(255, 255, 255, 0.1)',
                  borderWidth: 2,
                  borderColor: isSelected ? habit.color : 'transparent',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View
                style={[
                  tw`w-11 h-11 rounded-full items-center justify-center`,
                  { backgroundColor: isSelected ? `${habit.color}40` : 'rgba(255, 255, 255, 0.15)' },
                ]}
              >
                {habit.icon}
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-base font-semibold text-white`}>
                  {t(`onboarding.quickHabit.habits.${habit.id}.name`)}
                </Text>
                <Text style={tw`text-xs text-white/60 mt-0.5`}>
                  {t(`onboarding.quickHabit.habits.${habit.id}.desc`)}
                </Text>
              </View>
              {isSelected && (
                <View
                  style={[
                    tw`w-6 h-6 rounded-full items-center justify-center`,
                    { backgroundColor: habit.color },
                  ]}
                >
                  <Text style={tw`text-white text-xs font-bold`}>✓</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default QuickHabitStep;
