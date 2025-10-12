import React from 'react';
import { Pressable, Text, View, ActivityIndicator, Platform } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Path, G } from 'react-native-svg';
import * as AppleAuthentication from 'expo-apple-authentication';
import tw from '../../lib/tailwind';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface OAuthButtonProps {
  onPress: () => void;
  loading?: boolean;
  provider: 'apple' | 'google';
}

// Apple Logo SVG
const AppleLogo = ({ size = 20, color = '#000' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 16.97 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
  </Svg>
);

// Google Logo SVG
const GoogleLogo = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <G>
      <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </G>
  </Svg>
);

export const OAuthButton: React.FC<OAuthButtonProps> = ({ onPress, loading, provider }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
    opacity.value = withTiming(0.8, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    opacity.value = withTiming(1, { duration: 100 });
  };

  const handlePress = () => {
    scale.value = withSequence(withTiming(0.95, { duration: 100 }), withSpring(1));
    onPress();
  };

  const isApple = provider === 'apple';

  // Use native Apple button on iOS
  if (isApple && Platform.OS === 'ios') {
    return (
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={16}
        style={tw`h-14`}
        onPress={onPress}
      />
    );
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={loading}
      style={[
        animatedStyle,
        tw`${isApple ? 'bg-black' : 'bg-sand'} 
           border ${isApple ? 'border-black' : 'border-slate-200'} 
           py-4 px-6 rounded-2xl flex-row items-center justify-center
           shadow-sm`,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isApple ? '#fff' : '#000'} />
      ) : (
        <>
          <View style={tw`mr-3`}>{isApple ? <AppleLogo size={20} color="#fff" /> : <GoogleLogo size={20} />}</View>
          <Text style={tw`${isApple ? 'text-white' : 'text-slate-800'} font-semibold text-base`}>Continue with {isApple ? 'Apple' : 'Google'}</Text>
        </>
      )}
    </AnimatedPressable>
  );
};
