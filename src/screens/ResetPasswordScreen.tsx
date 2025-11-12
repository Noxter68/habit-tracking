// screens/ResetPasswordScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '@/lib/supabase';
import Logger from '@/utils/logger';
import { useTranslation } from 'react-i18next';
import tw from '@/lib/tailwind';

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      Alert.alert(t('resetPassword.errors.sessionExpired'), t('resetPassword.errors.sessionExpiredMessage'), [{ text: 'OK', onPress: () => navigation.goBack() }]);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert(t('common.error'), t('resetPassword.errors.emptyFields'));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('resetPassword.errors.passwordMismatch'));
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(t('common.error'), t('resetPassword.errors.passwordTooShort'));
      return;
    }

    try {
      setLoading(true);
      Logger.debug('🔄 [Auth] Updating password...');

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      Logger.debug('✅ [Auth] Password updated successfully');

      Alert.alert(t('resetPassword.success.title'), t('resetPassword.success.message'), [
        {
          text: t('resetPassword.success.login'),
          onPress: () => {
            supabase.auth.signOut();
            navigation.navigate('Login' as never);
          },
        },
      ]);
    } catch (error: any) {
      Logger.error('❌ [Auth] Update password error:', error);
      Alert.alert(t('common.error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={tw`flex-1 bg-gray-50`}>
      <View style={tw`flex-1 px-6 pt-20`}>
        {/* Header */}
        <View style={tw`mb-8`}>
          <Text style={tw`text-3xl font-bold text-gray-900 mb-2`}>{t('resetPassword.title')}</Text>
          <Text style={tw`text-base text-gray-600`}>{t('resetPassword.subtitle')}</Text>
        </View>

        {/* Form */}
        <View>
          {/* New Password Input */}
          <View style={tw`mb-4`}>
            <Text style={tw`text-sm font-medium text-gray-700 mb-2`}>{t('resetPassword.newPassword')}</Text>
            <TextInput
              style={tw`bg-white border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900`}
              placeholder={t('resetPassword.newPasswordPlaceholder')}
              placeholderTextColor="#9CA3AF"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Confirm Password Input */}
          <View style={tw`mb-4`}>
            <Text style={tw`text-sm font-medium text-gray-700 mb-2`}>{t('resetPassword.confirmPassword')}</Text>
            <TextInput
              style={tw`bg-white border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900`}
              placeholder={t('resetPassword.confirmPasswordPlaceholder')}
              placeholderTextColor="#9CA3AF"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={tw`mt-6 rounded-xl py-4 ${loading ? 'bg-gray-400' : 'bg-blue-600'}`} onPress={handleResetPassword} disabled={loading}>
            <Text style={tw`text-white text-center text-base font-semibold`}>{loading ? t('resetPassword.submitting') : t('resetPassword.submit')}</Text>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity style={tw`py-4`} onPress={() => navigation.goBack()}>
            <Text style={tw`text-gray-600 text-center text-base`}>{t('resetPassword.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
