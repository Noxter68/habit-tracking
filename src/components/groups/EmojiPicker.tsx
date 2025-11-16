// components/groups/EmojiPicker.tsx
// Sélecteur d'icônes Lucide pour groupes et habitudes

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Dumbbell,
  Footprints,
  Bike,
  Target,
  Book,
  Pen,
  Palette,
  Music,
  Gamepad2,
  Laptop,
  Microscope,
  Coffee,
  Salad,
  Apple,
  Droplet,
  Moon,
  Sun,
  Sprout,
  Flame,
  Star,
  Gem,
  Rocket,
  PartyPopper,
  Sparkles,
  Zap,
  Heart,
  Award,
  Trophy,
  Crown,
  Users,
  Smile,
} from 'lucide-react-native';
import tw from '@/lib/tailwind';

const ICON_OPTIONS = [
  { icon: Dumbbell, name: 'dumbbell' },
  { icon: Footprints, name: 'footprints' },
  { icon: Bike, name: 'bike' },
  { icon: Target, name: 'target' },
  { icon: Book, name: 'book' },
  { icon: Pen, name: 'pen' },
  { icon: Palette, name: 'palette' },
  { icon: Music, name: 'music' },
  { icon: Gamepad2, name: 'gamepad' },
  { icon: Laptop, name: 'laptop' },
  { icon: Microscope, name: 'microscope' },
  { icon: Coffee, name: 'coffee' },
  { icon: Salad, name: 'salad' },
  { icon: Apple, name: 'apple' },
  { icon: Droplet, name: 'droplet' },
  { icon: Moon, name: 'moon' },
  { icon: Sun, name: 'sun' },
  { icon: Sprout, name: 'sprout' },
  { icon: Flame, name: 'flame' },
  { icon: Star, name: 'star' },
  { icon: Gem, name: 'gem' },
  { icon: Rocket, name: 'rocket' },
  { icon: PartyPopper, name: 'party' },
  { icon: Sparkles, name: 'sparkles' },
  { icon: Zap, name: 'zap' },
  { icon: Heart, name: 'heart' },
  { icon: Award, name: 'award' },
  { icon: Trophy, name: 'trophy' },
  { icon: Crown, name: 'crown' },
  { icon: Users, name: 'users' },
  { icon: Smile, name: 'smile' },
];

interface EmojiPickerProps {
  selectedEmoji: string;
  onEmojiSelect: (icon: string) => void;
}

export function EmojiPicker({ selectedEmoji, onEmojiSelect }: EmojiPickerProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-2`}>
      {ICON_OPTIONS.map(({ icon: Icon, name }) => {
        const isSelected = selectedEmoji === name;

        return (
          <TouchableOpacity
            key={name}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onEmojiSelect(name);
            }}
            style={[
              tw`w-14 h-14 rounded-xl items-center justify-center`,
              {
                backgroundColor: isSelected ? '#3b82f6' : '#FFFFFF',
                borderWidth: 1,
                borderColor: isSelected ? '#3b82f6' : 'rgba(0, 0, 0, 0.08)',
                shadowColor: isSelected ? '#3b82f6' : '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isSelected ? 0.3 : 0.05,
                shadowRadius: isSelected ? 8 : 4,
              },
            ]}
            activeOpacity={0.7}
          >
            <Icon size={28} color={isSelected ? '#FFFFFF' : '#57534E'} strokeWidth={2} />
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
