// src/utils/progressStatus.ts
import { Trophy, Flame, TrendingUp, Target, Rocket } from 'lucide-react-native';

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
      title: 'Perfect Day!',
      emoji: '🎯',
      subtitle: 'All habits completed',
      icon: Trophy,
      colors: ['#10b981', '#059669'],
      lightColors: ['#dcfce7', '#bbf7d0'],
      iconColor: '#059669',
      message: 'Outstanding work! Keep this momentum going!',
      bgGradient: ['#065f46', '#047857'],
    };
  } else if (completionRate >= 80) {
    return {
      title: 'Almost There!',
      emoji: '💪',
      subtitle: `${habitsCompleted} of ${totalHabits} done`,
      icon: Flame,
      colors: ['#8b5cf6', '#7c3aed'],
      lightColors: ['#ede9fe', '#ddd6fe'],
      iconColor: '#7c3aed',
      message: 'Great progress! Just a little more to go!',
      bgGradient: ['#6d28d9', '#5b21b6'],
    };
  } else if (completionRate >= 50) {
    return {
      title: 'Good Progress',
      emoji: '📈',
      subtitle: `${habitsCompleted} of ${totalHabits} done`,
      icon: TrendingUp,
      colors: ['#6366f1', '#4f46e5'],
      lightColors: ['#e0e7ff', '#c7d2fe'],
      iconColor: '#4f46e5',
      message: "You're halfway there! Keep pushing!",
      bgGradient: ['#4338ca', '#3730a3'],
    };
  } else if (completionRate > 0) {
    return {
      title: 'Getting Started',
      emoji: '🌱',
      subtitle: `${habitsCompleted} of ${totalHabits} done`,
      icon: Target,
      colors: ['#f59e0b', '#d97706'],
      lightColors: ['#fef3c7', '#fde68a'],
      iconColor: '#d97706',
      message: 'Every step counts! Keep going!',
      bgGradient: ['#d97706', '#b45309'],
    };
  } else {
    return {
      title: 'Ready to Begin?',
      emoji: '🚀',
      subtitle: 'Start with your first habit',
      icon: Rocket,
      colors: ['#94a3b8', '#64748b'],
      lightColors: ['#f1f5f9', '#e2e8f0'],
      iconColor: '#64748b',
      message: 'Today is a great day to start!',
      bgGradient: ['#64748b', '#475569'],
    };
  }
};

export const calculateCompletionRate = (habitsCompleted: number, totalHabits: number): number => {
  return totalHabits > 0 ? Math.round((habitsCompleted / totalHabits) * 100) : 0;
};

export const getGreeting = (): string => {
  const currentHour = new Date().getHours();
  if (currentHour < 12) return 'Good morning';
  if (currentHour < 18) return 'Good afternoon';
  return 'Good evening';
};
