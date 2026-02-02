import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import tw from '../../lib/tailwind';

interface ImpactStepProps {
  gradient: string[];
}

const ImpactStep: React.FC<ImpactStepProps> = () => {
  const { t } = useTranslation();

  return (
    <View style={tw`items-center gap-6`}>
      <View style={tw`items-center gap-4`}>
        <Text style={tw`text-3xl font-black text-white text-center leading-9 max-w-[320px]`}>
          {t('onboarding.impact.title')}
        </Text>
        <Text style={tw`text-base text-white/60 text-center leading-6 max-w-[300px]`}>
          {t('onboarding.impact.subtitle')}
        </Text>
      </View>

      <View
        style={[
          tw`rounded-3xl px-6 py-5 items-center gap-3`,
          {
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            borderWidth: 1,
            borderColor: 'rgba(16, 185, 129, 0.35)',
          },
        ]}
      >
        <Image source={require('../../../assets/interface/gems/jade-gem.png')} style={{ width: 52, height: 52 }} contentFit="contain" />
        <Text style={[tw`text-xl font-bold text-center leading-8 max-w-[290px]`, { color: '#6ee7b7' }]}>
          {t('onboarding.impact.punchline')}
        </Text>
      </View>
    </View>
  );
};

export default ImpactStep;
