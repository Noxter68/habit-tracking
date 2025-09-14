// src/screens/WelcomeScreen.tsx
import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import BreathingCircle from '../components/BreathingCircle';
import tw from '../lib/tailwind';
import { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

interface WelcomeScreenProps {
  onComplete?: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete }) => {
  const navigation = useNavigation<NavigationProp>();
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.8);

  useEffect(() => {
    titleOpacity.value = withDelay(500, withTiming(1, { duration: 1200 }));
    subtitleOpacity.value = withDelay(1000, withTiming(1, { duration: 1200 }));
    buttonScale.value = withDelay(1500, withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.5)) }));
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleGetStarted = () => {
    // Mark that we've seen the welcome screen
    if (onComplete) {
      onComplete();
    }
    // Navigate to habit wizard
    navigation.navigate('HabitWizard');
  };

  return (
    <View style={[tw`flex-1`, styles.gradient]}>
      <SafeAreaView style={tw`flex-1`}>
        <View style={tw`flex-1 justify-center items-center px-8`}>
          <View style={tw`absolute top-20`}>
            <BreathingCircle />
          </View>

          <View style={tw`items-center mt-32`}>
            <Animated.Text style={[tw`text-4xl font-light text-slate-700 text-center`, { marginBottom: 16 }, titleStyle]}>Welcome to Mindful</Animated.Text>

            <Animated.Text style={[tw`text-lg text-slate-600 text-center px-4`, { lineHeight: 28 }, subtitleStyle]}>Build lasting habits in 61 days{'\n'}with science-backed tracking</Animated.Text>
          </View>

          <Animated.View style={[tw`absolute bottom-20`, buttonStyle]}>
            <Pressable onPress={handleGetStarted} style={({ pressed }) => [tw`bg-teal-600 px-12 py-4 rounded-full`, pressed && tw`bg-teal-700`]}>
              <Text style={tw`text-white text-lg font-medium`}>Get Started</Text>
            </Pressable>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  gradient: {
    backgroundColor: '#EFF6FF',
  },
});

export default WelcomeScreen;
