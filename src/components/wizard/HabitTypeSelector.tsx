// src/components/wizard/HabitTypeSelector.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Heart, Ban } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import tw from '../../lib/tailwind';
import { HabitType } from '../../types';

interface HabitTypeCardProps {
  selected?: HabitType;
  onSelect: (type: HabitType) => void;
}

const HabitTypeSelector: React.FC<HabitTypeCardProps> = ({ selected, onSelect }) => {
  const { t } = useTranslation();

  return (
    <View style={tw`flex-1 justify-center px-8`}>
      {/* Header Section */}
      <View style={tw`mb-16`}>
        <Text style={tw`text-3xl font-bold text-white text-center mb-4`}>{t('wizard.habitTypeSelector.title')}</Text>
        <Text style={tw`text-md text-white/80 text-center leading-7 px-2`}>{t('wizard.habitTypeSelector.subtitle')}</Text>
      </View>

      {/* Selection Cards */}
      <View style={tw`gap-5`}>
        {/* Good Habit Option */}
        <Pressable
          onPress={() => onSelect('good')}
          style={({ pressed }) => [
            tw`rounded-2xl p-6 flex-row items-center border-2 ${selected === 'good' ? 'bg-emerald-500/20 border-emerald-400' : 'bg-white/10 border-white/20'}`,
            pressed && tw`opacity-80`,
          ]}
        >
          <View style={tw`w-14 h-14 rounded-xl ${selected === 'good' ? 'bg-emerald-500/30' : 'bg-emerald-500/20'} items-center justify-center mr-5`}>
            <Heart size={28} color={selected === 'good' ? '#10b981' : '#34d399'} strokeWidth={2} />
          </View>

          <View style={tw`flex-1`}>
            <Text style={tw`text-lg font-semibold text-white mb-1`}>{t('wizard.habitTypeSelector.buildHabit')}</Text>
            <Text style={tw`text-sm text-white/70 leading-5`}>{t('wizard.habitTypeSelector.buildHabitDescription')}</Text>
          </View>

          {selected === 'good' && (
            <View style={tw`w-6 h-6 rounded-full bg-emerald-500 items-center justify-center`}>
              <View style={tw`w-3 h-3 rounded-full bg-white`} />
            </View>
          )}
        </Pressable>

        {/* Bad Habit Option */}
        <Pressable
          onPress={() => onSelect('bad')}
          style={({ pressed }) => [
            tw`rounded-2xl p-6 flex-row items-center border-2 ${selected === 'bad' ? 'bg-red-500/20 border-red-400' : 'bg-white/10 border-white/20'}`,
            pressed && tw`opacity-80`,
          ]}
        >
          <View style={tw`w-14 h-14 rounded-xl ${selected === 'bad' ? 'bg-red-500/30' : 'bg-red-500/20'} items-center justify-center mr-5`}>
            <Ban size={28} color={selected === 'bad' ? '#ef4444' : '#f87171'} strokeWidth={2} />
          </View>

          <View style={tw`flex-1`}>
            <Text style={tw`text-lg font-semibold text-white mb-1`}>{t('wizard.habitTypeSelector.breakHabit')}</Text>
            <Text style={tw`text-sm text-white/70 leading-5`}>{t('wizard.habitTypeSelector.breakHabitDescription')}</Text>
          </View>

          {selected === 'bad' && (
            <View style={tw`w-6 h-6 rounded-full bg-red-500 items-center justify-center`}>
              <View style={tw`w-3 h-3 rounded-full bg-white`} />
            </View>
          )}
        </Pressable>
      </View>

      {/* Subtle Quote */}
      <View style={tw`mt-16`}>
        <Text style={tw`text-xs text-white/50 text-center font-light italic leading-5`}>{t('wizard.habitTypeSelector.quote')}</Text>
      </View>
    </View>
  );
};

export default HabitTypeSelector;
