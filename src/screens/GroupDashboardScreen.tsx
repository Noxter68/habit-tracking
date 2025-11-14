// screens/GroupDashboardScreen.tsx
// Dashboard principal d'un groupe avec habitudes et timeline

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp as RNRouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Plus, Settings, Share2, Flame, Users } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { groupService } from '@/services/groupTypeService';
import { useAuth } from '@/context/AuthContext';
import type { GroupWithMembers, GroupHabitWithCompletions } from '@/types/group.types';
import { formatStreak, getLevelProgress, formatInviteCode } from '@/utils/groupUtils';
import { MemberAvatars } from '@/components/groups/MemberAvatars';
import { GroupHabitCard } from '@/components/groups/GroupHabitCard';
import tw from '@/lib/tailwind';

type NavigationProp = NativeStackNavigationProp<any>;
type RouteParams = RNRouteProp<{ GroupDashboard: { groupId: string } }, 'GroupDashboard'>;

export default function GroupDashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const { user } = useAuth();
  const { groupId } = route.params;

  const [group, setGroup] = useState<GroupWithMembers | null>(null);
  const [habits, setHabits] = useState<GroupHabitWithCompletions[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadGroupData = async () => {
    if (!user?.id) return;

    try {
      // Charger le groupe
      const groups = await groupService.getUserGroups(user.id);
      const currentGroup = groups.find((g) => g.id === groupId);

      if (!currentGroup) {
        Alert.alert('Erreur', 'Groupe introuvable');
        navigation.goBack();
        return;
      }

      setGroup(currentGroup);

      // Charger les habitudes
      const habitsData = await groupService.getGroupHabits(groupId);
      setHabits(habitsData);
    } catch (error) {
      console.error('Error loading group:', error);
      Alert.alert('Erreur', 'Impossible de charger le groupe');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadGroupData();
  }, [groupId, user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadGroupData();
  };

  const handleShareCode = async () => {
    if (!group) return;

    const formattedCode = formatInviteCode(group.invite_code);
    await Clipboard.setStringAsync(formattedCode);
    Alert.alert('Code copié !', `Le code ${formattedCode} a été copié dans le presse-papier`);
  };

  const handleAddHabit = () => {
    navigation.navigate('CreateGroupHabit', { groupId });
  };

  const handleSettings = () => {
    navigation.navigate('GroupSettings', { groupId });
  };

  if (loading) {
    return (
      <View style={tw`flex-1 bg-[#FAFAFA] items-center justify-center`}>
        <ActivityIndicator size="large" color="#A78BFA" />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={tw`flex-1 bg-[#FAFAFA] items-center justify-center`}>
        <Text style={tw`text-gray-500`}>Groupe introuvable</Text>
      </View>
    );
  }

  const progress = getLevelProgress(group.xp);
  const xpForNextLevel = group.level * 100;

  return (
    <View style={tw`flex-1 bg-[#FAFAFA]`}>
      {/* Header */}
      <View style={tw`bg-white border-b border-gray-100`}>
        <View style={tw`px-6 pt-16 pb-4`}>
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={tw`w-10 h-10 items-center justify-center`}>
              <ArrowLeft size={24} color="#6B7280" />
            </TouchableOpacity>

            <View style={tw`flex-row gap-2`}>
              <TouchableOpacity onPress={handleShareCode} style={tw`w-10 h-10 rounded-full bg-[#F3F4F6] items-center justify-center`}>
                <Share2 size={20} color="#6B7280" />
              </TouchableOpacity>

              <TouchableOpacity onPress={handleSettings} style={tw`w-10 h-10 rounded-full bg-[#F3F4F6] items-center justify-center`}>
                <Settings size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Nom et emoji du groupe */}
          <View style={tw`flex-row items-center gap-3 mb-4`}>
            <View style={tw`w-14 h-14 bg-[#F3F4F6] rounded-xl items-center justify-center`}>
              <Text style={tw`text-3xl`}>{group.emoji}</Text>
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-2xl font-bold text-gray-900`}>{group.name}</Text>
              <Text style={tw`text-sm text-gray-500`}>Niveau {group.level}</Text>
            </View>
          </View>

          {/* Barre XP */}
          <View style={tw`mb-4`}>
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

          {/* Stats: Streak et Membres */}
          <View style={tw`flex-row items-center justify-between`}>
            {/* Streak collectif */}
            <View style={tw`flex-row items-center gap-2`}>
              <View style={tw`w-10 h-10 bg-orange-50 rounded-full items-center justify-center`}>
                <Flame size={20} color="#F59E0B" />
              </View>
              <View>
                <Text style={tw`text-xs text-gray-500`}>Streak collectif</Text>
                <Text style={tw`text-base font-bold text-gray-900`}>{formatStreak(group.current_streak)}</Text>
              </View>
            </View>

            {/* Membres */}
            <View style={tw`flex-row items-center gap-2`}>
              <MemberAvatars members={group.members} maxDisplay={3} size="sm" />
              <View>
                <Text style={tw`text-xs text-gray-500`}>Membres</Text>
                <Text style={tw`text-base font-bold text-gray-900`}>{group.members_count}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Liste des habitudes */}
      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-6 py-6`} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A78BFA" />}>
        {/* Header section habitudes */}
        <View style={tw`flex-row items-center justify-between mb-4`}>
          <Text style={tw`text-lg font-bold text-gray-900`}>Habitudes ({habits.length})</Text>

          <TouchableOpacity onPress={handleAddHabit} style={tw`flex-row items-center gap-2 bg-[#A78BFA] rounded-xl px-4 py-2`} activeOpacity={0.7}>
            <Plus size={16} color="#FFFFFF" />
            <Text style={tw`text-sm font-semibold text-white`}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        {habits.length === 0 ? (
          // État vide
          <View style={tw`bg-white rounded-2xl p-8 items-center`}>
            <View style={tw`w-16 h-16 bg-[#F3F4F6] rounded-full items-center justify-center mb-4`}>
              <Text style={tw`text-3xl`}>🎯</Text>
            </View>
            <Text style={tw`text-base font-semibold text-gray-900 mb-2`}>Aucune habitude</Text>
            <Text style={tw`text-sm text-gray-500 text-center mb-4`}>Ajoutez votre première habitude partagée</Text>
            <TouchableOpacity onPress={handleAddHabit} style={tw`bg-[#A78BFA] rounded-xl px-6 py-3`} activeOpacity={0.8}>
              <Text style={tw`text-sm font-semibold text-white`}>Créer une habitude</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Liste des habitudes
          <View style={tw`gap-4`}>
            {habits.map((habit) => (
              <GroupHabitCard key={habit.id} habit={habit} groupId={groupId} onRefresh={loadGroupData} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
