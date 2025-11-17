// components/groups/CreateGroupScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { X, Users } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { groupService } from '@/services/groupTypeService';
import { useAuth } from '@/context/AuthContext';
import { validateName } from '@/utils/groupUtils';
import { GroupsStackParamList } from '@/navigation/GroupsNavigator';
import tw from '@/lib/tailwind';

type NavigationProp = NativeStackNavigationProp<GroupsStackParamList>;

export default function CreateGroupScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('💪');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!user?.id) return;

    const validation = validateName(name);
    if (!validation.valid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('groups.create.invalidName'), validation.error);
      return;
    }

    setLoading(true);
    try {
      const canJoin = await groupService.canUserJoinGroup(user.id);

      if (!canJoin.can_join) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
          t('groups.create.limitReached'),
          canJoin.reason || t('groups.create.limitReachedMessage'),
          canJoin.requires_premium
            ? [
                { text: t('groups.create.later'), style: 'cancel' },
                { text: t('groups.create.seePremium'), onPress: () => navigation.navigate('Premium') },
              ]
            : [{ text: 'OK' }]
        );
        return;
      }

      const group = await groupService.createGroup(user.id, { name, emoji });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // ✅ Navigation simplifiée : on ferme la modal puis on navigue
      navigation.goBack(); // Ferme CreateGroup modal

      setTimeout(() => {
        navigation.navigate('GroupDashboard', { groupId: group.id });
      }, 150); // Petit délai pour l'animation smooth
    } catch (error: any) {
      console.error('Error creating group:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('groups.dashboard.error'), error.message || t('groups.create.errorCreating'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={tw`flex-1 bg-[#FAFAFA]`}>
      <StatusBar barStyle="light-content" />
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

          <Text style={tw`text-xl font-bold text-stone-800`}>{t('groups.create.title')}</Text>

          <View style={tw`w-10`} />
        </View>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-6 py-2`}>
        <View style={tw`mb-4`}>
          <Text style={tw`text-sm font-semibold text-stone-700 mb-3`}>{t('groups.create.groupName')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('groups.create.placeholder')}
            placeholderTextColor="#9CA3AF"
            maxLength={50}
            style={[
              tw`rounded-xl px-4 py-4 text-base text-stone-800`,
              {
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: 'rgba(0, 0, 0, 0.08)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
              },
            ]}
            autoFocus
          />
          <Text style={tw`text-xs text-stone-500 mt-2`}>{t('groups.create.charactersCount', { count: name.length })}</Text>
        </View>

        <View
          style={[
            tw`rounded-xl p-4 mb-4 flex-row gap-3`,
            {
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              borderWidth: 1,
              borderColor: 'rgba(59, 130, 246, 0.15)',
            },
          ]}
        >
          <Users size={20} color="#3B82F6" strokeWidth={2} style={tw`mt-0.5`} />
          <Text style={tw`text-sm text-blue-900 leading-relaxed flex-1`}>{t('groups.create.info')}</Text>
        </View>

        <TouchableOpacity
          onPress={handleCreate}
          disabled={!name.trim() || loading}
          style={[
            tw`rounded-2xl px-6 py-4 flex-row items-center justify-center`,
            {
              backgroundColor: '#3b82f6',
              shadowColor: '#3b82f6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            },
            (!name.trim() || loading) && { opacity: 0.5 },
          ]}
          activeOpacity={0.8}
        >
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={tw`text-base font-bold text-white`}>{t('groups.create.button')}</Text>}
        </TouchableOpacity>

        <View style={tw`h-8`} />
      </ScrollView>
    </View>
  );
}
