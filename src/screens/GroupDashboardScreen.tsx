// screens/GroupDashboardScreen.tsx
// Dashboard principal d'un groupe avec habitudes et timeline

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp as RNRouteProp, useFocusEffect } from '@react-navigation/native';
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

// Texture pour le header (utilise la texture Crystal de Nuvoria)
const headerTexture = require('../../assets/interface/progressBar/crystal.png');

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
      const groups = await groupService.getUserGroups(user.id);
      const currentGroup = groups.find((g) => g.id === groupId);

      if (!currentGroup) {
        Alert.alert('Erreur', 'Groupe introuvable');
        navigation.goBack();
        return;
      }

      setGroup(currentGroup);

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

  useFocusEffect(
    useCallback(() => {
      loadGroupData();
    }, [groupId, user?.id])
  );
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

  const handleGoBack = () => {
    navigation.navigate('GroupsList');
  };

  const handleDeleteHabit = async (habitId: string) => {
    Alert.alert("Supprimer l'habitude", 'Êtes-vous sûr de vouloir supprimer cette habitude ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await groupService.deleteGroupHabit(habitId, user.id);
            await loadGroupData();
          } catch (error) {
            console.error('Error deleting habit:', error);
            Alert.alert('Erreur', "Impossible de supprimer l'habitude");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={tw`flex-1 bg-[#FAFAFA] items-center justify-center`}>
        <ActivityIndicator size="large" color="#60a5fa" />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={tw`flex-1 bg-[#FAFAFA] items-center justify-center`}>
        <Text style={tw`text-sm text-stone-400`}>Groupe introuvable</Text>
      </View>
    );
  }

  const progress = getLevelProgress(group.xp);
  const xpForNextLevel = group.level * 100;

  return (
    <View style={tw`flex-1 bg-[#FAFAFA]`}>
      {/* Header avec texture et gradient */}
      <ImageBackground source={headerTexture} style={tw`overflow-hidden`} imageStyle={tw`opacity-60`} resizeMode="cover">
        <LinearGradient colors={['#60a5fa', '#3b82f6', '#1d4ed8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`px-6 pt-16 pb-6`}>
          {/* Navigation */}
          <View style={tw`flex-row items-center justify-between mb-6`}>
            <TouchableOpacity onPress={handleGoBack} style={tw`w-10 h-10 items-center justify-center bg-white/20 rounded-full`} activeOpacity={0.7}>
              <ArrowLeft size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={tw`flex-row gap-2`}>
              <TouchableOpacity onPress={handleShareCode} style={tw`w-10 h-10 rounded-full bg-white/20 items-center justify-center`} activeOpacity={0.7}>
                <Share2 size={18} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity onPress={handleSettings} style={tw`w-10 h-10 rounded-full bg-white/20 items-center justify-center`} activeOpacity={0.7}>
                <Settings size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Nom et emoji du groupe */}
          <View style={tw`flex-row items-center gap-3 mb-5`}>
            <View style={tw`w-16 h-16 bg-white/20 rounded-2xl items-center justify-center backdrop-blur`}>
              <Text style={tw`text-4xl`}>{group.emoji}</Text>
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-3xl font-bold text-white mb-1`}>{group.name}</Text>
              <Text style={tw`text-sm text-white/80`}>Niveau {group.level}</Text>
            </View>
          </View>

          {/* Barre XP */}
          <View style={tw`mb-5`}>
            <View style={tw`flex-row items-center justify-between mb-2`}>
              <Text style={tw`text-xs font-semibold text-white/90`}>
                {group.xp} / {xpForNextLevel} XP
              </Text>
              <Text style={tw`text-xs text-white/70`}>{progress}%</Text>
            </View>
            <View style={tw`h-2.5 bg-white/20 rounded-full overflow-hidden`}>
              <View style={[tw`h-full bg-white rounded-full shadow-sm`, { width: `${progress}%` }]} />
            </View>
          </View>

          {/* Stats: Streak et Membres */}
          <View style={tw`flex-row items-center justify-between`}>
            {/* Streak collectif */}
            <View style={tw`flex-row items-center gap-2.5`}>
              <View style={tw`w-11 h-11 bg-orange-500/20 rounded-full items-center justify-center`}>
                <Flame size={22} color="#FBBF24" />
              </View>
              <View>
                <Text style={tw`text-xs text-white/70`}>Streak</Text>
                <Text style={tw`text-lg font-bold text-white`}>{formatStreak(group.current_streak)}</Text>
              </View>
            </View>

            {/* Membres */}
            <View style={tw`flex-row items-center gap-2.5`}>
              <MemberAvatars members={group.members} maxDisplay={3} size="sm" />
              <View>
                <Text style={tw`text-xs text-white/70`}>Membres</Text>
                <Text style={tw`text-lg font-bold text-white`}>{group.members_count}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>

      {/* Liste des habitudes */}
      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-6 py-6`} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}>
        {/* Header section habitudes */}
        <View style={tw`flex-row items-center justify-between mb-5`}>
          <Text style={tw`text-xl font-bold text-stone-800`}>Habitudes ({habits.length})</Text>

          <TouchableOpacity onPress={handleAddHabit} style={tw`flex-row items-center gap-2 bg-[#3b82f6] rounded-xl px-4 py-2.5 shadow-sm`} activeOpacity={0.8}>
            <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={tw`text-sm font-semibold text-white`}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        {habits.length === 0 ? (
          // État vide
          <View style={tw`bg-white rounded-3xl p-8 items-center shadow-sm border border-stone-100`}>
            <View style={tw`w-20 h-20 bg-stone-50 rounded-2xl items-center justify-center mb-4`}>
              <Text style={tw`text-4xl`}>🎯</Text>
            </View>
            <Text style={tw`text-lg font-bold text-stone-800 mb-2`}>Aucune habitude</Text>
            <Text style={tw`text-sm text-stone-500 text-center mb-6 px-4`}>Créez votre première habitude partagée pour commencer votre aventure ensemble</Text>
            <TouchableOpacity onPress={handleAddHabit} style={tw`bg-[#3b82f6] rounded-xl px-6 py-3 shadow-sm`} activeOpacity={0.8}>
              <Text style={tw`text-sm font-semibold text-white`}>Créer une habitude</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Liste des habitudes avec swipe-to-delete
          <View style={tw`gap-4`}>
            {habits.map((habit) => (
              <GroupHabitCard key={habit.id} habit={habit} groupId={groupId} members={group.members} onRefresh={loadGroupData} onDelete={() => handleDeleteHabit(habit.id)} />
            ))}
          </View>
        )}

        {/* Padding bottom pour éviter que la dernière carte ne soit coupée */}
        <View style={tw`h-8`} />
      </ScrollView>
    </View>
  );
}
