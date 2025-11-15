// screens/GroupSettingsScreen.tsx
// Écran des paramètres d'un groupe avec liste membres corrigée

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp as RNRouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { X, Copy, Users, LogOut, Trash2, AlertCircle } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { groupService } from '@/services/groupTypeService';
import { useAuth } from '@/context/AuthContext';
import type { GroupWithMembers } from '@/types/group.types';
import { formatInviteCode, getAvatarDisplay } from '@/utils/groupUtils';
import tw from '@/lib/tailwind';

type NavigationProp = NativeStackNavigationProp<any>;
type RouteParams = RNRouteProp<{ GroupSettings: { groupId: string } }, 'GroupSettings'>;

export default function GroupSettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const { user } = useAuth();
  const { groupId } = route.params;

  const [group, setGroup] = useState<GroupWithMembers | null>(null);
  const [loading, setLoading] = useState(true);

  const loadGroup = async () => {
    if (!user?.id) return;

    try {
      // Utilise getGroupById au lieu de getUserGroups
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
    Alert.alert('Code copié !', `Le code ${formattedCode} a été copié`);
  };

  const handleLeaveGroup = () => {
    if (!user?.id || !group) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert('Quitter le groupe', group.is_creator ? 'Vous êtes le créateur. Si vous quittez, le rôle sera transféré au membre le plus ancien.' : 'Êtes-vous sûr de vouloir quitter ce groupe ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Quitter',
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
              Alert.alert('Groupe quitté', 'Vous avez quitté le groupe avec succès');
            }, 500);
          } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Erreur', error.message || 'Impossible de quitter le groupe');
          }
        },
      },
    ]);
  };

  const handleDeleteGroup = () => {
    if (!user?.id || !group) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    Alert.alert('Supprimer le groupe', 'Cette action est irréversible. Tous les membres seront retirés et toutes les données seront supprimées.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
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
              Alert.alert('Groupe supprimé', 'Le groupe a été supprimé avec succès');
            }, 500);
          } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Erreur', error.message || 'Impossible de supprimer le groupe');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={tw`flex-1 bg-[#FAFAFA] items-center justify-center`}>
        <ActivityIndicator size="large" color="#3b82f6" />
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

  return (
    <View style={tw`flex-1 bg-[#FAFAFA]`}>
      {/* Header */}
      <View style={tw`px-6 pt-16 pb-4 bg-white border-b border-stone-100`}>
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

          <Text style={tw`text-xl font-bold text-stone-800`}>Paramètres</Text>

          <View style={tw`w-10`} />
        </View>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-6 py-6`}>
        {/* Infos du groupe */}
        <View style={tw`bg-white rounded-2xl p-5 mb-4 shadow-sm border border-stone-100`}>
          <View style={tw`flex-row items-center gap-3 mb-4`}>
            <View style={tw`w-12 h-12 bg-stone-50 rounded-xl items-center justify-center`}>
              <Text style={tw`text-2xl`}>{group.emoji}</Text>
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-lg font-bold text-stone-800`}>{group.name}</Text>
              <Text style={tw`text-sm text-stone-500`}>
                {group.members_count} membre{group.members_count > 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* Code d'invitation */}
          <TouchableOpacity onPress={handleCopyCode} style={tw`flex-row items-center justify-between bg-stone-50 rounded-xl p-4`} activeOpacity={0.7}>
            <View>
              <Text style={tw`text-xs text-stone-500 mb-1`}>Code d'invitation</Text>
              <Text style={tw`text-lg font-mono font-bold text-stone-800`}>{formatInviteCode(group.invite_code)}</Text>
            </View>
            <Copy size={20} color="#57534E" />
          </TouchableOpacity>
        </View>

        {/* Membres */}
        <View style={tw`bg-white rounded-2xl p-5 mb-4 shadow-sm border border-stone-100`}>
          <View style={tw`flex-row items-center gap-2 mb-4`}>
            <Users size={20} color="#57534E" />
            <Text style={tw`text-base font-bold text-stone-800`}>Membres ({group.members_count})</Text>
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
                  <View key={member.user_id} style={tw`flex-row items-center justify-between`}>
                    <View style={tw`flex-row items-center gap-3 flex-1`}>
                      <View style={[tw`w-10 h-10 rounded-full items-center justify-center border-2 border-white`, { backgroundColor: avatar.color }]}>
                        {avatar.type === 'emoji' ? <Text style={tw`text-lg`}>{avatar.value}</Text> : <Text style={tw`text-sm font-semibold text-white`}>{avatar.value}</Text>}
                      </View>
                      <View style={tw`flex-1`}>
                        <Text style={tw`text-sm font-semibold text-stone-800`}>
                          {member.profile?.username || member.profile?.email || 'Utilisateur'}
                          {isMe && ' (Vous)'}
                        </Text>
                        {isCreator && <Text style={tw`text-xs text-[#3b82f6]`}>Créateur</Text>}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={tw`text-sm text-stone-400 text-center py-4`}>Aucun membre trouvé</Text>
          )}
        </View>

        {/* Actions */}
        <View style={tw`gap-3`}>
          {/* Quitter le groupe */}
          <TouchableOpacity onPress={handleLeaveGroup} style={tw`bg-white rounded-2xl px-5 py-4 flex-row items-center gap-3 shadow-sm border border-stone-100`} activeOpacity={0.7}>
            <LogOut size={20} color="#F59E0B" />
            <Text style={tw`text-base font-semibold text-[#F59E0B]`}>Quitter le groupe</Text>
          </TouchableOpacity>

          {/* Supprimer le groupe (créateur uniquement) */}
          {group.is_creator && (
            <TouchableOpacity onPress={handleDeleteGroup} style={tw`bg-white rounded-2xl px-5 py-4 flex-row items-center gap-3 shadow-sm border border-red-200`} activeOpacity={0.7}>
              <Trash2 size={20} color="#EF4444" />
              <Text style={tw`text-base font-semibold text-red-500`}>Supprimer le groupe</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Info */}
        {group.is_creator && (
          <View style={tw`flex-row gap-3 bg-blue-50 rounded-xl p-4 mt-4`}>
            <AlertCircle size={20} color="#3B82F6" style={tw`mt-0.5`} />
            <Text style={tw`text-sm text-blue-900 leading-relaxed flex-1`}>En tant que créateur, si vous quittez le groupe, votre rôle sera automatiquement transféré au membre le plus ancien.</Text>
          </View>
        )}

        <View style={tw`h-8`} />
      </ScrollView>
    </View>
  );
}
