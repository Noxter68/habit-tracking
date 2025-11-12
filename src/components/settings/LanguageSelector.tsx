// src/screens/LanguageSelectorScreen.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import tw from '@/lib/tailwind';
import { HapticFeedback } from '@/utils/haptics';
import { ChevronLeft } from 'lucide-react-native';
import { LanguageDetectionService } from '@/services/languageDetectionService';
import { useAuth } from '@/context/AuthContext';
import Logger from '@/utils/logger';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
] as const;

type LanguageCode = (typeof LANGUAGES)[number]['code'];

const LanguageSelectorScreen: React.FC = () => {
  const { i18n, t } = useTranslation();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [isChanging, setIsChanging] = useState(false);

  const changeLanguage = async (langCode: LanguageCode) => {
    if (isChanging || i18n.language === langCode) return;

    if (!user?.id) {
      Alert.alert(t('common.error'), 'User not authenticated. Please sign in again.');
      return;
    }

    HapticFeedback.light();
    setIsChanging(true);

    try {
      Logger.debug(`🌍 Changing language to: ${langCode}`);

      // Met à jour dans la DB et i18n
      await LanguageDetectionService.updateUserLanguage(user.id, langCode);

      Logger.debug(`✅ Language changed successfully to ${langCode}`);

      // Petit délai pour que l'utilisateur voie le changement
      setTimeout(() => {
        setIsChanging(false);
        HapticFeedback.success();
        navigation.goBack();
      }, 300);
    } catch (error) {
      Logger.error('Error changing language:', error);
      setIsChanging(false);
      Alert.alert(t('common.error'), t('settings.languageChangeError'));
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      {/* Header */}
      <View style={tw`px-6 py-5 flex-row items-center border-b border-zinc-100`}>
        <Pressable onPress={() => navigation.goBack()} style={tw`p-2 -ml-2`} disabled={isChanging}>
          <ChevronLeft size={24} color="#52525B" strokeWidth={2.5} />
        </Pressable>
        <Text style={tw`text-xl font-bold text-zinc-800 ml-2`}>{t('settings.language')}</Text>
      </View>

      {/* Languages List */}
      <View style={tw`p-6 gap-3`}>
        {LANGUAGES.map((lang) => {
          const isSelected = i18n.language === lang.code;
          const isProcessing = isChanging && !isSelected;

          return (
            <Pressable
              key={lang.code}
              onPress={() => changeLanguage(lang.code)}
              disabled={isChanging}
              style={({ pressed }) => [
                tw`flex-row items-center p-4 bg-white rounded-2xl shadow-sm border-2`,
                isSelected ? tw`border-zinc-700` : tw`border-zinc-200`,
                pressed && !isChanging && tw`opacity-70`,
                isChanging && tw`opacity-50`,
              ]}
            >
              <Text style={tw`text-3xl mr-4`}>{lang.flag}</Text>
              <Text style={tw`flex-1 text-base font-semibold text-zinc-800`}>{lang.label}</Text>

              {isProcessing ? (
                <ActivityIndicator size="small" color="#52525B" />
              ) : isSelected ? (
                <View style={tw`w-6 h-6 rounded-full bg-zinc-700 items-center justify-center`}>
                  <Text style={tw`text-white text-xs font-bold`}>✓</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {/* Info Text */}
      <View style={tw`px-6 mt-4`}>
        <Text style={tw`text-sm text-zinc-500 text-center leading-5`}>{t('settings.languageChangeInfo')}</Text>
      </View>
    </SafeAreaView>
  );
};

export default LanguageSelectorScreen;
