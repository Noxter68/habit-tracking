// screens/JoinGroupScreen.tsx
// Écran pour rejoindre un groupe via code d'invitation

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { X, LogIn } from 'lucide-react-native';
import { groupService } from '@/services/groupTypeService';
import { useAuth } from '@/context/AuthContext';
import { isValidInviteCode, cleanInviteCode, formatInviteCode } from '@/utils/groupUtils';
import tw from '@/lib/tailwind';

type NavigationProp = NativeStackNavigationProp<any>;

export default function JoinGroupScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCodeChange = (text: string) => {
    // Formater automatiquement avec tiret après 3 caractères
    const cleaned = text.replace(/[^A-Z0-9]/g, '').toUpperCase();
    if (cleaned.length <= 6) {
      setCode(cleaned.length > 3 ? formatInviteCode(cleaned) : cleaned);
    }
  };

  const handleJoin = async () => {
    if (!user?.id) return;

    const cleanCode = cleanInviteCode(code);

    // Validation
    if (!isValidInviteCode(cleanCode)) {
      Alert.alert('Code invalide', 'Le code doit contenir 6 caractères (lettres et chiffres)');
      return;
    }

    setLoading(true);
    try {
      const result = await groupService.joinGroup(user.id, { invite_code: cleanCode });

      if (!result.success) {
        // Gérer les différents types d'erreurs
        if (result.error === 'invalid_code') {
          Alert.alert('Code invalide', "Ce code d'invitation n'existe pas");
        } else if (result.error === 'already_member') {
          Alert.alert('Déjà membre', 'Vous êtes déjà membre de ce groupe');
        } else if (result.error === 'user_groups_limit') {
          Alert.alert(
            'Limite atteinte',
            result.message || 'Vous avez atteint votre limite de groupes',
            result.requires_premium
              ? [
                  { text: 'Plus tard', style: 'cancel' },
                  { text: 'Voir Premium', onPress: () => navigation.navigate('Premium') },
                ]
              : [{ text: 'OK' }]
          );
        } else if (result.error === 'group_members_limit') {
          Alert.alert('Groupe complet', result.message || 'Ce groupe est complet');
        } else {
          Alert.alert('Erreur', result.message || 'Impossible de rejoindre le groupe');
        }
        return;
      }

      // Succès !
      Alert.alert('Groupe rejoint ! 🎉', 'Vous pouvez maintenant voir les habitudes partagées', [
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
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={tw`flex-1 bg-[#FAFAFA]`}>
      {/* Header */}
      <View style={tw`px-6 pt-16 pb-4 bg-white border-b border-gray-100`}>
        <View style={tw`flex-row items-center justify-between`}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={tw`w-10 h-10 items-center justify-center`}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>

          <Text style={tw`text-xl font-bold text-gray-900`}>Rejoindre un groupe</Text>

          <View style={tw`w-10`} />
        </View>
      </View>

      <View style={tw`flex-1 px-6 py-6`}>
        {/* Illustration */}
        <View style={tw`items-center mb-8`}>
          <View style={tw`w-20 h-20 bg-[#F3F4F6] rounded-full items-center justify-center mb-4`}>
            <Text style={tw`text-4xl`}>🔑</Text>
          </View>
          <Text style={tw`text-base text-gray-600 text-center px-8`}>Entrez le code d'invitation partagé par le créateur du groupe</Text>
        </View>

        {/* Input code */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-sm font-semibold text-gray-700 mb-3`}>Code d'invitation</Text>
          <TextInput
            value={code}
            onChangeText={handleCodeChange}
            placeholder="ABC-123"
            placeholderTextColor="#9CA3AF"
            maxLength={7} // 6 chars + 1 tiret
            autoCapitalize="characters"
            style={tw`bg-white rounded-xl px-4 py-4 text-xl text-center font-mono text-gray-900 border-2 border-gray-200 tracking-widest`}
            autoFocus
          />
        </View>

        {/* Info */}
        <View style={tw`bg-blue-50 rounded-xl p-4 mb-6`}>
          <Text style={tw`text-sm text-blue-900 leading-relaxed`}>💡 Le code est composé de 6 caractères (lettres et chiffres)</Text>
        </View>

        {/* Bouton rejoindre */}
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
              <Text style={tw`text-base font-semibold text-white`}>Rejoindre le groupe</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
