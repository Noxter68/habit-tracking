import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import tw from '../lib/tailwind';

interface GradientBackgroundProps {
  children: ReactNode;
}

const GradientBackground: React.FC<GradientBackgroundProps> = ({ children }) => {
  return <View style={[tw`flex-1`, styles.gradient]}>{children}</View>;
};

const styles = StyleSheet.create({
  gradient: {
    backgroundColor: '#EFF6FF', // blue-50
  },
});

export default GradientBackground;
