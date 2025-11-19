/**
 * ============================================================================
 * StatsScreen.tsx
 * ============================================================================
 *
 * Ecran de statistiques affichant les analyses et prédictions de l'utilisateur.
 * Présente le niveau actuel, les prédictions de succès et les analytics premium.
 *
 * Fonctionnalités principales:
 * - Affichage du niveau et progression de l'utilisateur
 * - Carte de prédiction de succès basée sur les habitudes
 * - Section analytics premium avec différentes périodes
 * - Support multilingue pour les dates
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { BarChart3 } from 'lucide-react-native';
import { format } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';

import PremiumStatsSection from '@/components/premium/PremiumStatsSection';
import PredictionCard from '@/components/stats/PredictionCard';

import { useHabits } from '@/context/HabitContext';
import { useStats } from '@/context/StatsContext';

import tw from '@/lib/tailwind';

// ============================================================================
// TYPES
// ============================================================================

type TimeRange = 'week' | 'month' | '4weeks';

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const StatsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { habits, loading: habitsLoading, refreshHabits } = useHabits();
  const { stats, refreshStats } = useStats();

  // ============================================================================
  // HOOKS - State
  // ============================================================================

  const [refreshing, setRefreshing] = useState(false);
  const [selectedRange, setSelectedRange] = useState<TimeRange>('week');

  // ============================================================================
  // VARIABLES DERIVEES
  // ============================================================================

  const dateLocale = i18n.language === 'fr' ? fr : enUS;
  const safeHabits = Array.isArray(habits) ? habits : [];

  // ============================================================================
  // GESTIONNAIRES D'EVENEMENTS
  // ============================================================================

  /**
   * Rafraîchit les données des habitudes et statistiques
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshHabits(), refreshStats(true)]);
    setRefreshing(false);
  };

  // ============================================================================
  // RENDU - État de chargement
  // ============================================================================

  if (habitsLoading || !habits) {
    return (
      <ImageBackground
        source={require('../../assets/interface/textures/texture-white.png')}
        style={tw`flex-1`}
        imageStyle={{ opacity: 0.15 }}
        resizeMode="repeat"
      >
        <View style={tw`flex-1 bg-transparent items-center justify-center`}>
          <ActivityIndicator size="large" color="#9333EA" />
          <Text style={tw`text-stone-500 mt-4`}>{t('stats.loading')}</Text>
        </View>
      </ImageBackground>
    );
  }

  // ============================================================================
  // RENDU PRINCIPAL
  // ============================================================================

  return (
    <ImageBackground
      source={require('../../assets/interface/textures/texture-white.png')}
      style={{ flex: 1 }}
      imageStyle={{ opacity: 0.15 }}
      resizeMode="repeat"
    >
      <View style={{ flex: 1, backgroundColor: 'transparent' }}>
        <ScrollView
          style={{ flex: 1, marginTop: 45 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#059669"
            />
          }
        >
          {/* En-tête avec dégradé jade */}
          <LinearGradient
            colors={['#d1fae5', '#a7f3d0', '#6ee7b7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingHorizontal: 20, paddingTop: 40, paddingBottom: 20 }}
          >
            <View style={{ alignItems: 'center' }}>
              {/* Badge sous-titre */}
              <View
                style={{
                  backgroundColor: 'rgba(5, 150, 105, 0.15)',
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  borderRadius: 16,
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: '#047857',
                    letterSpacing: 2,
                  }}
                >
                  {t('stats.subtitle')}
                </Text>
              </View>

              {/* Titre principal */}
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: '900',
                  color: '#064e3b',
                  letterSpacing: -1,
                }}
              >
                {t('stats.title')}
              </Text>

              {/* Date du jour */}
              <Text
                style={{
                  fontSize: 13,
                  color: '#065f46',
                  marginTop: 4,
                  fontWeight: '600',
                }}
              >
                {format(new Date(), 'EEEE, MMMM d', { locale: dateLocale })}
              </Text>
            </View>

            {/* Badge du niveau */}
            <View style={{ alignItems: 'center', marginTop: 12 }}>
              <LinearGradient
                colors={['#059669', '#047857']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 20,
                  shadowColor: '#059669',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    color: '#FFFFFF',
                    fontWeight: '700',
                    letterSpacing: 1,
                  }}
                >
                  {t('stats.level', { level: stats?.level || 1 })}
                </Text>
              </LinearGradient>
            </View>
          </LinearGradient>

          {/* Carte de prédiction de succès */}
          <View style={{ paddingHorizontal: 24, marginBottom: 20, paddingTop: 20 }}>
            <PredictionCard habits={safeHabits} />
          </View>

          {/* En-tête section Analytics */}
          <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={18} color="#60a5fa" />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '800',
                  color: '#60a5fa',
                  letterSpacing: 1.5,
                }}
              >
                {t('stats.analytics')}
              </Text>
            </View>
          </View>

          {/* Section Analytics Premium */}
          <View style={{ paddingHorizontal: 24, marginBottom: 28 }}>
            <PremiumStatsSection
              habits={safeHabits}
              selectedRange={selectedRange}
              onRangeChange={setSelectedRange}
            />
          </View>

          {/* Espacement bas de page */}
          <View style={{ height: 80 }} />
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

export default StatsScreen;
