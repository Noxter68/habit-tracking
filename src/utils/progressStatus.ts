// src/utils/progressStatus.ts
import { Trophy, Flame, TrendingUp, Target, Rocket } from 'lucide-react-native';
import i18n from '../i18n'; // Assurez-vous d'importer votre instance i18n

export interface ProgressStatus {
  title: string;
  emoji: string;
  subtitle: string;
  icon: any;
  colors: string[];
  lightColors: string[];
  iconColor: string;
  message: string;
  bgGradient: string[];
}

export const getProgressStatus = (completionRate: number, habitsCompleted: number, totalHabits: number): ProgressStatus => {
  if (completionRate === 100) {
    return {
      title: i18n.t('dashboard.progressStatus.perfectDay.title'),
      emoji: '🎯',
      subtitle: i18n.t('dashboard.progressStatus.perfectDay.subtitle'),
      icon: Trophy,
      colors: ['#10b981', '#059669'],
      lightColors: ['#dcfce7', '#bbf7d0'],
      iconColor: '#059669',
      message: i18n.t('dashboard.progressStatus.perfectDay.message'),
      bgGradient: ['#065f46', '#047857'],
    };
  } else if (completionRate >= 80) {
    return {
      title: i18n.t('dashboard.progressStatus.almostThere.title'),
      emoji: '💪',
      subtitle: i18n.t('dashboard.progressStatus.almostThere.subtitle', { completed: habitsCompleted, total: totalHabits }),
      icon: Flame,
      colors: ['#8b5cf6', '#7c3aed'],
      lightColors: ['#ede9fe', '#ddd6fe'],
      iconColor: '#7c3aed',
      message: i18n.t('dashboard.progressStatus.almostThere.message'),
      bgGradient: ['#6d28d9', '#5b21b6'],
    };
  } else if (completionRate >= 50) {
    return {
      title: i18n.t('dashboard.progressStatus.goodProgress.title'),
      emoji: '📈',
      subtitle: i18n.t('dashboard.progressStatus.goodProgress.subtitle', { completed: habitsCompleted, total: totalHabits }),
      icon: TrendingUp,
      colors: ['#6366f1', '#4f46e5'],
      lightColors: ['#e0e7ff', '#c7d2fe'],
      iconColor: '#4f46e5',
      message: i18n.t('dashboard.progressStatus.goodProgress.message'),
      bgGradient: ['#4338ca', '#3730a3'],
    };
  } else if (completionRate > 0) {
    return {
      title: i18n.t('dashboard.progressStatus.gettingStarted.title'),
      emoji: '🌱',
      subtitle: i18n.t('dashboard.progressStatus.gettingStarted.subtitle', { completed: habitsCompleted, total: totalHabits }),
      icon: Target,
      colors: ['#f59e0b', '#d97706'],
      lightColors: ['#fef3c7', '#fde68a'],
      iconColor: '#d97706',
      message: i18n.t('dashboard.progressStatus.gettingStarted.message'),
      bgGradient: ['#d97706', '#b45309'],
    };
  } else {
    return {
      title: i18n.t('dashboard.progressStatus.readyToBegin.title'),
      emoji: '🚀',
      subtitle: i18n.t('dashboard.progressStatus.readyToBegin.subtitle'),
      icon: Rocket,
      colors: ['#94a3b8', '#64748b'],
      lightColors: ['#f1f5f9', '#e2e8f0'],
      iconColor: '#64748b',
      message: i18n.t('dashboard.progressStatus.readyToBegin.message'),
      bgGradient: ['#64748b', '#475569'],
    };
  }
};

export const calculateCompletionRate = (habitsCompleted: number, totalHabits: number): number => {
  return totalHabits > 0 ? Math.round((habitsCompleted / totalHabits) * 100) : 0;
};

export const getGreeting = (): string => {
  const currentHour = new Date().getHours();
  if (currentHour < 12) return i18n.t('dashboard.greeting.morning');
  if (currentHour < 18) return i18n.t('dashboard.greeting.afternoon');
  return i18n.t('dashboard.greeting.evening');
};
