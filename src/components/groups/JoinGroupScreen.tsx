// components/groups/JoinGroupScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { X, LogIn, UserPlus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { groupService } from '@/services/groupTypeService';
import { useAuth } from '@/context/AuthContext';
import { isValidInviteCode, cleanInviteCode, formatInviteCode } from '@/utils/groupUtils';
import { GroupsStackParamList } from '@/navigation/GroupsNavigator';
import tw from '@/lib/tailwind';

type NavigationProp = NativeStackNavigationProp<GroupsStackParamList>;

export default function JoinGroupScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCodeChange = (text: string) => {
    const cleaned = text.replace(/[^A-Z0-9]/g, '').toUpperCase();
    if (cleaned.length <= 6) {
      setCode(formatInviteCode(cleaned));
    }
  };

  const handleJoin = async () => {
    if (!user?.id) {
      Alert.alert(t('groups.dashboard.error'), t('groups.join.authRequired'));
      return;
    }

    // ✅ Validation du code avant traitement
    if (!code || code.trim().length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('groups.join.invalidCode'), t('groups.join.invalidCodeMessage'));
      return;
    }

    const cleanedCode = cleanInviteCode(code);

    console.log('🔍 Code entered:', code);
    console.log('🔍 Cleaned code:', cleanedCode);
    console.log('🔍 Cleaned code length:', cleanedCode.length);

    const isValid = isValidInviteCode(cleanedCode);
    console.log('🔍 Is valid code?', isValid);

    if (!isValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('groups.join.invalidCode'), t('groups.join.invalidCodeMessage'));
      return;
    }

    setLoading(true);
    try {
      // Vérifier si l'utilisateur peut rejoindre un groupe
      const canJoin = await groupService.canUserJoinGroup(user.id);

      if (!canJoin.can_join) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
          t('groups.join.limitReached'),
          canJoin.reason || t('groups.join.limitReachedMessage'),
          canJoin.requires_premium
            ? [
                { text: t('groups.join.later'), style: 'cancel' },
                { text: t('groups.join.seePremium'), onPress: () => navigation.navigate('Premium') },
              ]
            : [{ text: 'OK' }]
        );
        return;
      }

      // Rejoindre le groupe
      const result = await groupService.joinGroup(user.id, cleanedCode);

      // Vérifier que l'ID du groupe est valide
      if (!result?.group_id) {
        throw new Error('Invalid group ID returned from server');
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigation vers le dashboard du groupe
      navigation.goBack();

      setTimeout(() => {
        navigation.navigate('GroupDashboard', { groupId: result.group_id as string });
      }, 150);
    } catch (error: any) {
      console.error('❌ Error joining group:', error);
      console.error('❌ Error message:', error.message);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // ✅ Gestion détaillée des erreurs
      let title = t('groups.dashboard.error');
      let message = t('groups.join.errorJoining');

      if (error.message) {
        const errorMsg = error.message.toLowerCase();

        if (errorMsg.includes('invalide') || errorMsg.includes('invalid')) {
          title = t('groups.join.invalidCode');
          message = t('groups.join.invalidCodeMessage');
        } else if (errorMsg.includes('déjà membre') || errorMsg.includes('already a member')) {
          title = t('groups.join.alreadyMember');
          message = t('groups.join.alreadyMemberMessage');
        } else if (errorMsg.includes('limite') || errorMsg.includes('limit')) {
          title = t('groups.join.limitReached');
          message = error.message;
        } else if (errorMsg.includes('group_id') || errorMsg.includes('uuid')) {
          title = t('groups.dashboard.error');
          message = 'Une erreur est survenue. Veuillez réessayer.';
        } else {
          // Message d'erreur personnalisé de la DB
          message = error.message;
        }
      }

      console.log('🚨 Showing alert:', { title, message });
      Alert.alert(title, message);
    } finally {
      setLoading(false);
    }
  };

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

          <Text style={tw`text-xl font-bold text-stone-800`}>{t('groups.join.title')}</Text>

          <View style={tw`w-10`} />
        </View>
      </View>

      <View style={tw`flex-1 px-6 py-6`}>
        <View
          style={[
            tw`rounded-full p-6 mb-6 self-center`,
            {
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
            },
          ]}
        >
          <UserPlus size={48} color="#3b82f6" strokeWidth={2} />
        </View>

        <Text style={tw`text-2xl font-bold text-stone-800 text-center mb-2`}>{t('groups.join.enterCode')}</Text>
        <Text style={tw`text-base text-stone-500 text-center mb-8`}>{t('groups.join.description')}</Text>

        <View style={tw`mb-6`}>
          <Text style={tw`text-sm font-semibold text-stone-700 mb-3`}>{t('groups.join.inviteCode')}</Text>
          <TextInput
            value={code}
            onChangeText={handleCodeChange}
            placeholder="ABC-123"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={7}
            style={[
              tw`rounded-xl px-4 py-4 text-center text-2xl font-bold text-stone-800 tracking-widest`,
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
        </View>

        <TouchableOpacity
          onPress={handleJoin}
          disabled={cleanInviteCode(code).length !== 6 || loading}
          style={[
            tw`rounded-2xl px-6 py-4 flex-row items-center justify-center`,
            {
              backgroundColor: '#3b82f6',
              shadowColor: '#3b82f6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            },
            (cleanInviteCode(code).length !== 6 || loading) && { opacity: 0.5 },
          ]}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <LogIn size={20} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={tw`text-base font-bold text-white ml-2`}>{t('groups.join.button')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
