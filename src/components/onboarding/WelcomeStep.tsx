// src/components/onboarding/WelcomeStep.tsx
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withTiming } from 'react-native-reanimated';
import { Sparkles, Target, Trophy } from 'lucide-react-native';
import tw from '../../lib/tailwind';

interface ValuePropProps {
  icon: React.ReactNode;
  text: string;
  delay: number;
}

const ValueProp: React.FC<ValuePropProps> = ({ icon, text, delay }) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle, tw`flex-row items-center gap-3`]}>
      <View style={[tw`w-10 h-10 rounded-full items-center justify-center`, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>{icon}</View>
      <Text style={tw`text-base font-semibold text-white/90`}>{text}</Text>
    </Animated.View>
  );
};

interface WelcomeStepProps {
  gradient: string[];
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ gradient }) => {
  return (
    <View style={tw`items-center gap-8`}>
      {/* Title */}
      <View style={tw`items-center gap-3`}>
        <Text style={tw`text-4xl font-black text-white text-center`}>Welcome to Nuvoria</Text>
        <Text style={tw`text-lg text-white/80 text-center leading-7 max-w-[320px]`}>Transform your habits into a daily adventure filled with success</Text>
      </View>

      {/* Value Props */}
      <View style={tw`gap-4 mt-4 w-full`}>
        <ValueProp icon={<Sparkles size={22} color="white" strokeWidth={2} />} text="Build lasting habits" delay={300} />
        <ValueProp icon={<Target size={22} color="white" strokeWidth={2} />} text="Track your progress visually" delay={450} />
        <ValueProp icon={<Trophy size={22} color="white" strokeWidth={2} />} text="Unlock achievements & rewards" delay={600} />
      </View>
    </View>
  );
};

export default WelcomeStep;
