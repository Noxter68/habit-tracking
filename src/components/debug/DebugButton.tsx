// src/components/debug/DebugButton.tsx
import React from 'react';
import { Pressable, Text, View, ViewStyle, TextStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import tw from '../../lib/tailwind';
import { useDebugMode } from '../../hooks/useDebugMode';

interface DebugButtonProps {
  onPress: () => void;
  label: string;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'danger';
  customStyle?: ViewStyle; // Allow custom styling for special cases
  customTextStyle?: TextStyle; // Allow custom text styling
}

export const DebugButton: React.FC<DebugButtonProps> = ({ onPress, label, icon: Icon, variant = 'primary', customStyle, customTextStyle }) => {
  const { showTestButtons } = useDebugMode();

  // Don't render anything if debug mode is off
  if (!showTestButtons) return null;

  const colors = {
    primary: 'bg-sage-500',
    secondary: 'bg-clay-1000',
    danger: 'bg-red-500',
  };

  // Use custom style if provided, otherwise use default
  if (customStyle) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [customStyle, pressed && tw`opacity-75`]}>
        {Icon && <Icon size={14} color="white" style={tw`mr-1.5`} />}
        <Text style={[tw`text-white font-semibold text-xs`, customTextStyle]}>{label}</Text>
      </Pressable>
    );
  }

  // Default styled button
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [tw`${colors[variant]} rounded-lg px-4 py-2.5 flex-row items-center justify-center mb-2`, pressed && tw`opacity-75`]}>
      {Icon && <Icon size={14} color="white" style={tw`mr-1.5`} />}
      <Text style={tw`text-white font-semibold text-xs`}>{label}</Text>
    </Pressable>
  );
};
