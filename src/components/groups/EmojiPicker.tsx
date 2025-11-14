// components/groups/EmojiPicker.tsx
// Sélecteur d'emoji simple pour groupes et habitudes

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import tw from '@/lib/tailwind';

const EMOJI_OPTIONS = [
  '💪',
  '🏃',
  '🧘',
  '🏋️',
  '🚴',
  '⚽',
  '🏀',
  '🎯',
  '📚',
  '✍️',
  '🎨',
  '🎵',
  '🎮',
  '💻',
  '🔬',
  '📖',
  '☕',
  '🥗',
  '🍎',
  '💧',
  '🌙',
  '☀️',
  '🌱',
  '🔥',
  '⭐',
  '💎',
  '🚀',
  '🎉',
  '🌟',
  '✨',
  '💫',
  '🌈',
];

interface EmojiPickerProps {
  selectedEmoji: string;
  onEmojiSelect: (emoji: string) => void;
}

export function EmojiPicker({ selectedEmoji, onEmojiSelect }: EmojiPickerProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-2`}>
      {EMOJI_OPTIONS.map((emoji) => (
        <TouchableOpacity
          key={emoji}
          onPress={() => onEmojiSelect(emoji)}
          style={[tw`w-14 h-14 rounded-xl items-center justify-center border-2`, selectedEmoji === emoji ? tw`bg-[#A78BFA] border-[#A78BFA]` : tw`bg-white border-gray-200`]}
          activeOpacity={0.7}
        >
          <Text style={tw`text-2xl`}>{emoji}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
