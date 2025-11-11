// src/components/settings/LanguageSelector.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tw from '@/lib/tailwind';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

export const LanguageSelector = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  return (
    <View style={tw`gap-2`}>
      {LANGUAGES.map((lang) => (
        <Pressable key={lang.code} onPress={() => changeLanguage(lang.code)} style={tw`flex-row items-center p-4 bg-white rounded-xl ${i18n.language === lang.code ? 'border-2 border-blue-500' : ''}`}>
          <Text style={tw`text-2xl mr-3`}>{lang.flag}</Text>
          <Text style={tw`flex-1 font-semibold`}>{lang.label}</Text>
          {i18n.language === lang.code && <Text style={tw`text-blue-500`}>✓</Text>}
        </Pressable>
      ))}
    </View>
  );
};
