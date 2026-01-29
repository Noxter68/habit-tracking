import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { RefreshCw, Bell, Battery, HelpCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import tw from '../../lib/tailwind';

export type ChallengeId = 'consistency' | 'forgetting' | 'motivation' | 'starting';

interface ChallengeOption {
  id: ChallengeId;
  icon: React.ReactNode;
  color: string;
}

const CHALLENGE_OPTIONS: ChallengeOption[] = [
  { id: 'consistency', icon: <RefreshCw size={22} color="white" strokeWidth={2} />, color: '#f59e0b' },
  { id: 'forgetting', icon: <Bell size={22} color="white" strokeWidth={2} />, color: '#3b82f6' },
  { id: 'motivation', icon: <Battery size={22} color="white" strokeWidth={2} />, color: '#ef4444' },
  { id: 'starting', icon: <HelpCircle size={22} color="white" strokeWidth={2} />, color: '#8b5cf6' },
];

interface MotivationStepProps {
  gradient: string[];
  selectedChallenge: ChallengeId | null;
  onChallengeChange: (challenge: ChallengeId) => void;
}

const MotivationStep: React.FC<MotivationStepProps> = ({ selectedChallenge, onChallengeChange }) => {
  const { t } = useTranslation();

  const selectChallenge = async (id: ChallengeId) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChallengeChange(id);
  };

  return (
    <View style={tw`items-center gap-6`}>
      <View style={tw`items-center gap-3`}>
        <Text style={tw`text-4xl font-black text-white text-center`}>
          {t('onboarding.motivation.title')}
        </Text>
        <Text style={tw`text-base text-white/80 text-center leading-6 max-w-[300px]`}>
          {t('onboarding.motivation.subtitle')}
        </Text>
      </View>

      <View style={tw`w-full gap-3`}>
        {CHALLENGE_OPTIONS.map((challenge) => {
          const isSelected = selectedChallenge === challenge.id;
          return (
            <Pressable
              key={challenge.id}
              onPress={() => selectChallenge(challenge.id)}
              style={({ pressed }) => [
                tw`flex-row items-center gap-4 rounded-2xl px-5 py-3`,
                {
                  backgroundColor: isSelected ? `${challenge.color}30` : 'rgba(255, 255, 255, 0.1)',
                  borderWidth: 2,
                  borderColor: isSelected ? challenge.color : 'transparent',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View
                style={[
                  tw`w-10 h-10 rounded-full items-center justify-center`,
                  { backgroundColor: isSelected ? `${challenge.color}40` : 'rgba(255, 255, 255, 0.15)' },
                ]}
              >
                {challenge.icon}
              </View>
              <Text style={tw`text-base font-semibold text-white flex-1`}>
                {t(`onboarding.motivation.options.${challenge.id}`)}
              </Text>
              {isSelected && (
                <View
                  style={[
                    tw`w-6 h-6 rounded-full items-center justify-center`,
                    { backgroundColor: challenge.color },
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

export default MotivationStep;
