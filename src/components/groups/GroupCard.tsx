// components/groups/GroupCard.tsx
// Card pour afficher un groupe avec TOUS les membres visibles

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Flame, ChevronRight, Check } from 'lucide-react-native';
import type { GroupWithMembers } from '@/types/group.types';
import { formatStreak, getLevelProgress, getAvatarDisplay } from '@/utils/groupUtils';
import tw from '@/lib/tailwind';

interface GroupCardProps {
  group: GroupWithMembers;
  onPress: () => void;
}

export function GroupCard({ group, onPress }: GroupCardProps) {
  const progress = getLevelProgress(group.xp);
  const xpForNextLevel = group.level * 100;

  // 🔍 DEBUG
  console.log('🎴 GroupCard received group:', group.name);
  console.log('👥 Members:', group.members);
  console.log('📊 Members count:', group.members_count);
  console.log('🔢 Members array length:', group.members?.length);

  return (
    <TouchableOpacity onPress={onPress} style={tw`bg-white rounded-2xl p-5 shadow-sm border border-stone-100`} activeOpacity={0.7}>
      {/* Header avec emoji et niveau */}
      <View style={tw`flex-row items-start justify-between mb-4`}>
        <View style={tw`flex-row items-center gap-3 flex-1`}>
          <View style={tw`w-12 h-12 bg-stone-50 rounded-xl items-center justify-center`}>
            <Text style={tw`text-2xl`}>{group.emoji}</Text>
          </View>

          <View style={tw`flex-1`}>
            <Text style={tw`text-lg font-bold text-stone-800`} numberOfLines={1}>
              {group.name}
            </Text>
            <Text style={tw`text-sm text-stone-500`}>Niveau {group.level}</Text>
          </View>
        </View>

        <ChevronRight size={20} color="#A8A29E" />
      </View>

      {/* TOUS les membres */}
      {group.members && group.members.length > 0 && (
        <View style={tw`mb-4`}>
          <Text style={tw`text-xs font-semibold text-stone-500 mb-2`}>Membres ({group.members_count})</Text>
          <View style={tw`flex-row flex-wrap gap-2`}>
            {group.members.map((member) => {
              const avatar = getAvatarDisplay({
                id: member.user_id,
                username: member.profile?.username || null,
                email: member.profile?.email || null,
                avatar_emoji: member.profile?.avatar_emoji || null,
                avatar_color: member.profile?.avatar_color || null,
                subscription_tier: member.profile?.subscription_tier || 'free',
              });

              return (
                <View key={member.user_id} style={[tw`w-8 h-8 rounded-full items-center justify-center border-2 border-white`, { backgroundColor: avatar.color }]}>
                  {avatar.type === 'emoji' ? <Text style={tw`text-base`}>{avatar.value}</Text> : <Text style={tw`text-xs font-semibold text-white`}>{avatar.value}</Text>}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Barre de progression XP */}
      <View style={tw`mb-4`}>
        <View style={tw`flex-row items-center justify-between mb-2`}>
          <Text style={tw`text-xs font-medium text-stone-600`}>
            {group.xp} / {xpForNextLevel} XP
          </Text>
          <Text style={tw`text-xs text-stone-500`}>{progress}%</Text>
        </View>

        <View style={tw`h-2 bg-stone-100 rounded-full overflow-hidden`}>
          <View style={[tw`h-full bg-[#3b82f6] rounded-full`, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Streak */}
      {group.current_streak > 0 && (
        <View style={tw`flex-row items-center gap-2`}>
          <View style={tw`w-7 h-7 bg-orange-100 rounded-full items-center justify-center`}>
            <Flame size={14} color="#F59E0B" />
          </View>
          <Text style={tw`text-sm font-semibold text-stone-700`}>{formatStreak(group.current_streak)} de streak</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
