import React from 'react';
import { View, Text } from 'react-native';
import { CheckCircle2, ClipboardCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import tw from '../../lib/tailwind';
import { GoalId } from './GoalStep';

interface CelebrationStepProps {
  gradient: string[];
  selectedGoals: GoalId[];
  selectedHabitName: string | null;
}

const CelebrationStep: React.FC<CelebrationStepProps> = ({
  selectedGoals,
  selectedHabitName,
}) => {
  const { t } = useTranslation();

  const goalKey = selectedGoals.length > 0 ? selectedGoals[0] : 'routines';

  return (
    <View style={tw`items-center gap-8`}>
      <View style={tw`items-center`}>
        <View
          style={[
            tw`w-24 h-24 rounded-full items-center justify-center`,
            {
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              shadowColor: '#10b981',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.5,
              shadowRadius: 16,
              elevation: 10,
            },
          ]}
        >
          <CheckCircle2 size={48} color="#10b981" strokeWidth={2} />
        </View>
      </View>

      <View style={tw`items-center gap-3`}>
        <Text style={tw`text-4xl font-black text-white text-center`}>
          {t('onboarding.celebration.title')}
        </Text>
        <Text style={tw`text-base text-white/80 text-center leading-6 max-w-[300px]`}>
          {t('onboarding.celebration.subtitle')}
        </Text>
      </View>

      <View
        style={[
          tw`w-full rounded-3xl p-6 gap-4`,
          {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
          },
        ]}
      >
        <View style={tw`flex-row items-center gap-2 mb-1`}>
          <ClipboardCheck size={18} color="#fbbf24" strokeWidth={2} />
          <Text style={tw`text-sm font-bold text-amber-300`}>
            {t('onboarding.celebration.recap')}
          </Text>
        </View>

        <View style={tw`gap-3`}>
          <View style={tw`flex-row items-center gap-3`}>
            <View style={[tw`w-2 h-2 rounded-full`, { backgroundColor: '#10b981' }]} />
            <Text style={tw`text-sm text-white/80`}>
              {t('onboarding.celebration.goalLabel')}{' '}
              <Text style={tw`font-bold text-white`}>
                {t(`onboarding.goals.options.${goalKey}`)}
              </Text>
            </Text>
          </View>

          {selectedHabitName && (
            <View style={tw`flex-row items-center gap-3`}>
              <View style={[tw`w-2 h-2 rounded-full`, { backgroundColor: '#3b82f6' }]} />
              <Text style={tw`text-sm text-white/80`}>
                {t('onboarding.celebration.habitLabel')}{' '}
                <Text style={tw`font-bold text-white`}>{selectedHabitName}</Text>
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default CelebrationStep;
