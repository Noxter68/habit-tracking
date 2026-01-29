import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { RotateCcw, ShieldOff, Heart, Rocket, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import tw from '../../lib/tailwind';

export type GoalId = 'routines' | 'bad_habits' | 'productivity' | 'health' | 'growth';

interface GoalOption {
  id: GoalId;
  icon: React.ReactNode;
  color: string;
}

const GOAL_OPTIONS: GoalOption[] = [
  { id: 'routines', icon: <RotateCcw size={22} color="white" strokeWidth={2} />, color: '#3b82f6' },
  { id: 'bad_habits', icon: <ShieldOff size={22} color="white" strokeWidth={2} />, color: '#ef4444' },
  { id: 'productivity', icon: <Rocket size={22} color="white" strokeWidth={2} />, color: '#f59e0b' },
  { id: 'health', icon: <Heart size={22} color="white" strokeWidth={2} />, color: '#10b981' },
  { id: 'growth', icon: <Sparkles size={22} color="white" strokeWidth={2} />, color: '#8b5cf6' },
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
                tw`flex-row items-center gap-4 rounded-2xl px-5 py-3`,
                {
                  backgroundColor: isSelected ? `${goal.color}30` : 'rgba(255, 255, 255, 0.1)',
                  borderWidth: 2,
                  borderColor: isSelected ? goal.color : 'transparent',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View
                style={[
                  tw`w-10 h-10 rounded-full items-center justify-center`,
                  { backgroundColor: isSelected ? `${goal.color}40` : 'rgba(255, 255, 255, 0.15)' },
                ]}
              >
                {goal.icon}
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
