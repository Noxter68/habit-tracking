// screens/GroupsListScreen.tsx
// Liste des groupes avec i18n et textures dynamiques basées sur le niveau

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, ImageBackground, Image } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Plus, Users, Flame, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { groupService } from '@/services/groupTypeService';
import { useAuth } from '@/context/AuthContext';
import type { GroupWithMembers } from '@/types/group.types';
import { getHabitTierTheme, getAchievementTierTheme } from '@/utils/tierTheme';
import { calculateGroupTierFromLevel, getGroupTierConfigByLevel, getGroupTierThemeKey } from '@utils/groups/groupConstants';
import tw from '@/lib/tailwind';

type NavigationProp = NativeStackNavigationProp<any>;

const GroupCard = ({ group, onPress, t }: { group: GroupWithMembers; onPress: () => void; t: any }) => {
  const activeMembers = group.members?.filter((m) => m.user_id).length || 0;
  const currentLevel = group.level || 1;
  const currentStreak = group.current_streak || 0;

  const currentTierNumber = calculateGroupTierFromLevel(currentLevel);
  const currentTierConfig = getGroupTierConfigByLevel(currentLevel);
  const tierTheme = currentTierNumber <= 3 ? getHabitTierTheme(currentTierConfig.name as any) : getAchievementTierTheme(getGroupTierThemeKey(currentTierNumber));

  const isObsidian = currentTierNumber === 6;
  const textureOpacity = isObsidian ? 0.2 : 0.2;
  const iconOpacity = isObsidian ? 0.8 : 0.3;
  const overlayOpacity = isObsidian ? 0.15 : 0.05;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.96}>
      <LinearGradient
        colors={tierTheme.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          tw`rounded-[20px] overflow-hidden mb-3`,
          {
            borderWidth: 1.5,
            borderColor: 'rgba(255, 255, 255, 0.2)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
          },
        ]}
      >
        <ImageBackground source={tierTheme.texture} resizeMode="cover" imageStyle={{ opacity: textureOpacity }}>
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
            }}
          />

          <View
            style={{
              position: 'absolute',
              top: 8,
              right: 50,
              opacity: iconOpacity,
            }}
          >
            <Image
              source={currentTierConfig.icon}
              style={{
                width: 130,
                height: 130,
                resizeMode: 'contain',
              }}
            />
          </View>

          <View style={tw`p-4`}>
            <View style={tw`flex-row items-start justify-between mb-3`}>
              <View style={tw`flex-1`}>
                <View style={tw`flex-row items-center gap-2 mb-2`}>
                  <Text
                    style={[
                      tw`text-xl font-bold flex-shrink`,
                      {
                        color: '#FFFFFF',
                        textShadowColor: 'rgba(0, 0, 0, 0.4)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 3,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {group.name}
                  </Text>
                  <View style={tw`flex-row items-center gap-0.5`}>
                    <Flame size={16} color="#FFFFFF" fill="#FFFFFF" />
                    <Text
                      style={[
                        tw`text-sm font-black`,
                        {
                          color: '#FFFFFF',
                          textShadowColor: 'rgba(0, 0, 0, 0.3)',
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 2,
                        },
                      ]}
                    >
                      {currentStreak}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    tw`rounded-full px-3 py-1 self-start mb-2`,
                    {
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                    },
                  ]}
                >
                  <Text style={tw`text-white text-xs font-black`}>{t('groups.list.level', { level: currentLevel })}</Text>
                </View>

                {group.description && (
                  <Text
                    style={[
                      tw`text-sm`,
                      {
                        color: 'rgba(255, 255, 255, 0.9)',
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {group.description}
                  </Text>
                )}
              </View>
            </View>

            <View style={tw`flex-row items-center justify-between`}>
              <View
                style={[
                  tw`rounded-full px-3 py-1.5 flex-row items-center gap-1.5`,
                  {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                ]}
              >
                <Users size={14} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={tw`text-white text-xs font-semibold`}>{t('groups.list.members', { count: activeMembers })}</Text>
              </View>

              <View
                style={[
                  tw`rounded-full p-2`,
                  {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                ]}
              >
                <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </View>
          </View>
        </ImageBackground>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const EmptyState = ({ onCreateGroup, onJoinGroup, t }: { onCreateGroup: () => void; onJoinGroup: () => void; t: any }) => {
  return (
    <View style={tw`flex-1 items-center justify-center px-8 py-12`}>
      <View
        style={[
          tw`rounded-full p-8 mb-6`,
          {
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
          },
        ]}
      >
        <Users size={56} color="#3B82F6" strokeWidth={2} />
      </View>

      <Text style={tw`text-2xl font-bold text-stone-800 text-center mb-2`}>{t('groups.list.noGroups')}</Text>
      <Text style={tw`text-base text-stone-500 text-center mb-8 leading-6`}>{t('groups.list.noGroupsDescription')}</Text>

      <View style={tw`w-full gap-3`}>
        <TouchableOpacity onPress={onCreateGroup} activeOpacity={0.8}>
          <LinearGradient
            colors={['#60a5fa', '#3b82f6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              tw`rounded-2xl py-4 px-6`,
              {
                shadowColor: '#3b82f6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              },
            ]}
          >
            <Text style={tw`text-white text-base font-bold text-center`}>{t('groups.list.createGroup')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={onJoinGroup} activeOpacity={0.8}>
          <View
            style={[
              tw`rounded-2xl py-4 px-6`,
              {
                backgroundColor: '#FFFFFF',
                borderWidth: 1.5,
                borderColor: 'rgba(0, 0, 0, 0.08)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
              },
            ]}
          >
            <Text style={tw`text-stone-700 text-base font-semibold text-center`}>{t('groups.list.joinGroup')}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function GroupsListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadGroups = async (silent = false) => {
    if (!user?.id) return;
    if (!silent) setLoading(true);

    try {
      const data = await groupService.getUserGroups(user.id);
      setGroups(data);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadGroups(true);
    }, [user?.id])
  );

  const onRefresh = () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    loadGroups();
  };

  const handleCreateGroup = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('CreateGroup');
  };

  const handleJoinGroup = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('JoinGroup');
  };

  const handleGroupPress = (groupId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('GroupDashboard', { groupId });
  };

  const tierTheme = getAchievementTierTheme('novice');

  if (loading) {
    return (
      <View style={tw`flex-1 bg-[#FAFAFA] items-center justify-center`}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-[#FAFAFA]`}>
      <LinearGradient colors={tierTheme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`pt-16 pb-6`}>
        <ImageBackground source={tierTheme.texture} style={tw`absolute inset-0`} imageStyle={{ opacity: 0.15 }} resizeMode="cover" />

        <View style={tw`px-6`}>
          <View style={tw`items-center mb-4`}>
            <View
              style={[
                tw`px-4 py-1.5 rounded-full mb-2`,
                {
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                },
              ]}
            >
              <Text
                style={[
                  tw`text-xs font-bold tracking-widest`,
                  {
                    color: '#FFFFFF',
                    textShadowColor: 'rgba(0, 0, 0, 0.2)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2,
                  },
                ]}
              >
                {t('groups.title').toUpperCase()}
              </Text>
            </View>
            <Text
              style={[
                tw`text-3xl font-black tracking-tight mb-1`,
                {
                  color: '#FFFFFF',
                  textShadowColor: 'rgba(0, 0, 0, 0.3)',
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 4,
                },
              ]}
            >
              {t('groups.subtitle')}
            </Text>
            <Text
              style={[
                tw`text-sm font-semibold`,
                {
                  color: 'rgba(255, 255, 255, 0.95)',
                },
              ]}
            >
              {t('groups.activeCount', { count: groups.length })}
            </Text>
          </View>

          <TouchableOpacity onPress={handleCreateGroup} activeOpacity={0.8}>
            <View
              style={[
                tw`rounded-2xl py-3 px-5 flex-row items-center justify-center`,
                {
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                },
              ]}
            >
              <Plus size={20} color="#3b82f6" strokeWidth={2.5} />
              <Text style={tw`text-[#3b82f6] text-base font-bold ml-2`}>{t('groups.list.createGroup')}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`px-6 py-6`}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        {groups.length === 0 ? (
          <EmptyState onCreateGroup={handleCreateGroup} onJoinGroup={handleJoinGroup} t={t} />
        ) : (
          <View>
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} onPress={() => handleGroupPress(group.id)} t={t} />
            ))}

            <TouchableOpacity onPress={handleJoinGroup} activeOpacity={0.7}>
              <View
                style={[
                  tw`rounded-[20px] p-6 items-center`,
                  {
                    backgroundColor: '#FFFFFF',
                    borderWidth: 2,
                    borderStyle: 'dashed',
                    borderColor: 'rgba(59, 130, 246, 0.3)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                  },
                ]}
              >
                <View
                  style={[
                    tw`rounded-full p-3 mb-3`,
                    {
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    },
                  ]}
                >
                  <Users size={24} color="#3b82f6" strokeWidth={2} />
                </View>
                <Text style={tw`text-base font-bold text-stone-800 mb-1`}>{t('groups.list.joinWithCode')}</Text>
                <Text style={tw`text-sm text-stone-500 text-center`}>{t('groups.list.joinDescription')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View style={tw`h-8`} />
      </ScrollView>
    </View>
  );
}
