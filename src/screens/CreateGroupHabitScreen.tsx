// screens/CreateGroupHabitScreen.tsx
// Écran pour créer une habitude dans un groupe

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp as RNRouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { X, Check } from 'lucide-react-native';
import { groupService } from '@/services/groupTypeService';
import { useAuth } from '@/context/AuthContext';
import { validateName } from '@/utils/groupUtils';
import { EmojiPicker } from '@/components/groups/EmojiPicker';
import tw from '@/lib/tailwind';

type NavigationProp = NativeStackNavigationProp<any>;
type RouteParams = RNRouteProp<{ CreateGroupHabit: { groupId: string } }, 'CreateGroupHabit'>;

export default function CreateGroupHabitScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const { user } = useAuth();
  const { groupId } = route.params;

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!user?.id) return;

    // Validation
    const validation = validateName(name);
    if (!validation.valid) {
      Alert.alert('Erreur', validation.error);
      return;
    }

    setLoading(true);
    try {
      // Vérifier les limites d'habitudes
      const canAdd = await groupService.canGroupAddHabit(groupId, user.id);

      if (!canAdd.can_add) {
        Alert.alert(
          'Limite atteinte',
          canAdd.reason || "Impossible d'ajouter plus d'habitudes.",
          canAdd.requires_premium
            ? [
                { text: 'Plus tard', style: 'cancel' },
                { text: 'Voir Premium', onPress: () => navigation.navigate('Premium') },
              ]
            : [{ text: 'OK' }]
        );
        return;
      }

      // Créer l'habitude
      await groupService.createGroupHabit(user.id, {
        group_id: groupId,
        name,
        emoji,
      });

      navigation.goBack();
    } catch (error: any) {
      console.error('Error creating habit:', error);
      Alert.alert('Erreur', error.message || "Impossible de créer l'habitude");
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

          <Text style={tw`text-xl font-bold text-gray-900`}>Nouvelle habitude</Text>

          <View style={tw`w-10`} />
        </View>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-6 py-6`}>
        {/* Emoji picker */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-sm font-semibold text-gray-700 mb-3`}>Icône de l'habitude</Text>
          <EmojiPicker selectedEmoji={emoji} onEmojiSelect={setEmoji} />
        </View>

        {/* Nom de l'habitude */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-sm font-semibold text-gray-700 mb-3`}>Nom de l'habitude</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ex: Morning Run"
            placeholderTextColor="#9CA3AF"
            maxLength={50}
            style={tw`bg-white rounded-xl px-4 py-4 text-base text-gray-900 border border-gray-200`}
            autoFocus
          />
          <Text style={tw`text-xs text-gray-500 mt-2`}>{name.length}/50 caractères</Text>
        </View>

        {/* Info */}
        <View style={tw`bg-blue-50 rounded-xl p-4 mb-6`}>
          <Text style={tw`text-sm text-blue-900 leading-relaxed`}>
            💡 Tous les membres du groupe pourront compléter cette habitude chaque jour. Le streak collectif se maintient si tout le monde complète.
          </Text>
        </View>

        {/* Bouton créer */}
        <TouchableOpacity
          onPress={handleCreate}
          disabled={!name.trim() || loading}
          style={[tw`bg-[#A78BFA] rounded-2xl px-6 py-4 flex-row items-center justify-center gap-2 shadow-sm`, (!name.trim() || loading) && tw`opacity-50`]}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Check size={20} color="#FFFFFF" />
              <Text style={tw`text-base font-semibold text-white`}>Créer l'habitude</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
