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
import { getTodayString, getLocalDateString, getHoursUntilMidnight } from '@/utils/dateHelpers';

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
 * Retourne le lundi de la semaine contenant la date donnée
 * @param date - Date de référence
 * @returns Date du lundi à 00:00:00
 */
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  // Convertit dimanche (0) en 7 pour un calcul basé sur lundi
  const dayFromMonday = day === 0 ? 7 : day;
  d.setDate(d.getDate() - (dayFromMonday - 1));
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Calcule la prochaine reinitialisation hebdomadaire
 * Basée sur les semaines calendaires (lundi à dimanche)
 * Reset = prochain lundi à 00:01
 * @param habit - Habitude (non utilisé mais gardé pour la signature)
 * @returns Date de prochaine reinitialisation (prochain lundi)
 */
const getNextWeeklyReset = (habit: Habit): Date => {
  const today = new Date();
  const currentWeekStart = getWeekStart(today);

  // Prochain lundi = lundi actuel + 7 jours
  const nextMonday = new Date(currentWeekStart);
  nextMonday.setDate(currentWeekStart.getDate() + 7);
  nextMonday.setHours(0, 1, 0, 0); // 00:01 du lundi

  return nextMonday;
};

/**
 * Verifie si toutes les taches sont completees cette semaine pour une habitude hebdomadaire
 * Utilise les semaines calendaires (lundi à dimanche)
 * @param habit - Habitude
 * @returns True si la semaine est completee
 */
const isWeekCompleted = (habit: Habit): boolean => {
  if (habit.frequency !== 'weekly') return false;

  const today = new Date();
  const weekStart = getWeekStart(today);
  const createdAt = new Date(habit.createdAt);
  createdAt.setHours(0, 0, 0, 0);

  // Vérifie chaque jour de la semaine calendaire (lundi à dimanche)
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(weekStart);
    checkDate.setDate(weekStart.getDate() + i);

    // Ignore les jours avant la création de l'habitude
    if (checkDate.getTime() < createdAt.getTime()) {
      continue;
    }

    const dateStr = getLocalDateString(checkDate);
    const dayData = habit.dailyTasks?.[dateStr];

    if (dayData?.allCompleted) {
      return true;
    }
  }

  return false;
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

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  completedToday,
  onPress,
  index,
  pausedTasks = {},
}) => {
  // ---------------------------------------------------------------------------
  // Hooks
  // ---------------------------------------------------------------------------
  const { t } = useTranslation();
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

    const now = new Date();
    const weekStart = getWeekStart(now);
    const createdAt = new Date(habit.createdAt);
    createdAt.setHours(0, 0, 0, 0);

    const weekTasksCompleted = new Set<string>();

    // Parcourt la semaine calendaire (lundi à dimanche)
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(weekStart);
      checkDate.setDate(weekStart.getDate() + i);

      // Ignore les jours avant la création de l'habitude
      if (checkDate.getTime() < createdAt.getTime()) {
        continue;
      }

      const dateStr = getLocalDateString(checkDate);
      const dayData = habit.dailyTasks?.[dateStr];

      if (dayData?.completedTasks) {
        dayData.completedTasks.forEach((taskId: string) =>
          weekTasksCompleted.add(taskId)
        );
      }
    }

    return weekTasksCompleted.size;
  }, [habit, isWeekly, todayTasks]);

  const weekCompleted = isWeekly ? isWeekCompleted(habit) : false;
  const nextReset = isWeekly ? getNextWeeklyReset(habit) : null;

  // Calcul du temps jusqu'au reset pour les weekly
  const msUntilReset = nextReset ? nextReset.getTime() - new Date().getTime() : 0;
  const hoursUntilWeeklyReset = Math.ceil(msUntilReset / (1000 * 60 * 60));
  const daysUntilReset = Math.ceil(msUntilReset / (1000 * 60 * 60 * 24));
  // Affiche en heures si moins de 24h
  const showHoursForWeekly = hoursUntilWeeklyReset <= 24 && hoursUntilWeeklyReset > 0;

  const hoursUntilReset = !isWeekly ? getHoursUntilMidnight() : 0;

  // Compte des taches en pause
  const pausedTaskCount = Object.keys(pausedTasks).filter((taskId) =>
    habit.tasks.some((t) => (typeof t === 'string' ? t : t.id) === taskId)
  ).length;

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
        <ImageBackground
          source={theme.texture}
          style={tw`rounded-2xl overflow-hidden`}
          imageStyle={tw`rounded-2xl opacity-70`}
          resizeMode="cover"
        >
          <LinearGradient
            colors={[
              theme.gradient[0] + 'e6',
              theme.gradient[1] + 'dd',
              theme.gradient[2] + 'cc',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={tw`p-4`}
          >
            {/* Icone de gemme */}
            <View style={tw`absolute top-3 right-3 z-10`}>
              <Image
                source={getGemIcon(tier.name)}
                style={tw`w-12 h-12`}
                resizeMode="contain"
              />
            </View>

            {/* En-tete */}
            <View style={tw`mb-3 pr-14`}>
              <Text numberOfLines={1} style={tw`text-xl font-bold text-white mb-0.5`}>
                {getTranslatedHabitName(habit, t)}
              </Text>
              <View style={tw`flex-row items-center gap-2`}>
                <Text style={tw`text-xs text-white/70 font-medium capitalize`}>
                  {habit.type === 'good' ? t('habits.building') : t('habits.quitting')}
                </Text>
                {isWeekly && (
                  <>
                    <View style={tw`w-1 h-1 rounded-full bg-white/50`} />
                    <Text style={tw`text-xs text-white/70 font-medium`}>
                      {weekCompleted
                        ? t('habits.resetsIn', {
                            count: showHoursForWeekly ? hoursUntilWeeklyReset : daysUntilReset,
                            unit: showHoursForWeekly ? t('habits.unitHour') : t('habits.unitDay'),
                          })
                        : showHoursForWeekly
                          ? t('habits.hoursLeft', { count: hoursUntilWeeklyReset })
                          : t('habits.daysLeft', { count: daysUntilReset })}
                    </Text>
                  </>
                )}
                {!isWeekly && !completedToday && hoursUntilReset > 0 && (
                  <>
                    <View style={tw`w-1 h-1 rounded-full bg-white/50`} />
                    <Text style={tw`text-xs text-white/70 font-medium`}>
                      {t('habits.resetsIn', {
                        count: hoursUntilReset,
                        unit: t('habits.unitHour'),
                      })}
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* Section progression */}
            <View style={tw`mb-3`}>
              <View style={tw`h-2.5 bg-white/20 rounded-full overflow-hidden mb-2`}>
                <View
                  style={[tw`h-full bg-white rounded-full`, { width: `${taskProgress}%` }]}
                />
              </View>

              <View style={tw`flex-row items-center justify-between`}>
                <View style={tw`flex-row items-center gap-1.5`}>
                  {isCompleted ? (
                    <CheckCircle2
                      size={14}
                      color="#fff"
                      strokeWidth={2.5}
                      fill="rgba(255,255,255,0.3)"
                    />
                  ) : (
                    <Circle size={14} color="#fff" strokeWidth={2} />
                  )}
                  <Text style={tw`text-xs font-semibold text-white/90`}>
                    {isWeekly ? t('habits.weeklyTasks') : t('habits.todaysTasks')}
                  </Text>
                </View>
                <Text style={tw`text-xs font-bold text-white`}>
                  {completedTasks}/{activeTasks}
                </Text>
              </View>
            </View>

            {/* Footer statistiques */}
            <View style={tw`flex-row items-center justify-between pt-3 border-t border-white/20`}>
              <View>
                <Text style={tw`text-xs text-white/70 font-medium mb-1`}>
                  {t('habits.streak')}
                </Text>
                <View style={tw`flex-row items-center gap-1.5`}>
                  <Flame
                    size={22}
                    color="#FFFFFF"
                    strokeWidth={2}
                    fill="rgba(255, 255, 255, 0.2)"
                  />
                  <View style={tw`flex-row items-baseline gap-1`}>
                    <Text style={tw`text-2xl font-black text-white`}>
                      {streakData.count}
                    </Text>
                    <Text style={tw`text-sm font-semibold text-white/80`}>
                      {streakData.unit}
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={[
                  tw`px-3 py-1.5 rounded-xl border border-white/30`,
                  { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
                ]}
              >
                <Text style={tw`text-xs font-black text-white`}>{tier.name}</Text>
              </View>
            </View>

            {/* Notification taches en pause */}
            {pausedTaskCount > 0 && (
              <View style={tw`mt-3 pt-3 border-t border-white/20`}>
                <Text style={tw`text-xs text-white/70`}>
                  {t('habits.tasksPaused', { count: pausedTaskCount })}
                </Text>
              </View>
            )}
          </LinearGradient>
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );
};
