import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Bell, Clock, Shield } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import tw from '../../lib/tailwind';
import { ChallengeId } from './MotivationStep';

interface NotificationStepProps {
  gradient: string[];
  selectedChallenge: ChallengeId | null;
  onEnableNotifications: () => void;
  onSkipNotifications: () => void;
}

const NotificationStep: React.FC<NotificationStepProps> = ({
  selectedChallenge,
  onEnableNotifications,
  onSkipNotifications,
}) => {
  const { t } = useTranslation();

  const subtitleKey = selectedChallenge === 'forgetting'
    ? 'onboarding.notifications.subtitleForgetting'
    : 'onboarding.notifications.subtitle';

  return (
    <View style={tw`items-center gap-6`}>
      <View style={tw`items-center gap-3`}>
        <Text style={tw`text-4xl font-black text-white text-center`}>
          {t('onboarding.notifications.title')}
        </Text>
        <Text style={tw`text-base text-white/80 text-center leading-6 max-w-[300px]`}>
          {t(subtitleKey)}
        </Text>
      </View>

      <View style={tw`w-full gap-4`}>
        <View
          style={[
            tw`w-full rounded-3xl p-6 gap-5`,
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
          <View style={tw`flex-row items-center gap-3`}>
            <View style={[tw`w-10 h-10 rounded-full items-center justify-center`, { backgroundColor: 'rgba(59, 130, 246, 0.3)' }]}>
              <Bell size={20} color="white" strokeWidth={2} />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-sm font-bold text-white`}>{t('onboarding.notifications.smartReminders')}</Text>
              <Text style={tw`text-xs text-white/60 mt-0.5`}>{t('onboarding.notifications.smartRemindersDesc')}</Text>
            </View>
          </View>

          <View style={tw`flex-row items-center gap-3`}>
            <View style={[tw`w-10 h-10 rounded-full items-center justify-center`, { backgroundColor: 'rgba(16, 185, 129, 0.3)' }]}>
              <Clock size={20} color="white" strokeWidth={2} />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-sm font-bold text-white`}>{t('onboarding.notifications.perfectTiming')}</Text>
              <Text style={tw`text-xs text-white/60 mt-0.5`}>{t('onboarding.notifications.perfectTimingDesc')}</Text>
            </View>
          </View>

          <View style={tw`flex-row items-center gap-3`}>
            <View style={[tw`w-10 h-10 rounded-full items-center justify-center`, { backgroundColor: 'rgba(139, 92, 246, 0.3)' }]}>
              <Shield size={20} color="white" strokeWidth={2} />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-sm font-bold text-white`}>{t('onboarding.notifications.noSpam')}</Text>
              <Text style={tw`text-xs text-white/60 mt-0.5`}>{t('onboarding.notifications.noSpamDesc')}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={tw`w-full gap-3`}>
        <Pressable
          onPress={onEnableNotifications}
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
          onPress={onSkipNotifications}
          style={({ pressed }) => [
            tw`h-12 items-center justify-center`,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Text style={tw`text-sm font-medium text-white/60`}>
            {t('onboarding.notifications.maybeLater')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default NotificationStep;
