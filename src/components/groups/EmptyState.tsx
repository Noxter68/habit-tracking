// components/groups/EmptyState.tsx
// État vide quand l'utilisateur n'a pas encore de groupes

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Users, Plus, LogIn } from 'lucide-react-native';
import tw from '@/lib/tailwind';

interface EmptyStateProps {
  onCreateGroup: () => void;
  onJoinGroup: () => void;
}

export function EmptyState({ onCreateGroup, onJoinGroup }: EmptyStateProps) {
  return (
    <View style={tw`items-center justify-center py-12`}>
      {/* Icône */}
      <View style={tw`w-20 h-20 bg-[#F3F4F6] rounded-full items-center justify-center mb-6`}>
        <Users size={40} color="#A78BFA" strokeWidth={1.5} />
      </View>

      {/* Titre et description */}
      <Text style={tw`text-xl font-bold text-gray-900 mb-2 text-center`}>Aucun groupe pour le moment</Text>
      <Text style={tw`text-base text-gray-500 text-center px-8 mb-8`}>Créez un groupe ou rejoignez-en un avec un code d'invitation</Text>

      {/* Boutons d'action */}
      <View style={tw`gap-3 w-full`}>
        <TouchableOpacity onPress={onCreateGroup} style={tw`bg-[#A78BFA] rounded-2xl px-6 py-4 flex-row items-center justify-center gap-2 shadow-sm`} activeOpacity={0.8}>
          <Plus size={20} color="#FFFFFF" />
          <Text style={tw`text-base font-semibold text-white`}>Créer un groupe</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onJoinGroup} style={tw`bg-white rounded-2xl px-6 py-4 flex-row items-center justify-center gap-2 border border-gray-200`} activeOpacity={0.8}>
          <LogIn size={20} color="#6B7280" />
          <Text style={tw`text-base font-semibold text-gray-700`}>Rejoindre un groupe</Text>
        </TouchableOpacity>
      </View>

      {/* Info premium (optionnel) */}
      <View style={tw`mt-8 bg-[#FEF3C7] rounded-xl px-4 py-3`}>
        <Text style={tw`text-xs text-[#92400E] text-center`}>💎 Passez Premium pour créer jusqu'à 5 groupes</Text>
      </View>
    </View>
  );
}
