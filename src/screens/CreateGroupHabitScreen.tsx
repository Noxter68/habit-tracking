// screens/CreateGroupHabitScreen.tsx
// Écran pour créer une habitude dans un groupe avec fréquence et durée

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp as RNRouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { X, Calendar, Clock, Target } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { groupService } from '@/services/groupTypeService';
import { useAuth } from '@/context/AuthContext';
import { validateName } from '@/utils/groupUtils';
import { EmojiPicker } from '@/components/groups/EmojiPicker';
import tw from '@/lib/tailwind';

type NavigationProp = NativeStackNavigationProp<any>;
type RouteParams = RNRouteProp<{ CreateGroupHabit: { groupId: string } }, 'CreateGroupHabit'>;

type Frequency = 'daily' | 'weekly';

const DURATIONS = [
  { value: null, label: 'Aucune' },
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 20, label: '20 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1h' },
  { value: 90, label: '1h30' },
  { value: 120, label: '2h' },
];

export default function CreateGroupHabitScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const { user } = useAuth();
  const { groupId } = route.params;

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [duration, setDuration] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!user?.id) return;

    // Validation
    const validation = validateName(name);
    if (!validation.valid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', validation.error);
      return;
    }

    setLoading(true);
    try {
      // Vérifier les limites d'habitudes
      const canAdd = await groupService.canGroupAddHabit(groupId, user.id);

      if (!canAdd.can_add) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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

      // Créer l'habitude avec fréquence et durée
      await groupService.createGroupHabit(user.id, {
        group_id: groupId,
        name,
        emoji,
        frequency,
        duration_minutes: duration,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error: any) {
      console.error('Error creating habit:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', error.message || "Impossible de créer l'habitude");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={tw`flex-1 bg-[#FAFAFA]`}>
      {/* Header minimaliste */}
      <View style={tw`px-6 pt-8 pb-4 bg-[#FAFAFA]`}>
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

          <Text style={tw`text-xl font-bold text-stone-800`}>Nouvelle habitude</Text>

          <View style={tw`w-10`} />
        </View>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-6 py-2`}>
        {/* Nom de l'habitude */}
        <View style={tw`mb-4`}>
          <Text style={tw`text-sm font-semibold text-stone-700 mb-3`}>Nom de l'habitude</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ex: Morning Run"
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
          <Text style={tw`text-xs text-stone-500 mt-2`}>{name.length}/50 caractères</Text>
        </View>

        {/* Fréquence */}
        <View style={tw`mb-4`}>
          <View style={tw`flex-row items-center gap-2 mb-3`}>
            <Calendar size={16} color="#57534E" />
            <Text style={tw`text-sm font-semibold text-stone-700`}>Fréquence</Text>
          </View>
          <View style={tw`flex-row gap-3`}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFrequency('daily');
              }}
              style={[
                tw`flex-1 rounded-xl px-4 py-3 items-center`,
                {
                  backgroundColor: frequency === 'daily' ? '#3b82f6' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: frequency === 'daily' ? '#3b82f6' : 'rgba(0, 0, 0, 0.08)',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: frequency === 'daily' ? 0.2 : 0.05,
                  shadowRadius: 4,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[tw`text-sm font-semibold`, { color: frequency === 'daily' ? '#FFFFFF' : '#57534E' }]}>Quotidien</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFrequency('weekly');
              }}
              style={[
                tw`flex-1 rounded-xl px-4 py-3 items-center`,
                {
                  backgroundColor: frequency === 'weekly' ? '#3b82f6' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: frequency === 'weekly' ? '#3b82f6' : 'rgba(0, 0, 0, 0.08)',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: frequency === 'weekly' ? 0.2 : 0.05,
                  shadowRadius: 4,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[tw`text-sm font-semibold`, { color: frequency === 'weekly' ? '#FFFFFF' : '#57534E' }]}>Hebdomadaire</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Durée */}
        <View style={tw`mb-4`}>
          <View style={tw`flex-row items-center gap-2 mb-3`}>
            <Clock size={16} color="#57534E" />
            <Text style={tw`text-sm font-semibold text-stone-700`}>Durée estimée (optionnel)</Text>
          </View>
          <View style={tw`flex-row flex-wrap gap-2`}>
            {DURATIONS.map((dur) => (
              <TouchableOpacity
                key={dur.value?.toString() || 'none'}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDuration(dur.value);
                }}
                style={[
                  tw`rounded-xl px-4 py-2`,
                  {
                    backgroundColor: duration === dur.value ? '#3b82f6' : '#FFFFFF',
                    borderWidth: 1,
                    borderColor: duration === dur.value ? '#3b82f6' : 'rgba(0, 0, 0, 0.08)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: duration === dur.value ? 0.2 : 0.03,
                    shadowRadius: 2,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[tw`text-sm font-semibold`, { color: duration === dur.value ? '#FFFFFF' : '#57534E' }]}>{dur.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info */}
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
          <Target size={20} color="#3B82F6" strokeWidth={2} style={tw`mt-0.5`} />
          <Text style={tw`text-sm text-blue-900 leading-relaxed flex-1`}>
            Tous les membres du groupe pourront compléter cette habitude {frequency === 'daily' ? 'chaque jour' : 'chaque semaine'}. Le streak collectif se maintient si tout le monde complète.
          </Text>
        </View>

        {/* Bouton créer */}
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
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={tw`text-base font-bold text-white`}>Créer l'habitude</Text>}
        </TouchableOpacity>

        <View style={tw`h-8`} />
      </ScrollView>
    </View>
  );
}
