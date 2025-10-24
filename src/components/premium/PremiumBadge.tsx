// src/components/premium/PremiumBadge.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown } from 'lucide-react-native';
import tw from '@/lib/tailwind';

interface PremiumBadgeProps {
  size?: 'small' | 'medium' | 'large';
}

const PremiumBadge: React.FC<PremiumBadgeProps> = ({ size = 'medium' }) => {
  const sizes = {
    small: {
      container: 'px-2 py-0.5',
      text: 'text-xs',
      icon: 12,
    },
    medium: {
      container: 'px-2.5 py-1',
      text: 'text-sm',
      icon: 14,
    },
    large: {
      container: 'px-3 py-1.5',
      text: 'text-base',
      icon: 16,
    },
  };

  const currentSize = sizes[size];

  return (
    <LinearGradient colors={['#78716C', '#57534E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`${currentSize.container} rounded-lg flex-row items-center gap-1`}>
      <Crown size={currentSize.icon} color="#FCD34D" strokeWidth={2.5} />
      <Text style={tw`text-white ${currentSize.text} font-bold tracking-wide`}>PREMIUM</Text>
    </LinearGradient>
  );
};

export default PremiumBadge;
