// src/components/dashboard/AddHabitButton.tsx
import React from 'react';
import { Pressable, Text, View, ImageBackground } from 'react-native';
import { Plus } from 'lucide-react-native';
import tw from '@/lib/tailwind';

interface AddHabitButtonProps {
  onPress: () => void;
}

export const AddHabitButton: React.FC<AddHabitButtonProps> = ({ onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        tw`rounded-xl mb-4 overflow-hidden border border-stone-200`,
        {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
          elevation: 2,
        },
        pressed && tw`opacity-80`,
      ]}
    >
      <ImageBackground source={require('../../../assets/interface/textures/texture-grey.png')} style={tw`py-3 px-4`} imageStyle={{ opacity: 0.3 }} resizeMode="cover">
        <View style={tw`flex-row items-center justify-center gap-2.5`}>
          <View style={[tw`w-8 h-8 rounded-full items-center justify-center`, { backgroundColor: 'rgba(241, 245, 249, 0.8)' }]}>
            <Plus size={20} color="#64748b" strokeWidth={2.5} />
          </View>
          <Text style={tw`text-base font-bold text-stone-500`}>Create New Habit</Text>
        </View>
      </ImageBackground>
    </Pressable>
  );
};

export default AddHabitButton;
