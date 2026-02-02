import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { BellRing, Timer, ShieldCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import tw from '../../lib/tailwind';
import { ChallengeId } from './MotivationStep';

interface NotificationStepProps {
  gradient: string[];
  selectedChallenge: ChallengeId | null;
  onEnableNotifications: () => void;
  onSkipNotifications: () => void;
}

const FEATURES = [
  {
    icon: <BellRing size={22} color="#60a5fa" strokeWidth={1.8} />,
    titleKey: 'smartReminders',
    descKey: 'smartRemindersDesc',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  {
    icon: <Timer size={22} color="#34d399" strokeWidth={1.8} />,
    titleKey: 'perfectTiming',
    descKey: 'perfectTimingDesc',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  {
    icon: <ShieldCheck size={22} color="#a78bfa" strokeWidth={1.8} />,
    titleKey: 'noSpam',
    descKey: 'noSpamDesc',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
];

const NotificationStep: React.FC<NotificationStepProps> = ({
  selectedChallenge,
  onEnableNotifications,
  onSkipNotifications,
}) => {
  const { t } = useTranslation();

  const subtitleKey = selectedChallenge === 'forgetting'
    ? 'onboarding.notifications.subtitleForgetting'
    : 'onboarding.notifications.subtitle';

  const handleEnable = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onEnableNotifications();
  };

  const handleSkip = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSkipNotifications();
  };

  return (
    <View style={tw`items-center gap-10`}>
      <View style={tw`items-center gap-3`}>
        <Text style={tw`text-4xl font-black text-white text-center`}>
          {t('onboarding.notifications.title')}
        </Text>
        <Text style={tw`text-base text-white/70 text-center leading-6 max-w-[280px]`}>
          {t(subtitleKey)}
        </Text>
      </View>

      <View style={tw`w-full gap-4`}>
        {FEATURES.map((feature) => (
          <View
            key={feature.titleKey}
            style={[
              tw`flex-row items-center gap-4 rounded-2xl px-5 py-4`,
              {
                backgroundColor: feature.bgColor,
                borderWidth: 1,
                borderColor: feature.borderColor,
              },
            ]}
          >
            <View
              style={[
                tw`w-12 h-12 rounded-xl items-center justify-center`,
                { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
              ]}
            >
              {feature.icon}
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-base font-semibold text-white`}>
                {t(`onboarding.notifications.${feature.titleKey}`)}
              </Text>
              <Text style={tw`text-xs text-white/50 mt-1`}>
                {t(`onboarding.notifications.${feature.descKey}`)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={tw`w-full gap-3`}>
        <Pressable
          onPress={handleEnable}
          style={({ pressed }) => [
            tw`h-14 rounded-full items-center justify-center`,
            {
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              opacity: pressed ? 0.9 : 1,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            },
          ]}
        >
          <Text style={tw`text-base font-bold text-purple-900`}>
            {t('onboarding.notifications.enable')}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleSkip}
          style={({ pressed }) => [
            tw`h-12 items-center justify-center`,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Text style={tw`text-sm font-medium text-white/50`}>
            {t('onboarding.notifications.maybeLater')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default NotificationStep;
