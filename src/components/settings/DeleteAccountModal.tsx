/**
 * ============================================================================
 * DeleteAccountModal.tsx
 * ============================================================================
 *
 * Modal de confirmation pour la suppression du compte utilisateur.
 * Affiche un avertissement et demande une confirmation explicite.
 */

import React, { useState } from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { AlertTriangle } from 'lucide-react-native';
import tw from 'twrnc';
import { useTranslation } from 'react-i18next';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ visible, onClose, onConfirm }) => {
  const { t, i18n } = useTranslation();
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const isConfirmValid = confirmText.trim().toUpperCase() === t('settings.typeDelete');

  const handleConfirm = async () => {
    if (!isConfirmValid) {
      return;
    }

    try {
      setLoading(true);
      await onConfirm();
      onClose();
      setConfirmText('');
    } catch (error) {
      // L'erreur est gérée par le parent
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setConfirmText('');
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <BlurView intensity={20} style={tw`flex-1 justify-center items-center px-6`}>
        <TouchableOpacity activeOpacity={1} onPress={handleClose} style={tw`absolute inset-0`} />

        <View style={tw`bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl`}>
          {/* Header avec icône d'avertissement */}
          <View style={tw`items-center mb-4`}>
            <View style={tw`w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-3`}>
              <AlertTriangle size={32} color="#DC2626" strokeWidth={2.5} />
            </View>
            <Text style={tw`text-2xl font-bold text-zinc-800 mb-2 text-center`}>
              {t('settings.deleteAccountTitle')}
            </Text>
          </View>

          {/* Message d'avertissement */}
          <View style={tw`bg-red-50 rounded-2xl p-4 mb-6 border-2 border-red-200`}>
            <Text style={tw`text-zinc-700 text-sm leading-5`}>
              {t('settings.deleteAccountConfirm')}
            </Text>
          </View>

          {/* Input de confirmation */}
          <View style={tw`mb-6`}>
            <Text style={tw`text-xs font-bold text-zinc-600 uppercase tracking-wide mb-2`}>
              {t('settings.deleteAccountPlaceholder')}
            </Text>
            <TextInput
              style={tw`bg-zinc-50 rounded-2xl px-4 py-3.5 text-base text-zinc-800 font-medium border-2 ${
                confirmText && !isConfirmValid ? 'border-red-300' : 'border-zinc-200'
              }`}
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder={t('settings.typeDelete')}
              placeholderTextColor="#A1A1AA"
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!loading}
            />
            {confirmText && !isConfirmValid && (
              <Text style={tw`text-xs text-red-500 mt-1.5`}>
                Tapez "{t('settings.typeDelete')}" pour confirmer
              </Text>
            )}
          </View>

          {/* Actions */}
          <View style={tw`flex-row gap-3`}>
            <TouchableOpacity
              onPress={handleClose}
              disabled={loading}
              style={tw`flex-1 bg-zinc-100 rounded-2xl py-3.5 items-center`}
            >
              <Text style={tw`text-zinc-700 font-bold text-base`}>{t('common.cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirm}
              disabled={loading || !isConfirmValid}
              style={tw`flex-1 bg-red-600 rounded-2xl py-3.5 items-center ${
                loading || !isConfirmValid ? 'opacity-50' : ''
              }`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={tw`text-white font-bold text-base`}>{t('common.delete')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

export default DeleteAccountModal;
