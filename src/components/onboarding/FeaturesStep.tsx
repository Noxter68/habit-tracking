import React from 'react';
import { View, Text } from 'react-native';
import { Bell, Pause, Sparkles } from 'lucide-react-native';
import tw from '../../lib/tailwind';
import i18n from '../../i18n';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  color: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, color }) => (
  <View
    style={[
      tw`flex-1 rounded-2xl p-5 gap-3 items-center`,
      {
        backgroundColor: `${color}20`,
        borderWidth: 2,
        borderColor: `${color}60`,
        shadowColor: color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
      },
    ]}
  >
    <View style={[tw`w-12 h-12 rounded-full items-center justify-center`, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]}>{icon}</View>
    <Text style={tw`text-xs font-bold text-white text-center`}>{title}</Text>
  </View>
);

interface FeaturesStepProps {
  gradient: string[];
}

const FeaturesStep: React.FC<FeaturesStepProps> = ({ gradient }) => {
  return (
    <View style={tw`items-center gap-6`}>
      <View style={tw`items-center gap-2.5`}>
        <Text style={tw`text-4xl font-black text-white text-center`}>{i18n.t('onboarding.features.title')}</Text>
        <Text style={tw`text-base text-white/80 text-center leading-6 max-w-[300px]`}>{i18n.t('onboarding.features.subtitle')}</Text>
      </View>

      <View style={tw`w-full gap-3`}>
        <View style={tw`flex-row gap-3`}>
          <FeatureCard icon={<Bell size={24} color="white" strokeWidth={2} />} title={i18n.t('onboarding.features.notifications')} color="#10b981" />
          <FeatureCard icon={<Pause size={24} color="white" strokeWidth={2} />} title={i18n.t('onboarding.features.holidayMode')} color="#8b5cf6" />
        </View>

        <View
          style={[
            tw`rounded-2xl p-5`,
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
          <View style={tw`flex-row items-center gap-2 mb-2`}>
            <Sparkles size={18} color="#fbbf24" strokeWidth={2} />
            <Text style={tw`text-sm font-bold text-white`}>{i18n.t('onboarding.features.ready')}</Text>
          </View>
          <Text style={tw`text-xs text-white/70 leading-5`}>{i18n.t('onboarding.features.readyDesc')}</Text>
        </View>
      </View>
    </View>
  );
};

export default FeaturesStep;
