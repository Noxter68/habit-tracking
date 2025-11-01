// src/components/onboarding/XPStep.tsx
import React from 'react';
import { View, Text } from 'react-native';
import tw from '../../lib/tailwind';

interface XPCardProps {
  title: string;
  xp: string;
  color: string;
  special?: boolean;
}

const XPCard: React.FC<XPCardProps> = ({ title, xp, color, special }) => (
  <View
    style={[
      tw`flex-row items-center justify-between rounded-2xl px-5 py-3.5`,
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
    <Text style={tw`text-sm font-semibold text-white/90`}>{title}</Text>
    <Text style={[tw`text-base font-black`, { color: special ? color : 'white' }]}>{xp}</Text>
  </View>
);

interface XPStepProps {
  gradient: string[];
}

const XPStep: React.FC<XPStepProps> = ({ gradient }) => {
  return (
    <View style={tw`items-center gap-6`}>
      {/* Title */}
      <View style={tw`items-center gap-2.5`}>
        <Text style={tw`text-4xl font-black text-white text-center`}>Earn XP & Level Up</Text>
        <Text style={tw`text-base text-white/80 text-center leading-6 max-w-[300px]`}>Complete tasks to earn XP. Build streaks to unlock massive bonuses!</Text>
      </View>

      {/* XP Examples */}
      <View style={tw`w-full gap-2.5`}>
        <XPCard title="Complete a task" xp="+3 XP" color={gradient[0]} />
        <XPCard title="7-day streak" xp="+5 XP" color={gradient[1]} />
        <XPCard title="30-day streak" xp="+20 XP" color={gradient[2]} />
        <XPCard title="Perfect day" xp="+50 XP" color="#fbbf24" special />
      </View>
    </View>
  );
};

export default XPStep;
