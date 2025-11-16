// screens/JoinGroupScreen.tsx
// Écran pour rejoindre un groupe via code d'invitation

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { X, LogIn, UserPlus } from 'lucide-react-native';
import { groupService } from '@/services/groupTypeService';
import { useAuth } from '@/context/AuthContext';
import { isValidInviteCode, cleanInviteCode, formatInviteCode } from '@/utils/groupUtils';
import tw from '@/lib/tailwind';

type NavigationProp = NativeStackNavigationProp<any>;

export default function JoinGroupScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCodeChange = (text: string) => {
    const cleaned = text.replace(/[^A-Z0-9]/g, '').toUpperCase();
    if (cleaned.length <= 6) {
      setCode(cleaned.length > 3 ? formatInviteCode(cleaned) : cleaned);
    }
  };

  const handleJoin = async () => {
    if (!user?.id) return;

    const cleanCode = cleanInviteCode(code);

    if (!isValidInviteCode(cleanCode)) {
      Alert.alert(t('groups.join.invalidCode'), t('groups.join.invalidCodeMessage'));
      return;
    }

    setLoading(true);
    try {
      const result = await groupService.joinGroup(user.id, { invite_code: cleanCode });

      if (!result.success) {
        if (result.error === 'invalid_code') {
          Alert.alert(t('groups.join.invalidCode'), t('groups.join.codeNotFound'));
        } else if (result.error === 'already_member') {
          Alert.alert(t('groups.join.alreadyMember'), t('groups.join.alreadyMemberMessage'));
        } else if (result.error === 'user_groups_limit') {
          Alert.alert(
            t('groups.join.limitReached'),
            result.message || t('groups.join.limitReachedMessage'),
            result.requires_premium
              ? [
                  { text: t('groups.join.later'), style: 'cancel' },
                  { text: t('groups.join.seePremium'), onPress: () => navigation.navigate('Premium') },
                ]
              : [{ text: 'OK' }]
          );
        } else if (result.error === 'group_members_limit') {
          Alert.alert(t('groups.join.groupFull'), result.message || t('groups.join.groupFullMessage'));
        } else {
          Alert.alert(t('groups.dashboard.error'), result.message || t('groups.join.errorJoining'));
        }
        return;
      }

      Alert.alert(t('groups.join.success'), t('groups.join.successMessage'), [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('MainTabs', {
              screen: 'Groups',
              params: {
                screen: 'GroupDashboard',
                params: { groupId: result.group_id },
              },
            });
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error joining group:', error);
      Alert.alert(t('groups.dashboard.error'), error.message || t('groups.join.errorJoining'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={tw`flex-1 bg-[#FAFAFA]`}>
      <View style={tw`px-6 pt-6 pb-4 bg-white border-b border-gray-100`}>
        <View style={tw`flex-row items-center justify-between`}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={tw`w-10 h-10 items-center justify-center`}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>

          <Text style={tw`text-xl font-bold text-gray-900`}>{t('groups.join.title')}</Text>

          <View style={tw`w-10`} />
        </View>
      </View>

      <View style={tw`flex-1 px-6 py-6`}>
        <View style={tw`items-center mb-8`}>
          <View
            style={[
              tw`w-20 h-20 rounded-full items-center justify-center mb-4`,
              {
                backgroundColor: 'rgba(167, 139, 250, 0.1)',
              },
            ]}
          >
            <UserPlus size={40} color="#A78BFA" strokeWidth={2} />
          </View>
          <Text style={tw`text-base text-gray-600 text-center px-8`}>{t('groups.join.description')}</Text>
        </View>

        <View style={tw`mb-6`}>
          <Text style={tw`text-sm font-semibold text-gray-700 mb-3`}>{t('groups.join.inviteCode')}</Text>
          <TextInput
            value={code}
            onChangeText={handleCodeChange}
            placeholder={t('groups.join.placeholder')}
            placeholderTextColor="#9CA3AF"
            maxLength={7}
            autoCapitalize="characters"
            style={tw`bg-white rounded-xl px-4 py-4 text-xl text-center font-mono text-gray-900 border-2 border-gray-200 tracking-widest`}
            autoFocus
          />
        </View>

        <View style={tw`bg-blue-50 rounded-xl p-4 mb-6`}>
          <Text style={tw`text-sm text-blue-900 leading-relaxed`}>{t('groups.join.info')}</Text>
        </View>

        <TouchableOpacity
          onPress={handleJoin}
          disabled={cleanInviteCode(code).length !== 6 || loading}
          style={[tw`bg-[#A78BFA] rounded-2xl px-6 py-4 flex-row items-center justify-center gap-2 shadow-sm`, (cleanInviteCode(code).length !== 6 || loading) && tw`opacity-50`]}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <LogIn size={20} color="#FFFFFF" />
              <Text style={tw`text-base font-semibold text-white`}>{t('groups.join.button')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
