// screens/GroupSettingsScreen.tsx
// Écran des paramètres d'un groupe

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp as RNRouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { X, Copy, Users, LogOut, Trash2, AlertCircle } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
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
      const groups = await groupService.getUserGroups(user.id);
      const currentGroup = groups.find((g) => g.id === groupId);
      setGroup(currentGroup || null);
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
    Alert.alert('Code copié !', `Le code ${formattedCode} a été copié`);
  };

  const handleLeaveGroup = () => {
    if (!user?.id || !group) return;

    Alert.alert('Quitter le groupe', group.is_creator ? 'Vous êtes le créateur. Si vous quittez, le rôle sera transféré au membre le plus ancien.' : 'Êtes-vous sûr de vouloir quitter ce groupe ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Quitter',
        style: 'destructive',
        onPress: async () => {
          try {
            await groupService.leaveGroup(user.id, groupId);
            Alert.alert('Groupe quitté', 'Vous avez quitté le groupe avec succès');
            navigation.reset({
              index: 0,
              routes: [{ name: 'GroupsList' }],
            });
          } catch (error: any) {
            Alert.alert('Erreur', error.message || 'Impossible de quitter le groupe');
          }
        },
      },
    ]);
  };

  const handleDeleteGroup = () => {
    if (!user?.id || !group) return;

    Alert.alert('Supprimer le groupe', 'Cette action est irréversible. Tous les membres seront retirés et toutes les données seront supprimées.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await groupService.deleteGroup(groupId, user.id);
            Alert.alert('Groupe supprimé', 'Le groupe a été supprimé avec succès');
            navigation.reset({
              index: 0,
              routes: [{ name: 'GroupsList' }],
            });
          } catch (error: any) {
            Alert.alert('Erreur', error.message || 'Impossible de supprimer le groupe');
          }
        },
      },
    ]);
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

  return (
    <View style={tw`flex-1 bg-[#FAFAFA]`}>
      {/* Header */}
      <View style={tw`px-6 pt-16 pb-4 bg-white border-b border-gray-100`}>
        <View style={tw`flex-row items-center justify-between`}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={tw`w-10 h-10 items-center justify-center`}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>

          <Text style={tw`text-xl font-bold text-gray-900`}>Paramètres</Text>

          <View style={tw`w-10`} />
        </View>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-6 py-6`}>
        {/* Infos du groupe */}
        <View style={tw`bg-white rounded-2xl p-5 mb-4 border border-gray-100`}>
          <View style={tw`flex-row items-center gap-3 mb-4`}>
            <View style={tw`w-12 h-12 bg-[#F3F4F6] rounded-xl items-center justify-center`}>
              <Text style={tw`text-2xl`}>{group.emoji}</Text>
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-lg font-bold text-gray-900`}>{group.name}</Text>
              <Text style={tw`text-sm text-gray-500`}>
                {group.members_count} membre{group.members_count > 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* Code d'invitation */}
          <TouchableOpacity onPress={handleCopyCode} style={tw`flex-row items-center justify-between bg-[#F3F4F6] rounded-xl p-4`} activeOpacity={0.7}>
            <View>
              <Text style={tw`text-xs text-gray-500 mb-1`}>Code d'invitation</Text>
              <Text style={tw`text-lg font-mono font-bold text-gray-900`}>{formatInviteCode(group.invite_code)}</Text>
            </View>
            <Copy size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Membres */}
        <View style={tw`bg-white rounded-2xl p-5 mb-4 border border-gray-100`}>
          <View style={tw`flex-row items-center gap-2 mb-4`}>
            <Users size={20} color="#6B7280" />
            <Text style={tw`text-base font-bold text-gray-900`}>Membres ({group.members_count})</Text>
          </View>

          <View style={tw`gap-3`}>
            {group.members.map((member) => {
              const avatar = getAvatarDisplay(member.profile || null);
              const isCreator = member.role === 'creator';
              const isMe = member.user_id === user?.id;

              return (
                <View key={member.id} style={tw`flex-row items-center justify-between`}>
                  <View style={tw`flex-row items-center gap-3 flex-1`}>
                    <View style={[tw`w-10 h-10 rounded-full items-center justify-center border-2 border-white`, { backgroundColor: avatar.color }]}>
                      {avatar.type === 'emoji' ? <Text style={tw`text-lg`}>{avatar.value}</Text> : <Text style={tw`text-sm font-semibold text-white`}>{avatar.value}</Text>}
                    </View>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-sm font-semibold text-gray-900`}>
                        {member.profile?.username || 'Utilisateur'}
                        {isMe && ' (Vous)'}
                      </Text>
                      {isCreator && <Text style={tw`text-xs text-[#A78BFA]`}>Créateur</Text>}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Actions */}
        <View style={tw`gap-3`}>
          {/* Quitter le groupe */}
          <TouchableOpacity onPress={handleLeaveGroup} style={tw`bg-white rounded-2xl px-5 py-4 flex-row items-center gap-3 border border-gray-100`} activeOpacity={0.7}>
            <LogOut size={20} color="#F59E0B" />
            <Text style={tw`text-base font-semibold text-[#F59E0B]`}>Quitter le groupe</Text>
          </TouchableOpacity>

          {/* Supprimer le groupe (créateur uniquement) */}
          {group.is_creator && (
            <TouchableOpacity onPress={handleDeleteGroup} style={tw`bg-white rounded-2xl px-5 py-4 flex-row items-center gap-3 border border-red-200`} activeOpacity={0.7}>
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
      </ScrollView>
    </View>
  );
}
