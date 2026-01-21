import React from 'react';
import { Pressable, Text, View, ImageBackground } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import tw from '@/lib/tailwind';

interface AddHabitButtonProps {
  onPress: () => void;
}

export const AddHabitButton: React.FC<AddHabitButtonProps> = ({ onPress }) => {
  const { t } = useTranslation();

  return (
    <View style={{ position: 'relative', marginTop: 10, marginBottom: 16 }}>
      {/* Shadow layer for depth effect */}
      <View
        style={{
          position: 'absolute',
          top: 3,
          left: 0,
          right: 0,
          bottom: -3,
          backgroundColor: '#d6d3d1',
          borderRadius: 12,
        }}
      />
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          tw`rounded-xl overflow-hidden border border-stone-200`,
          {
            borderRadius: 12,
          },
          pressed && tw`opacity-80`,
        ]}
      >
        <ImageBackground source={require('../../../assets/interface/textures/texture-grey.png')} style={tw`py-3 px-4`} imageStyle={{ opacity: 0.4 }} resizeMode="cover">
          <View style={tw`flex-row items-center justify-center gap-2.5`}>
            <View style={[tw`w-8 h-8 rounded-full items-center justify-center`, { backgroundColor: 'rgba(241, 245, 249, 0.8)' }]}>
              <Plus size={20} color="#64748b" strokeWidth={2.5} />
            </View>
            <Text style={tw`text-base font-bold text-stone-500`}>{t('dashboard.createNewHabit')}</Text>
          </View>
        </ImageBackground>
      </Pressable>
    </View>
  );
};

export default AddHabitButton;
