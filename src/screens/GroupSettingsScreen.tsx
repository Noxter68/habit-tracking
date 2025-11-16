// screens/GroupSettingsScreen.tsx
// Settings avec i18n

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp as RNRouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { X, Copy, Users, LogOut, Trash2, AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { groupService } from '@/services/groupTypeService';
import { useAuth } from '@/context/AuthContext';
import type { GroupWithMembers } from '@/types/group.types';
import { formatInviteCode, getAvatarDisplay } from '@/utils/groupUtils';
import { getHabitTierTheme } from '@/utils/tierTheme';
import { getIconComponent } from '@/utils/iconMapper';
import tw from '@/lib/tailwind';

type NavigationProp = NativeStackNavigationProp<any>;
type RouteParams = RNRouteProp<{ GroupSettings: { groupId: string } }, 'GroupSettings'>;

export default function GroupSettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { groupId } = route.params;

  const [group, setGroup] = useState<GroupWithMembers | null>(null);
  const [loading, setLoading] = useState(true);

  const tierTheme = getHabitTierTheme('Jade');

  const loadGroup = async () => {
    if (!user?.id) return;

    try {
      const currentGroup = await groupService.getGroupById(groupId, user.id);
      console.log('📦 Group loaded:', currentGroup);
      console.log('👥 Members:', currentGroup?.members);
      setGroup(currentGroup);
    } catch (error) {
      console.error('Error loading group:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroup();
  }, [groupId, user?.id]);

  const handleCopyCode = async () => {
    if (!group) return;

    const formattedCode = formatInviteCode(group.invite_code);
    await Clipboard.setStringAsync(formattedCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(t('groups.settings.codeCopied'), t('groups.settings.codeCopiedMessage', { code: formattedCode }));
  };

  const handleLeaveGroup = () => {
    if (!user?.id || !group) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(t('groups.settings.leaveConfirm'), group.is_creator ? t('groups.settings.leaveMessageCreator') : t('groups.settings.leaveMessage'), [
      { text: t('groups.dashboard.cancel'), style: 'cancel' },
      {
        text: t('groups.settings.leaveGroup'),
        style: 'destructive',
        onPress: async () => {
          try {
            await groupService.leaveGroup(user.id, groupId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            navigation.navigate('MainTabs', {
              screen: 'Groups',
              params: {
                screen: 'GroupsList',
              },
            });

            setTimeout(() => {
              Alert.alert(t('groups.settings.groupLeft'), t('groups.settings.groupLeftMessage'));
            }, 500);
          } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(t('groups.dashboard.error'), error.message || t('groups.settings.errorLeave'));
          }
        },
      },
    ]);
  };

  const handleDeleteGroup = () => {
    if (!user?.id || !group) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    Alert.alert(t('groups.settings.deleteConfirm'), t('groups.settings.deleteMessage'), [
      { text: t('groups.dashboard.cancel'), style: 'cancel' },
      {
        text: t('groups.settings.deleteGroup'),
        style: 'destructive',
        onPress: async () => {
          try {
            await groupService.deleteGroup(groupId, user.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

            navigation.navigate('MainTabs', {
              screen: 'Groups',
              params: {
                screen: 'GroupsList',
              },
            });

            setTimeout(() => {
              Alert.alert(t('groups.settings.groupDeleted'), t('groups.settings.groupDeletedMessage'));
            }, 500);
          } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(t('groups.dashboard.error'), error.message || t('groups.settings.errorDelete'));
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={tw`flex-1 bg-[#FAFAFA] items-center justify-center`}>
        <ActivityIndicator size="large" color={tierTheme.accent} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={tw`flex-1 bg-[#FAFAFA] items-center justify-center`}>
        <Text style={tw`text-sm text-stone-400`}>{t('groups.dashboard.groupNotFound')}</Text>
      </View>
    );
  }

  const GroupIcon = getIconComponent(group.emoji || 'target');

  return (
    <View style={tw`flex-1 bg-[#FAFAFA]`}>
      <View style={tw`px-6 pt-6 pb-4 bg-[#FAFAFA]`}>
        <View style={tw`flex-row items-center justify-between`}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
            style={tw`w-10 h-10 items-center justify-center`}
          >
            <X size={24} color="#57534E" />
          </TouchableOpacity>

          <Text style={tw`text-xl font-bold text-stone-800`}>{t('groups.settings.title')}</Text>

          <View style={tw`w-10`} />
        </View>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-6 py-2`}>
        <LinearGradient
          colors={['#3b82f6', '#2563eb']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            tw`rounded-[20px] overflow-hidden mb-3`,
            {
              borderWidth: 1.5,
              borderColor: 'rgba(255, 255, 255, 0.2)',
              shadowColor: '#3b82f6',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
            },
          ]}
        >
          <View style={tw`p-5`}>
            <View style={tw`flex-row items-center gap-3 mb-4`}>
              <View
                style={[
                  tw`w-14 h-14 rounded-2xl items-center justify-center`,
                  {
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                  },
                ]}
              >
                <GroupIcon size={32} color="#FFFFFF" strokeWidth={2} />
              </View>
              <View style={tw`flex-1`}>
                <Text
                  style={[
                    tw`text-xl font-bold mb-1`,
                    {
                      color: '#FFFFFF',
                      textShadowColor: 'rgba(0, 0, 0, 0.2)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 3,
                    },
                  ]}
                >
                  {group.name}
                </Text>
                <Text
                  style={[
                    tw`text-sm`,
                    {
                      color: 'rgba(255, 255, 255, 0.9)',
                    },
                  ]}
                >
                  {t('groups.list.members', { count: group.members_count })}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleCopyCode}
              style={[
                tw`flex-row items-center justify-between rounded-xl p-4`,
                {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
              ]}
              activeOpacity={0.7}
            >
              <View>
                <Text
                  style={[
                    tw`text-xs mb-1`,
                    {
                      color: 'rgba(255, 255, 255, 0.8)',
                    },
                  ]}
                >
                  {t('groups.settings.inviteCode')}
                </Text>
                <Text
                  style={[
                    tw`text-lg font-mono font-bold`,
                    {
                      color: '#FFFFFF',
                      textShadowColor: 'rgba(0, 0, 0, 0.2)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    },
                  ]}
                >
                  {formatInviteCode(group.invite_code)}
                </Text>
              </View>
              <Copy size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View
          style={[
            tw`rounded-[20px] p-5 mb-3`,
            {
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: 'rgba(0, 0, 0, 0.05)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
            },
          ]}
        >
          <View style={tw`flex-row items-center gap-2 mb-4`}>
            <Users size={20} color="#57534E" />
            <Text style={tw`text-base font-bold text-stone-800`}>{t('groups.settings.members', { count: group.members_count })}</Text>
          </View>

          {group.members && group.members.length > 0 ? (
            <View style={tw`gap-3`}>
              {group.members.map((member) => {
                const avatar = getAvatarDisplay({
                  id: member.user_id,
                  username: member.profile?.username || null,
                  email: member.profile?.email || null,
                  avatar_emoji: member.profile?.avatar_emoji || null,
                  avatar_color: member.profile?.avatar_color || null,
                  subscription_tier: member.profile?.subscription_tier || 'free',
                });

                const isCreator = member.user_id === group.created_by || member.role === 'creator';
                const isMe = member.user_id === user?.id;

                return (
                  <View key={member.user_id} style={tw`flex-row items-center gap-3`}>
                    <View
                      style={[
                        tw`w-10 h-10 rounded-full items-center justify-center border-2 border-white`,
                        {
                          backgroundColor: avatar.color,
                          shadowColor: avatar.color,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.3,
                          shadowRadius: 4,
                        },
                      ]}
                    >
                      {avatar.type === 'emoji' ? <Text style={tw`text-lg`}>{avatar.value}</Text> : <Text style={tw`text-sm font-semibold text-white`}>{avatar.value}</Text>}
                    </View>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-sm font-semibold text-stone-800`}>
                        {member.profile?.username || member.profile?.email || 'Utilisateur'}
                        {isMe && ` ${t('groups.settings.you')}`}
                      </Text>
                      {isCreator && <Text style={[tw`text-xs font-medium`, { color: '#3b82f6' }]}>{t('groups.settings.creator')}</Text>}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={tw`text-sm text-stone-400 text-center py-4`}>{t('groups.settings.noMembers')}</Text>
          )}
        </View>

        <View style={tw`gap-3 mb-3`}>
          <TouchableOpacity onPress={handleLeaveGroup} activeOpacity={0.7}>
            <LinearGradient
              colors={['#ef4444', '#dc2626']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                tw`rounded-[20px] px-5 py-4 flex-row items-center gap-3`,
                {
                  shadowColor: '#ef4444',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                },
              ]}
            >
              <LogOut size={20} color="#FFFFFF" />
              <Text style={tw`text-base font-semibold text-white`}>{t('groups.settings.leaveGroup')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {group.is_creator && (
            <TouchableOpacity
              onPress={handleDeleteGroup}
              style={[
                tw`rounded-[20px] px-5 py-4 flex-row items-center gap-3`,
                {
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: 'rgba(239, 68, 68, 0.2)',
                  shadowColor: '#EF4444',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                },
              ]}
              activeOpacity={0.7}
            >
              <Trash2 size={20} color="#EF4444" />
              <Text style={tw`text-base font-semibold text-red-500`}>{t('groups.settings.deleteGroup')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {group.is_creator && (
          <View
            style={[
              tw`flex-row gap-3 rounded-xl p-4`,
              {
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                borderWidth: 1,
                borderColor: 'rgba(59, 130, 246, 0.15)',
              },
            ]}
          >
            <AlertCircle size={20} color="#3B82F6" style={tw`mt-0.5`} />
            <Text style={tw`text-sm text-blue-900 leading-relaxed flex-1`}>{t('groups.settings.creatorInfo')}</Text>
          </View>
        )}

        <View style={tw`h-8`} />
      </ScrollView>
    </View>
  );
}
