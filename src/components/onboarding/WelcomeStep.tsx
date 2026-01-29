import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import tw from '../../lib/tailwind';

interface WelcomeStepProps {
  gradient: string[];
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ gradient }) => {
  const { t } = useTranslation();

  return (
    <View style={tw`items-center gap-6`}>
      <View style={tw`items-center gap-4`}>
        <Text style={tw`text-4xl font-black text-white text-center`}>
          {t('onboarding.welcome.title')}
        </Text>
        <Text style={tw`text-lg text-white/80 text-center leading-7 max-w-[320px]`}>
          {t('onboarding.welcome.subtitle')}
        </Text>
      </View>
    </View>
  );
};

export default WelcomeStep;
