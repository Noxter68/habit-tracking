import React from 'react';
import { View, Text } from 'react-native';
import { Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import tw from '../../lib/tailwind';

interface SocialProofStepProps {
  gradient: string[];
}

const REVIEW_KEYS = ['0', '1', '2', '3'] as const;

const SocialProofStep: React.FC<SocialProofStepProps> = () => {
  const { t } = useTranslation();

  return (
    <View style={tw`items-center gap-5`}>
      <View style={tw`items-center gap-3`}>
        <Text style={tw`text-4xl font-black text-white text-center`}>
          {t('onboarding.socialProof.title')}
        </Text>
        <View style={tw`flex-row items-center gap-2`}>
          <View style={tw`flex-row`}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={18} color="#f59e0b" fill="#f59e0b" strokeWidth={2} />
            ))}
          </View>
          <Text style={tw`text-base font-bold text-white`}>5.0</Text>
          <Text style={tw`text-sm text-white/60`}>{t('onboarding.socialProof.subtitle')}</Text>
        </View>
      </View>

      <View style={tw`w-full gap-2.5`}>
        {REVIEW_KEYS.map((key) => (
          <View
            key={key}
            style={[
              tw`rounded-2xl px-4 py-3`,
              { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
            ]}
          >
            <View style={tw`flex-row mb-1.5`}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={12} color="#f59e0b" fill="#f59e0b" strokeWidth={2} />
              ))}
            </View>
            <Text style={tw`text-sm text-white/90 leading-5`}>
              "{t(`onboarding.socialProof.reviews.${key}`)}"
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default SocialProofStep;
