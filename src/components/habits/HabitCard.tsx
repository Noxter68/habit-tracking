/**
 * HabitCard.tsx
 *
 * Carte principale d'affichage d'une habitude.
 * Affiche la progression, le tier et les statistiques de streak.
 *
 * @author HabitTracker Team
 */

// =============================================================================
// IMPORTS
// =============================================================================

// React et React Native
import React, { useMemo } from 'react';
import { View, Text, Pressable, ImageBackground, Image } from 'react-native';

// Bibliothèques externes
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle2, Circle, Flame } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

// Utilitaires
import tw from '@/lib/tailwind';
import { tierThemes } from '@/utils/tierTheme';
import { HabitProgressionService } from '@/services/habitProgressionService';
import { getTodayString, getHoursUntilMidnight, getNextMondayReset, isWeeklyHabitCompletedThisWeek, getWeeklyCompletedTasksCount, formatDateByLocale } from '@/utils/dateHelpers';
import { getTierIcon } from '@/utils/tierIcons';

// Types
import { Habit } from '@/types';
import { RootStackParamList } from '@/navigation/types';

// =============================================================================
// TYPES
// =============================================================================

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface HabitCardProps {
  habit: Habit;
  completedToday: boolean;
  onPress?: () => void;
  index: number;
  pausedTasks?: Record<string, { pausedUntil: string; reason?: string }>;
  /** Nombre de milestones debloques pour afficher l'icone du palier */
  unlockedMilestonesCount?: number;
}

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

/**
 * Retourne l'icone de gemme selon le tier
 * @param tier - Nom du tier
 * @returns Source de l'image
 */
const getGemIcon = (tier: string) => {
  switch (tier) {
    case 'Obsidian':
      return require('../../../assets/interface/gems/obsidian-gem.png');
    case 'Topaz':
      return require('../../../assets/interface/gems/topaz-gem.png');
    case 'Jade':
      return require('../../../assets/interface/gems/jade-gem.png');
    case 'Amethyst':
      return require('../../../assets/interface/gems/amethyst-gem.png');
    case 'Ruby':
      return require('../../../assets/interface/gems/ruby-gem.png');
    case 'Crystal':
    default:
      return require('../../../assets/interface/gems/crystal-gem.png');
  }
};

/**
 * Trouve la derniere date ou l'habitude a ete completee
 * @param habit - Habitude
 * @returns Date de derniere completion ou null
 */
const getLastCompletionDate = (habit: Habit): Date | null => {
  if (!habit.dailyTasks) return null;

  const completedDates = Object.entries(habit.dailyTasks)
    .filter(([_, data]) => data.allCompleted)
    .map(([dateStr]) => new Date(dateStr))
    .sort((a, b) => b.getTime() - a.getTime());

  return completedDates.length > 0 ? completedDates[0] : null;
};

/**
 * Retourne le nom traduit de l'habitude
 * Si le nom correspond à un habitName prédéfini, utilise la traduction
 * Sinon retourne le nom tel quel (custom)
 * @param habit - Habitude
 * @param t - Fonction de traduction
 * @returns Nom traduit ou original
 */
const getTranslatedHabitName = (habit: Habit, t: (key: string) => string): string => {
  // Essayer de récupérer le nom traduit depuis les catégories
  const translatedName = t(`habitHelpers.categories.${habit.type}.${habit.category}.habitName`);

  // Si la traduction existe et n'est pas la clé elle-même, l'utiliser
  if (translatedName && !translatedName.includes('habitHelpers.categories')) {
    return translatedName;
  }

  // Sinon retourner le nom stocké (custom ou fallback)
  return habit.name;
};

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

export const HabitCard: React.FC<HabitCardProps> = ({ habit, completedToday, onPress, index, pausedTasks = {}, unlockedMilestonesCount = 0 }) => {
  // ---------------------------------------------------------------------------
  // Hooks
  // ---------------------------------------------------------------------------
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NavigationProp>();

  // ---------------------------------------------------------------------------
  // Valeurs calculees
  // ---------------------------------------------------------------------------

  // Calcul reactif du tier
  const { tier } = useMemo(() => {
    return HabitProgressionService.calculateTierFromStreak(habit.currentStreak);
  }, [habit.currentStreak]);

  const theme = tierThemes[tier.name];
  const totalTasks = habit.tasks?.length || 0;
  const today = getTodayString();
  const todayTasks = habit.dailyTasks?.[today];
  const isWeekly = habit.frequency === 'weekly';

  // Pour les habitudes hebdomadaires, compte TOUTES les taches completees CETTE SEMAINE calendaire
  const completedTasks = useMemo(() => {
    if (!isWeekly) {
      return todayTasks?.completedTasks?.length || 0;
    }

    // Utilise la fonction centralisée pour compter les tâches complétées cette semaine calendaire
    return getWeeklyCompletedTasksCount(habit.dailyTasks, habit.createdAt);
  }, [habit, isWeekly, todayTasks]);

  // Utilise les fonctions centralisées pour les semaines calendaires (lundi-dimanche)
  const weekCompleted = isWeekly ? isWeeklyHabitCompletedThisWeek(habit.dailyTasks, habit.createdAt) : false;
  const nextReset = isWeekly ? getNextMondayReset() : null;

  // Calcul du temps jusqu'au reset pour les weekly
  const msUntilReset = nextReset ? nextReset.getTime() - new Date().getTime() : 0;
  const hoursUntilWeeklyReset = Math.ceil(msUntilReset / (1000 * 60 * 60));
  const daysUntilReset = Math.ceil(msUntilReset / (1000 * 60 * 60 * 24));
  // Affiche en heures si moins de 24h
  const showHoursForWeekly = hoursUntilWeeklyReset <= 24 && hoursUntilWeeklyReset > 0;

  const hoursUntilReset = !isWeekly ? getHoursUntilMidnight() : 0;

  // Compte des taches en pause
  const pausedTaskCount = Object.keys(pausedTasks).filter((taskId) => habit.tasks.some((t) => (typeof t === 'string' ? t : t.id) === taskId)).length;

  const activeTasks = totalTasks - pausedTaskCount;
  const taskProgress = activeTasks > 0 ? Math.round((completedTasks / activeTasks) * 100) : 0;
  const isCompleted = isWeekly ? weekCompleted : completedToday;

  /**
   * Formate l'affichage du streak avec nombre et unite separes
   * @returns Donnees du streak (count et unit)
   */
  const getStreakData = (): { count: number; unit: string } => {
    const count = habit.currentStreak;

    switch (habit.frequency) {
      case 'daily':
        return { count, unit: t('habits.dayStreak', { count }) };
      case 'weekly':
        return { count, unit: t('habits.weekStreak', { count }) };
      case 'monthly':
        return { count, unit: t('habits.monthStreak', { count }) };
      default:
        return { count, unit: t('habits.dayStreak', { count }) };
    }
  };

  /**
   * Formate la date de création de l'habitude selon la langue
   * FR: DD/MM/YYYY, EN: MM/DD/YYYY
   * @returns Date formatée
   */
  const getCreatedDate = (): string => {
    if (!habit.createdAt) return '';
    const date = new Date(habit.createdAt);
    return formatDateByLocale(date, i18n.language);
  };

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  /**
   * Gere le press sur la carte
   * Navigue vers les details ou execute le callback personnalise
   */
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (onPress) {
      onPress();
    } else {
      navigation.navigate('HabitDetails', {
        habitId: habit.id,
        pausedTasks,
      });
    }
  };

  const streakData = getStreakData();

  // ---------------------------------------------------------------------------
  // Rendu
  // ---------------------------------------------------------------------------
  return (
    <Animated.View entering={FadeIn.delay(index * 50)}>
      <Pressable onPress={handlePress}>
        {/* Outer container with shadow and border effect */}
        <View
          style={[
            tw`rounded-2xl`,
            {
              shadowColor: isCompleted ? theme.gradient[1] : '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isCompleted ? 0.4 : 0.15,
              shadowRadius: isCompleted ? 12 : 8,
              elevation: isCompleted ? 8 : 4,
              overflow: 'visible',
            },
          ]}
        >
          <View style={tw`rounded-2xl overflow-hidden`}>
            <ImageBackground source={theme.texture} style={tw`rounded-2xl`} imageStyle={tw`rounded-2xl opacity-80`} resizeMode="cover">
              <LinearGradient colors={[theme.gradient[0] + 'e8', theme.gradient[1] + 'e0', theme.gradient[2] + 'd8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`p-5`}>
                {/* Decorative gradient overlay */}
                <View style={tw`absolute inset-0 opacity-15`}>
                  <LinearGradient colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`w-full h-full`} />
                </View>

                {/* Completed badge glow effect */}
                {isCompleted && (
                  <View
                    style={[
                      tw`absolute top-0 right-0 w-24 h-24`,
                      {
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        borderBottomLeftRadius: 100,
                      },
                    ]}
                  />
                )}

                {/* Tier gem icon - top right - always shows current tier gem */}
                <View style={{ position: 'absolute', right: 16, top: 16, zIndex: 10 }}>
                  <Image source={getGemIcon(tier.name)} style={tw`w-12 h-12`} resizeMode="contain" />
                </View>

                {/* Header */}
                <View style={tw`mb-4 pr-16`}>
                  <Text numberOfLines={1} style={tw`text-xl font-black text-white mb-1`}>
                    {getTranslatedHabitName(habit, t)}
                  </Text>
                  <View style={tw`flex-row items-center gap-2 flex-wrap`}>
                    <View style={tw`bg-white/20 rounded-lg px-2 py-0.5`}>
                      <Text style={tw`text-[10px] text-white font-bold uppercase`}>{habit.type === 'good' ? t('habits.building') : t('habits.quitting')}</Text>
                    </View>
                    {getCreatedDate() && (
                      <View style={tw`bg-white/20 rounded-lg px-2 py-0.5`}>
                        <Text style={tw`text-[10px] text-white font-bold uppercase`}>
                          {t('habits.since')} {getCreatedDate()}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Progress section with enhanced bar */}
                <View style={tw`mb-4`}>
                  <View
                    style={[
                      tw`h-3 rounded-full overflow-hidden`,
                      {
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                      },
                    ]}
                  >
                    <View
                      style={[
                        tw`h-full rounded-full`,
                        {
                          width: `${taskProgress}%`,
                          backgroundColor: isCompleted ? '#ffffff' : 'rgba(255, 255, 255, 0.9)',
                          shadowColor: '#fff',
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: isCompleted ? 0.8 : 0.3,
                          shadowRadius: 4,
                        },
                      ]}
                    />
                  </View>

                  <View style={tw`flex-row items-center justify-between mt-2`}>
                    <View style={tw`flex-row items-center gap-1.5`}>
                      {isCompleted ? (
                        <View style={tw`bg-white rounded-full p-0.5`}>
                          <CheckCircle2 size={12} color={theme.gradient[1]} strokeWidth={3} />
                        </View>
                      ) : (
                        <Circle size={14} color="rgba(255,255,255,0.7)" strokeWidth={2} />
                      )}
                      <Text style={tw`text-xs font-semibold text-white/90`}>{isWeekly ? t('habits.weeklyTasks') : t('habits.todaysTasks')}</Text>
                    </View>
                    <View style={tw`bg-white/20 rounded-lg px-2 py-0.5`}>
                      <Text style={tw`text-xs font-black text-white`}>
                        {completedTasks}/{activeTasks}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Footer stats with enhanced streak display */}
                <View style={[tw`flex-row items-center justify-between pt-2`]}>
                  {/* Left: Streak info */}
                  <View style={tw`flex-row items-center gap-3`}>
                    {/* Streak fire badge */}
                    <View
                      style={[
                        tw`w-12 h-12 rounded-2xl items-center justify-center`,
                        {
                          backgroundColor: 'rgba(255, 255, 255, 0.15)',
                          borderWidth: 1.5,
                          borderColor: 'rgba(255, 255, 255, 0.25)',
                        },
                      ]}
                    >
                      <Flame size={24} color="#FFFFFF" strokeWidth={2} fill="rgba(255, 255, 255, 0.3)" />
                    </View>
                    <View>
                      <Text style={tw`text-[10px] text-white/70 font-bold uppercase tracking-wide`}>{t('habits.streak')}</Text>
                      <View style={tw`flex-row items-baseline gap-1`}>
                        <Text style={tw`text-2xl font-black text-white`}>{streakData.count}</Text>
                        <Text style={tw`text-xs font-semibold text-white/80`}>{streakData.unit}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Right: Tier badge or milestone icon */}
                  {unlockedMilestonesCount === 0 ? (
                    <View
                      style={[
                        tw`px-3 py-1.5 rounded-xl items-center justify-center`,
                        {
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          borderWidth: 1.5,
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                      ]}
                    >
                      <Text style={tw`text-xs font-black text-white uppercase`}>Crystal</Text>
                    </View>
                  ) : (
                    <View
                      style={[
                        tw`w-12 h-12 rounded-2xl items-center justify-center`,
                        {
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          borderWidth: 1.5,
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                      ]}
                    >
                      <Image source={getTierIcon(unlockedMilestonesCount)} style={tw`w-9 h-9`} resizeMode="contain" />
                    </View>
                  )}
                </View>

                {/* Paused tasks notification */}
                {pausedTaskCount > 0 && (
                  <View style={[tw`mt-3 pt-3 flex-row items-center gap-2`, { borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.15)' }]}>
                    <View style={tw`w-2 h-2 rounded-full bg-amber-400`} />
                    <Text style={tw`text-xs text-white/70 font-medium`}>{t('habits.tasksPaused', { count: pausedTaskCount })}</Text>
                  </View>
                )}
              </LinearGradient>
            </ImageBackground>
          </View>

          {/* Reset time badge - absolute centered at bottom border */}
          {((isWeekly && (weekCompleted || hoursUntilWeeklyReset > 0)) || (!isWeekly && !completedToday && hoursUntilReset > 0)) && (
            <View
              style={{
                position: 'absolute',
                bottom: -10,
                left: '50%',
                transform: [{ translateX: -50 }],
                zIndex: 50,
              }}
            >
              <View
                style={[
                  tw`px-3 py-1 rounded-full`,
                  {
                    backgroundColor: '#FFFFFF',
                    borderWidth: 2,
                    borderColor: tier.color,
                  },
                ]}
              >
                <Text style={[tw`text-[9px] font-bold`, { color: tier.color }]}>
                  {isWeekly
                    ? weekCompleted
                      ? t('habits.resetsIn', {
                          count: showHoursForWeekly ? hoursUntilWeeklyReset : daysUntilReset,
                          unit: showHoursForWeekly ? t('habits.unitHour') : t('habits.unitDay'),
                        })
                      : showHoursForWeekly
                      ? t('habits.hoursLeft', { count: hoursUntilWeeklyReset })
                      : t('habits.daysLeft', { count: daysUntilReset })
                    : t('habits.resetsIn', {
                        count: hoursUntilReset,
                        unit: t('habits.unitHour'),
                      })}
                </Text>
              </View>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};
