// src/components/wizard/HabitCategorySelector.tsx
import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Dumbbell, Heart, Apple, BookOpen, Zap, Brain, Moon, Droplets, CigaretteOff, Scale, ShoppingCart, Smartphone, Clock, Smile, Wine, Bed, Plus } from 'lucide-react-native';
import tw from '../../lib/tailwind';
import { HabitType } from '../../types';
import { getCategories } from '../../utils/habitHelpers';

interface HabitCategorySelectorProps {
  habitType: HabitType;
  selected?: string;
  onSelect: (category: string) => void;
  onCreateCustom: () => void;
}

const categoryIcons: Record<string, any> = {
  fitness: Dumbbell,
  health: Heart,
  nutrition: Apple,
  learning: BookOpen,
  productivity: Zap,
  mindfulness: Brain,
  sleep: Moon,
  hydration: Droplets,
  smoking: CigaretteOff,
  'junk-food': Scale,
  shopping: ShoppingCart,
  'screen-time': Smartphone,
  procrastination: Clock,
  'negative-thinking': Smile,
  alcohol: Wine,
  oversleeping: Bed,
};

const HabitCategorySelector: React.FC<HabitCategorySelectorProps> = ({ habitType, selected, onSelect, onCreateCustom }) => {
  const { t } = useTranslation();
  const categories = getCategories(habitType);

  return (
    <View style={tw`flex-1 justify-center`}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`px-8 py-8`}>
        {/* Header */}
        <View style={tw`mb-10`}>
          <Text style={tw`text-3xl font-bold text-white text-center mb-3`}>{t('wizard.habitCategorySelector.title')}</Text>
          <Text style={tw`text-base text-white/80 text-center leading-6 px-2`}>
            {habitType === 'good' ? t('wizard.habitCategorySelector.subtitleGood') : t('wizard.habitCategorySelector.subtitleBad')}
          </Text>
        </View>

        {/* Categories Grid */}
        <View style={tw`gap-3 mb-4`}>
          {categories.map((category, index) => {
            const Icon = categoryIcons[category.id];
            const isSelected = selected === category.id;

            return (
              <Animated.View key={category.id} entering={FadeInDown.delay(index * 30).duration(300)}>
                <Pressable
                  onPress={() => onSelect(category.id)}
                  style={({ pressed }) => [
                    tw`rounded-2xl p-5 flex-row items-center border-2 ${isSelected ? 'border-white/40' : 'border-white/10'}`,
                    {
                      backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.15)',
                    },
                    pressed && tw`opacity-80`,
                  ]}
                >
                  <View
                    style={[
                      tw`w-12 h-12 rounded-xl items-center justify-center mr-4`,
                      {
                        backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                      },
                    ]}
                  >
                    {Icon && <Icon size={24} color="#ffffff" strokeWidth={2} />}
                  </View>

                  <View style={tw`flex-1`}>
                    <Text style={tw`text-base font-semibold text-white mb-0.5`}>{category.label}</Text>
                    <Text style={tw`text-sm text-white/70 leading-5`}>{category.description}</Text>
                  </View>

                  {isSelected && (
                    <View style={tw`w-6 h-6 rounded-full bg-white items-center justify-center`}>
                      <View style={tw`w-3 h-3 rounded-full bg-purple-600`} />
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* Divider */}
        <View style={tw`flex-row items-center my-6`}>
          <View style={tw`flex-1 h-px bg-white/20`} />
          <Text style={tw`px-4 text-xs text-white/50 font-medium`}>{t('common.or').toUpperCase()}</Text>
          <View style={tw`flex-1 h-px bg-white/20`} />
        </View>

        {/* Create Custom Button */}
        <Pressable
          onPress={onCreateCustom}
          style={({ pressed }) => [tw`rounded-2xl p-5 flex-row items-center border-2 border-white/20`, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }, pressed && tw`opacity-80`]}
        >
          <View style={tw`w-12 h-12 rounded-xl bg-white/10 items-center justify-center mr-4`}>
            <Plus size={24} color="#ffffff" strokeWidth={2} />
          </View>

          <View style={tw`flex-1`}>
            <Text style={tw`text-base font-semibold text-white mb-0.5`}>{t('wizard.habitCategorySelector.createCustom')}</Text>
            <Text style={tw`text-sm text-white/70 leading-5`}>
              {habitType === 'good' ? t('wizard.habitCategorySelector.createCustomDescriptionGood') : t('wizard.habitCategorySelector.createCustomDescriptionBad')}
            </Text>
          </View>
        </Pressable>

        {/* Tip */}
        <View style={tw`mt-8`}>
          <Text style={tw`text-xs text-white/50 text-center font-light italic leading-5`}>{t('wizard.habitCategorySelector.tip')}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default React.memo(HabitCategorySelector);
