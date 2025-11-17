// components/groups/MemberAvatars.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Users } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import type { GroupMember } from '@/types/group.types';
import { getAvatarDisplay } from '@/utils/groupUtils';

interface Props {
  members: GroupMember[];
  maxDisplay?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const MemberAvatars: React.FC<Props> = ({ members, maxDisplay = 3, size = 'md' }) => {
  const visibleMembers = members.slice(0, maxDisplay);
  const remainingCount = Math.max(0, members.length - maxDisplay);

  // Tailles avec aspect-ratio 1:1 pour cercles parfaits
  const sizeConfig = {
    xs: { width: 24, height: 24, fontSize: 9, iconSize: 12 },
    sm: { width: 32, height: 32, fontSize: 11, iconSize: 16 },
    md: { width: 40, height: 40, fontSize: 13, iconSize: 20 },
    lg: { width: 48, height: 48, fontSize: 15, iconSize: 24 },
  };

  const config = sizeConfig[size];

  return (
    <View style={tw`flex-row items-center`}>
      {/* Avatars visibles */}
      <View style={tw`flex-row -space-x-2 gap-1`}>
        {visibleMembers.map((member, index) => {
          const avatar = getAvatarDisplay({
            id: member.user_id,
            username: member.profile?.username || null,
            email: member.profile?.email || null,
            avatar_emoji: member.profile?.avatar_emoji || null,
            avatar_color: member.profile?.avatar_color || null,
            subscription_tier: member.profile?.subscription_tier || 'free',
          });

          return (
            <View
              key={member.user_id}
              style={{
                width: config.width,
                height: config.height,
                borderRadius: config.width / 2,
                backgroundColor: avatar.color,
                borderWidth: 2,
                borderColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10 - index,
              }}
            >
              {avatar.type === 'emoji' ? (
                <Text style={{ fontSize: config.fontSize + 2 }}>{avatar.value}</Text>
              ) : (
                <Text style={{ fontSize: config.fontSize, fontWeight: '700', color: '#FFFFFF' }}>{avatar.value}</Text>
              )}
            </View>
          );
        })}

        {/* Compteur des membres restants */}
        {remainingCount > 0 && (
          <View
            style={{
              width: config.width,
              height: config.height,
              borderRadius: config.width / 2,
              backgroundColor: '#E7E5E4',
              borderWidth: 2,
              borderColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 0,
            }}
          >
            <Text style={{ fontSize: config.fontSize, fontWeight: '600', color: '#57534E' }}>+{remainingCount}</Text>
          </View>
        )}

        {/* Si aucun membre visible */}
        {visibleMembers.length === 0 && (
          <View
            style={{
              width: config.width,
              height: config.height,
              borderRadius: config.width / 2,
              backgroundColor: '#F5F5F4',
              borderWidth: 2,
              borderColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={config.iconSize} color="#A8A29E" />
          </View>
        )}
      </View>
    </View>
  );
};
