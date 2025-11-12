// src/components/wizard/CustomHabitCreator.tsx
import React from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import {
  BicepsFlexed,
  Trophy,
  Zap,
  Heart,
  Star,
  Flame,
  CheckCircle,
  Award,
  TrendingUp,
  Activity,
  Sparkles,
  Coffee,
  Book,
  Music,
  Camera,
  Palette,
  Code,
  Scissors,
  Wrench,
  Briefcase,
  Target,
} from 'lucide-react-native';
import tw from '../../lib/tailwind';
import { HabitType } from '../../types';

interface CustomHabitCreatorProps {
  habitType: HabitType;
  habitName: string;
  selectedIcon: string;
  onNameChange: (name: string) => void;
  onIconSelect: (icon: string) => void;
}

const customIcons = [
  { id: 'target', component: BicepsFlexed },
  { id: 'trophy', component: Trophy },
  { id: 'zap', component: Zap },
  { id: 'heart', component: Heart },
  { id: 'star', component: Star },
  { id: 'flame', component: Flame },
  { id: 'check-circle', component: CheckCircle },
  { id: 'award', component: Award },
  { id: 'trending-up', component: TrendingUp },
  { id: 'activity', component: Activity },
  { id: 'sparkles', component: Sparkles },
  { id: 'coffee', component: Coffee },
  { id: 'book', component: Book },
  { id: 'music', component: Music },
  { id: 'camera', component: Camera },
  { id: 'palette', component: Palette },
  { id: 'code', component: Code },
  { id: 'scissors', component: Scissors },
  { id: 'wrench', component: Wrench },
  { id: 'briefcase', component: Briefcase },
];

const CustomHabitCreator: React.FC<CustomHabitCreatorProps> = ({ habitType, habitName, selectedIcon, onNameChange, onIconSelect }) => {
  const { t } = useTranslation();

  return (
    <KeyboardAvoidingView style={tw`flex-1`} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`px-8 py-8`}>
        {/* Header */}
        <View style={tw`mb-8`}>
          <Text style={tw`text-3xl font-bold text-white text-center mb-3`}>{t('wizard.customHabitCreator.title')}</Text>
          <Text style={tw`text-base text-white/80 text-center leading-6 px-2`}>{t('wizard.customHabitCreator.subtitle')}</Text>
        </View>

        {/* Name Input */}
        <View style={tw`mb-8`}>
          <Text style={tw`text-sm font-medium text-white/90 mb-3`}>{t('wizard.customHabitCreator.habitName')}</Text>
          <TextInput
            value={habitName}
            onChangeText={onNameChange}
            placeholder={t('wizard.customHabitCreator.habitNamePlaceholder')}
            placeholderTextColor="rgba(255, 255, 255, 0.3)"
            style={tw`bg-white/15 border-2 border-white/20 rounded-2xl px-5 py-4 text-white text-base`}
            maxLength={50}
          />
          <Text style={tw`text-xs text-white/50 mt-2`}>
            {habitName.length}/50 {t('wizard.customHabitCreator.characters')}
          </Text>
        </View>

        {/* Icon Selector */}
        <View style={tw`mb-8`}>
          <Text style={tw`text-sm font-medium text-white/90 mb-3`}>{t('wizard.customHabitCreator.chooseIcon')}</Text>
          <View style={tw`flex-row flex-wrap gap-3`}>
            {customIcons.map((icon, index) => {
              const Icon = icon.component;
              const isSelected = selectedIcon === icon.id;

              return (
                <Animated.View key={icon.id} entering={FadeInDown.delay(index * 20).duration(300)}>
                  <Pressable
                    onPress={() => onIconSelect(icon.id)}
                    style={({ pressed }) => [
                      tw`w-16 h-16 rounded-2xl items-center justify-center border-2 ${isSelected ? 'border-white/40' : 'border-white/10'}`,
                      {
                        backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                      },
                      pressed && tw`opacity-70`,
                    ]}
                  >
                    <Icon size={28} color="#ffffff" strokeWidth={2} />
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </View>

        {/* Preview */}
        {habitName.length > 0 && selectedIcon && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <Text style={tw`text-sm font-medium text-white/90 mb-3`}>{t('wizard.customHabitCreator.preview')}</Text>
            <View style={tw`bg-white/15 border-2 border-white/20 rounded-2xl p-5 flex-row items-center`}>
              <View style={tw`w-14 h-14 rounded-xl bg-white/20 items-center justify-center mr-4`}>
                {(() => {
                  const iconData = customIcons.find((i) => i.id === selectedIcon);
                  if (!iconData) return null;
                  const Icon = iconData.component;
                  return <Icon size={28} color="#ffffff" strokeWidth={2} />;
                })()}
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-lg font-semibold text-white mb-1`}>{habitName}</Text>
                <Text style={tw`text-sm text-white/70`}>{t('wizard.customHabitCreator.customHabit')}</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Tip */}
        <View style={tw`mt-10`}>
          <Text style={tw`text-xs text-white/50 text-center font-light italic leading-5`}>{habitType === 'good' ? t('wizard.customHabitCreator.tipGood') : t('wizard.customHabitCreator.tipBad')}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default React.memo(CustomHabitCreator);

export const getCustomIconComponent = (iconId: string) => {
  const icon = customIcons.find((i) => i.id === iconId);
  return icon?.component || Target;
};
