// screens/GroupsListScreen.tsx
// Écran principal: Liste des groupes de l'utilisateur

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Plus } from 'lucide-react-native';
import { groupService } from '@/services/groupTypeService';
import { useAuth } from '@/context/AuthContext';
import type { GroupWithMembers } from '@/types/group.types';
import { GroupCard } from '@/components/groups/GroupCard';
import { EmptyState } from '@/components/groups/EmptyState';
import tw from '@/lib/tailwind';

type NavigationProp = NativeStackNavigationProp<any>;

export default function GroupsListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadGroups = async () => {
    if (!user?.id) return;

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

  useEffect(() => {
    loadGroups();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadGroups();
  };

  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup');
  };

  const handleJoinGroup = () => {
    navigation.navigate('JoinGroup');
  };

  const handleGroupPress = (groupId: string) => {
    navigation.navigate('GroupDashboard', { groupId });
  };

  if (loading) {
    return (
      <View style={tw`flex-1 bg-[#FAFAFA] items-center justify-center`}>
        <ActivityIndicator size="large" color="#A78BFA" />
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-[#FAFAFA]`}>
      {/* Header */}
      <View style={tw`px-6 pt-16 pb-4 bg-white border-b border-gray-100`}>
        <View style={tw`flex-row items-center justify-between`}>
          <View>
            <Text style={tw`text-2xl font-bold text-gray-900`}>Mes Groupes</Text>
            <Text style={tw`text-sm text-gray-500 mt-1`}>
              {groups.length} {groups.length > 1 ? 'groupes' : 'groupe'}
            </Text>
          </View>

          <TouchableOpacity onPress={handleCreateGroup} style={tw`w-12 h-12 rounded-full bg-[#A78BFA] items-center justify-center shadow-sm`} activeOpacity={0.7}>
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-6 py-6`} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A78BFA" />}>
        {groups.length === 0 ? (
          <EmptyState onCreateGroup={handleCreateGroup} onJoinGroup={handleJoinGroup} />
        ) : (
          <View style={tw`gap-4`}>
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} onPress={() => handleGroupPress(group.id)} />
            ))}

            {/* Bouton rejoindre un groupe */}
            <TouchableOpacity onPress={handleJoinGroup} style={tw`bg-white rounded-2xl p-5 border-2 border-dashed border-gray-200 items-center`} activeOpacity={0.7}>
              <Text style={tw`text-base font-semibold text-gray-700`}>Rejoindre un groupe</Text>
              <Text style={tw`text-sm text-gray-500 mt-1`}>Entrez un code d'invitation</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
