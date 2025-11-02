// src/components/EditUsernameModal.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import tw from 'twrnc';
import { supabase } from '@/lib/supabase';
import Logger from '@/utils/logger';

interface EditUsernameModalProps {
  visible: boolean;
  currentUsername: string;
  userId: string;
  onClose: () => void;
  onSuccess: (newUsername: string) => void;
}

const EditUsernameModal: React.FC<EditUsernameModalProps> = ({ visible, currentUsername, userId, onClose, onSuccess }) => {
  const [username, setUsername] = useState(currentUsername);
  const [loading, setLoading] = useState(false);

  const checkUsernameAvailability = async (newUsername: string): Promise<boolean> => {
    try {
      // Vérifier si le username existe déjà (en excluant l'utilisateur actuel)
      const { data, error } = await supabase.from('profiles').select('id').eq('username', newUsername).neq('id', userId).maybeSingle();

      if (error) {
        Logger.error('Error checking username:', error);
        return false;
      }

      // Si data existe, c'est que le username est déjà pris
      return data === null;
    } catch (error) {
      Logger.error('Exception checking username:', error);
      return false;
    }
  };

  const handleSave = async () => {
    // Validation de base
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      Alert.alert('Invalid Username', 'Username cannot be empty');
      return;
    }

    if (trimmedUsername.length < 3) {
      Alert.alert('Invalid Username', 'Username must be at least 3 characters');
      return;
    }

    if (trimmedUsername.length > 20) {
      Alert.alert('Invalid Username', 'Username must be less than 20 characters');
      return;
    }

    // Validation des caractères (alphanumérique + underscore uniquement)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(trimmedUsername)) {
      Alert.alert('Invalid Username', 'Username can only contain letters, numbers, and underscores');
      return;
    }

    if (trimmedUsername === currentUsername) {
      onClose();
      return;
    }

    try {
      setLoading(true);

      // Vérifier la disponibilité
      const isAvailable = await checkUsernameAvailability(trimmedUsername);

      if (!isAvailable) {
        Alert.alert('Username Taken', 'This username is already in use. Please choose another one.');
        return;
      }

      // Update username in profiles table
      const { error } = await supabase
        .from('profiles')
        .update({
          username: trimmedUsername,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      Logger.debug('✅ Username updated successfully');
      onSuccess(trimmedUsername);
      onClose();
    } catch (error: any) {
      Logger.error('Error updating username:', error);

      // Message d'erreur plus user-friendly
      if (error.code === '23505') {
        Alert.alert('Username Taken', 'This username is already in use. Please choose another one.');
      } else {
        Alert.alert('Update Failed', error.message || 'Unable to update username');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={20} style={tw`flex-1 justify-center items-center px-6`}>
        <TouchableOpacity activeOpacity={1} onPress={onClose} style={tw`absolute inset-0`} />

        <View style={tw`bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl`}>
          {/* Header */}
          <Text style={tw`text-2xl font-bold text-gray-800 mb-2`}>Edit Username</Text>
          <Text style={tw`text-gray-500 text-sm mb-6`}>Choose a unique username (3-20 characters, letters, numbers, and underscores only)</Text>

          {/* Input */}
          <View style={tw`mb-6`}>
            <Text style={tw`text-xs font-bold text-gray-600 uppercase tracking-wide mb-2`}>Username</Text>
            <TextInput
              style={tw`bg-gray-50 rounded-2xl px-4 py-3.5 text-base text-gray-800 font-medium border-2 border-gray-200`}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              editable={!loading}
            />
            <Text style={tw`text-xs text-gray-400 mt-1.5`}>{username.trim().length}/20 characters</Text>
          </View>

          {/* Actions */}
          <View style={tw`flex-row gap-3`}>
            <TouchableOpacity onPress={onClose} disabled={loading} style={tw`flex-1 bg-gray-100 rounded-2xl py-3.5 items-center`}>
              <Text style={tw`text-gray-700 font-bold text-base`}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSave} disabled={loading} style={tw`flex-1 bg-indigo-600 rounded-2xl py-3.5 items-center ${loading ? 'opacity-50' : ''}`}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={tw`text-white font-bold text-base`}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

export default EditUsernameModal;
