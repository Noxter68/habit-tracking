import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { CalendarCheck, ShieldBan, Zap, HeartPulse, TrendingUp } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import tw from '../../lib/tailwind';

export type GoalId = 'routines' | 'bad_habits' | 'productivity' | 'health' | 'growth';

interface GoalOption {
  id: GoalId;
  icon: React.ReactNode;
  selectedIcon: React.ReactNode;
  color: string;
}

const GOAL_OPTIONS: GoalOption[] = [
  {
    id: 'routines',
    icon: <CalendarCheck size={24} color="rgba(255,255,255,0.8)" strokeWidth={1.8} />,
    selectedIcon: <CalendarCheck size={24} color="white" strokeWidth={2} />,
    color: '#3b82f6',
  },
  {
    id: 'bad_habits',
    icon: <ShieldBan size={24} color="rgba(255,255,255,0.8)" strokeWidth={1.8} />,
    selectedIcon: <ShieldBan size={24} color="white" strokeWidth={2} />,
    color: '#ef4444',
  },
  {
    id: 'productivity',
    icon: <Zap size={24} color="rgba(255,255,255,0.8)" strokeWidth={1.8} />,
    selectedIcon: <Zap size={24} color="white" strokeWidth={2} />,
    color: '#f59e0b',
  },
  {
    id: 'health',
    icon: <HeartPulse size={24} color="rgba(255,255,255,0.8)" strokeWidth={1.8} />,
    selectedIcon: <HeartPulse size={24} color="white" strokeWidth={2} />,
    color: '#10b981',
  },
  {
    id: 'growth',
    icon: <TrendingUp size={24} color="rgba(255,255,255,0.8)" strokeWidth={1.8} />,
    selectedIcon: <TrendingUp size={24} color="white" strokeWidth={2} />,
    color: '#8b5cf6',
  },
];

interface GoalStepProps {
  gradient: string[];
  selectedGoals: GoalId[];
  onGoalsChange: (goals: GoalId[]) => void;
}

const GoalStep: React.FC<GoalStepProps> = ({ gradient, selectedGoals, onGoalsChange }) => {
  const { t } = useTranslation();

  const toggleGoal = async (goalId: GoalId) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedGoals.includes(goalId)) {
      onGoalsChange(selectedGoals.filter((g) => g !== goalId));
    } else {
      onGoalsChange([...selectedGoals, goalId]);
    }
  };

  return (
    <View style={tw`items-center gap-6`}>
      <View style={tw`items-center gap-3`}>
        <Text style={tw`text-4xl font-black text-white text-center`}>
          {t('onboarding.goals.title')}
        </Text>
        <Text style={tw`text-base text-white/80 text-center leading-6 max-w-[300px]`}>
          {t('onboarding.goals.subtitle')}
        </Text>
      </View>

      <View style={tw`w-full gap-3`}>
        {GOAL_OPTIONS.map((goal) => {
          const isSelected = selectedGoals.includes(goal.id);
          return (
            <Pressable
              key={goal.id}
              onPress={() => toggleGoal(goal.id)}
              style={({ pressed }) => [
                tw`flex-row items-center gap-4 rounded-2xl px-5 py-3.5`,
                {
                  backgroundColor: isSelected ? `${goal.color}20` : 'rgba(255, 255, 255, 0.08)',
                  borderWidth: 1.5,
                  borderColor: isSelected ? `${goal.color}90` : 'rgba(255, 255, 255, 0.1)',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View
                style={[
                  tw`w-11 h-11 rounded-xl items-center justify-center`,
                  {
                    backgroundColor: isSelected ? `${goal.color}35` : 'rgba(255, 255, 255, 0.1)',
                  },
                ]}
              >
                {isSelected ? goal.selectedIcon : goal.icon}
              </View>
              <Text style={tw`text-base font-semibold text-white flex-1`}>
                {t(`onboarding.goals.options.${goal.id}`)}
              </Text>
              {isSelected && (
                <View
                  style={[
                    tw`w-6 h-6 rounded-full items-center justify-center`,
                    { backgroundColor: goal.color },
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

export default GoalStep;
