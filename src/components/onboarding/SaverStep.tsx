// src/components/onboarding/SaverStep.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Shield, Zap, Award } from 'lucide-react-native';
import tw from '../../lib/tailwind';

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, desc }) => (
  <View style={tw`flex-row gap-3`}>
    <View style={[tw`w-10 h-10 rounded-full items-center justify-center`, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>{icon}</View>
    <View style={tw`flex-1`}>
      <Text style={tw`text-sm font-bold text-white mb-1`}>{title}</Text>
      <Text style={tw`text-xs text-white/70 leading-5`}>{desc}</Text>
    </View>
  </View>
);

interface SaverStepProps {
  gradient: string[];
}

const SaverStep: React.FC<SaverStepProps> = ({ gradient }) => {
  return (
    <View style={tw`items-center gap-6`}>
      {/* Title */}
      <View style={tw`items-center gap-2.5`}>
        <Text style={tw`text-4xl font-black text-white text-center`}>Never Lose Progress</Text>
        <Text style={tw`text-base text-white/80 text-center leading-6 max-w-[300px]`}>Use Streak Savers to restore missed days and keep your momentum going</Text>
      </View>

      {/* Features */}
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
        <FeatureItem icon={<Shield size={20} color="white" strokeWidth={2} />} title="Protect Your Streak" desc="Use savers when you miss a day" />
        <FeatureItem icon={<Zap size={20} color="white" strokeWidth={2} />} title="Instant Restore" desc="Get back on track immediately" />
        <FeatureItem icon={<Award size={20} color="white" strokeWidth={2} />} title="Earn Through Progress" desc="Unlock savers as you level up" />
      </View>
    </View>
  );
};

export default SaverStep;
