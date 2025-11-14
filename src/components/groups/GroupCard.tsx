// components/groups/GroupCard.tsx
// Card pour afficher un groupe dans la liste

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Flame, ChevronRight } from 'lucide-react-native';
import type { GroupWithMembers } from '@/types/group.types';
import { formatStreak, getLevelProgress } from '@/utils/groupUtils';
import { MemberAvatars } from './MemberAvatars';
import tw from '@/lib/tailwind';

interface GroupCardProps {
  group: GroupWithMembers;
  onPress: () => void;
}

export function GroupCard({ group, onPress }: GroupCardProps) {
  const progress = getLevelProgress(group.xp);
  const xpForNextLevel = group.level * 100;

  return (
    <TouchableOpacity onPress={onPress} style={tw`bg-white rounded-2xl p-5 shadow-sm border border-gray-100`} activeOpacity={0.7}>
      {/* Header avec emoji et niveau */}
      <View style={tw`flex-row items-start justify-between mb-4`}>
        <View style={tw`flex-row items-center gap-3 flex-1`}>
          <View style={tw`w-12 h-12 bg-[#F3F4F6] rounded-xl items-center justify-center`}>
            <Text style={tw`text-2xl`}>{group.emoji}</Text>
          </View>

          <View style={tw`flex-1`}>
            <Text style={tw`text-lg font-bold text-gray-900`} numberOfLines={1}>
              {group.name}
            </Text>
            <Text style={tw`text-sm text-gray-500`}>Niveau {group.level}</Text>
          </View>
        </View>

        <ChevronRight size={20} color="#9CA3AF" />
      </View>

      {/* Membres */}
      <MemberAvatars members={group.members} maxDisplay={5} />

      {/* Barre de progression XP */}
      <View style={tw`mt-4`}>
        <View style={tw`flex-row items-center justify-between mb-2`}>
          <Text style={tw`text-xs font-medium text-gray-600`}>
            {group.xp} / {xpForNextLevel} XP
          </Text>
          <Text style={tw`text-xs text-gray-500`}>{progress}%</Text>
        </View>

        <View style={tw`h-2 bg-gray-100 rounded-full overflow-hidden`}>
          <View style={[tw`h-full bg-[#A78BFA] rounded-full`, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Streak */}
      {group.current_streak > 0 && (
        <View style={tw`mt-4 flex-row items-center gap-2`}>
          <Flame size={16} color="#F59E0B" />
          <Text style={tw`text-sm font-semibold text-gray-700`}>{formatStreak(group.current_streak)} de streak</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
