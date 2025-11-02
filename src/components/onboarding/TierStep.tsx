// src/components/onboarding/TierStep.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Check } from 'lucide-react-native';
import { Image } from 'expo-image';
import tw from '../../lib/tailwind';

interface TierCardProps {
  gemSource: any;
  name: string;
  streak: string;
  color: string;
  special?: boolean;
}

const TierCard: React.FC<TierCardProps> = ({ gemSource, name, streak, color, special }) => (
  <View
    style={[
      tw`flex-row items-center gap-3 rounded-2xl px-5 py-3.5`,
      special
        ? {
            backgroundColor: `${color}25`,
            borderWidth: 2,
            borderColor: color,
            shadowColor: color,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 8,
          }
        : {
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 3,
          },
    ]}
  >
    <View
      style={[
        tw`w-12 h-12 rounded-full items-center justify-center`,
        {
          backgroundColor: `${color}30`,
          shadowColor: color,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.4,
          shadowRadius: 6,
        },
      ]}
    >
      <Image source={gemSource} style={{ width: 32, height: 32 }} contentFit="contain" />
    </View>
    <View style={tw`flex-1`}>
      <Text style={tw`text-base font-bold text-white`}>{name}</Text>
      <Text style={tw`text-xs text-white/70 mt-0.5`}>{streak}</Text>
    </View>
    {special && <Check size={22} color={color} strokeWidth={2.5} />}
  </View>
);

interface TierStepProps {
  gradient: string[];
}

const TierStep: React.FC<TierStepProps> = ({ gradient }) => {
  return (
    <View style={tw`items-center gap-6`}>
      {/* Title */}
      <View style={tw`items-center gap-2.5`}>
        <Text style={tw`text-4xl font-black text-white text-center`}>Your UI Evolves</Text>
        <Text style={tw`text-base text-white/80 text-center leading-6 max-w-[300px]`}>Watch your interface transform with beautiful gem themes as you progress</Text>
      </View>

      {/* Tier Progression */}
      <View style={tw`w-full gap-2.5`}>
        <TierCard gemSource={require('../../../assets/interface/gems/crystal-gem.png')} name="Crystal" streak="0-49 days" color="#60a5fa" />
        <TierCard gemSource={require('../../../assets/interface/gems/ruby-gem.png')} name="Ruby" streak="50-149 days" color="#ef4444" />
        <TierCard gemSource={require('../../../assets/interface/gems/amethyst-gem.png')} name="Amethyst" streak="150+ days" color="#8b5cf6" special />
      </View>
    </View>
  );
};

export default TierStep;
