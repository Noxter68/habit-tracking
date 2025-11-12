// src/screens/LanguageSelectorScreen.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, SafeAreaView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import tw from '@/lib/tailwind';
import { HapticFeedback } from '@/utils/haptics';
import { ChevronLeft } from 'lucide-react-native';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

const LanguageSelectorScreen: React.FC = () => {
  const { i18n, t } = useTranslation();
  const navigation = useNavigation();
  const [isChanging, setIsChanging] = useState(false);

  const changeLanguage = async (langCode: string) => {
    if (isChanging || i18n.language === langCode) return;

    HapticFeedback.light();
    setIsChanging(true);

    try {
      // i18n.changeLanguage utilise automatiquement le cacheUserLanguage du languageDetector
      await i18n.changeLanguage(langCode);

      // Petit délai pour que l'utilisateur voie le changement
      setTimeout(() => {
        setIsChanging(false);
        navigation.goBack();
      }, 300);
    } catch (error) {
      console.error('Error changing language:', error);
      setIsChanging(false);
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-sand-50`}>
      {/* Header */}
      <View style={tw`px-5 py-4 flex-row items-center border-b border-sand-200`}>
        <Pressable onPress={() => navigation.goBack()} style={tw`p-2 -ml-2`} disabled={isChanging}>
          <ChevronLeft size={24} color="#57534e" />
        </Pressable>
        <Text style={tw`text-lg font-bold text-stone-800 ml-2`}>{t('settings.language')}</Text>
      </View>

      {/* Languages List */}
      <View style={tw`p-5 gap-3`}>
        {LANGUAGES.map((lang) => {
          const isSelected = i18n.language === lang.code;

          return (
            <Pressable
              key={lang.code}
              onPress={() => changeLanguage(lang.code)}
              disabled={isChanging}
              style={[tw`flex-row items-center p-4 bg-white rounded-2xl shadow-sm`, isSelected && tw`border-2 border-blue-500`, isChanging && tw`opacity-50`]}
            >
              <Text style={tw`text-3xl mr-4`}>{lang.flag}</Text>
              <Text style={tw`flex-1 text-base font-semibold text-stone-800`}>{lang.label}</Text>

              {isChanging && !isSelected ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : isSelected ? (
                <View style={tw`w-6 h-6 rounded-full bg-blue-500 items-center justify-center`}>
                  <Text style={tw`text-white text-sm`}>✓</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {/* Info Text */}
      <View style={tw`px-5 mt-4`}>
        <Text style={tw`text-sm text-stone-500 text-center`}>{t('settings.languageChangeInfo')}</Text>
      </View>
    </SafeAreaView>
  );
};

export default LanguageSelectorScreen;
