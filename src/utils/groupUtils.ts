// utils/groupUtils.ts
// Utilitaires pour les groupes d'habitudes

import type { ReactionEmoji, UserProfile } from '@/types/group.types';

// ============================================
// AVATAR UTILS
// ============================================

export const AVATAR_COLORS = [
  '#A78BFA', // Purple
  '#FB7185', // Pink
  '#34D399', // Green
  '#60A5FA', // Blue
  '#FBBF24', // Yellow
  '#F472B6', // Rose
] as const;

/**
 * Génère une couleur d'avatar basée sur le hash du username
 */
export function generateAvatarColor(username: string): string {
  if (!username) return AVATAR_COLORS[0];

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

/**
 * Génère les initiales à partir du username
 */
export function getUserInitials(username: string | null): string {
  if (!username) return '??';

  const parts = username.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Retourne l'affichage de l'avatar (emoji si dispo, sinon initiales)
 */
export function getAvatarDisplay(profile: UserProfile | null): {
  type: 'emoji' | 'initials';
  value: string;
  color: string;
} {
  if (!profile) {
    return {
      type: 'initials',
      value: '??',
      color: AVATAR_COLORS[0],
    };
  }

  if (profile.avatar_emoji) {
    return {
      type: 'emoji',
      value: profile.avatar_emoji,
      color: profile.avatar_color || AVATAR_COLORS[0],
    };
  }

  return {
    type: 'initials',
    value: getUserInitials(profile.username),
    color: profile.avatar_color || generateAvatarColor(profile.username || ''),
  };
}

// ============================================
// INVITE CODE UTILS
// ============================================

/**
 * Formate un code d'invitation pour l'affichage (ex: ABC123 → ABC-123)
 */
export function formatInviteCode(code: string): string {
  if (code.length === 6) {
    return `${code.substring(0, 3)}-${code.substring(3)}`;
  }
  return code;
}

/**
 * Valide le format d'un code d'invitation
 */
export function isValidInviteCode(code: string): boolean {
  const cleanCode = code.replace(/[-\s]/g, '').toUpperCase();
  return /^[A-Z0-9]{6}$/.test(cleanCode);
}

/**
 * Nettoie un code d'invitation (enlève espaces, tirets, met en majuscules)
 */
export const cleanInviteCode = (code: string | undefined): string => {
  if (!code) return '';
  return code.replace(/[^A-Z0-9]/g, '').toUpperCase();
};

// ============================================
// XP & LEVEL UTILS
// ============================================

/**
 * Calcule le niveau basé sur l'XP total
 * Level 1: 0-99 XP (besoin de 100 pour Level 2)
 * Level 2: 100-299 XP (besoin de 200 pour Level 3)
 * Level 3: 300-599 XP (besoin de 300 pour Level 4)
 */
export function calculateLevel(totalXp: number): number {
  if (totalXp < 100) return 1;
  if (totalXp < 300) return 2; // 100 + 200
  if (totalXp < 600) return 3; // 100 + 200 + 300

  let level = 1;
  let xpAccumulated = 0;

  while (xpAccumulated <= totalXp) {
    const xpNeededForNextLevel = level * 100;
    xpAccumulated += xpNeededForNextLevel;
    if (xpAccumulated > totalXp) break;
    level++;
  }

  return level;
}

/**
 * Calcule l'XP total nécessaire pour atteindre un niveau donné
 * Level 1: 0, Level 2: 100, Level 3: 300 (100+200), Level 4: 600 (100+200+300)
 */
export function getTotalXpForLevel(level: number): number {
  if (level <= 1) return 0;

  let totalXp = 0;
  for (let i = 1; i < level; i++) {
    totalXp += i * 100;
  }
  return totalXp;
}

/**
 * Calcule l'XP requis pour le prochain niveau
 * Level 1 → Level 2: 100 XP
 * Level 2 → Level 3: 200 XP
 * Level 3 → Level 4: 300 XP
 */
export function getXpForNextLevel(currentLevel: number): number {
  return currentLevel * 100;
}

/**
 * Calcule l'XP dans le niveau actuel et le pourcentage de progression
 */
export function getLevelProgress(totalXp: number): number {
  const currentLevel = calculateLevel(totalXp);
  const xpForCurrentLevel = getTotalXpForLevel(currentLevel);
  const xpForNextLevel = getXpForNextLevel(currentLevel);

  const xpInCurrentLevel = totalXp - xpForCurrentLevel;

  return Math.floor((xpInCurrentLevel / xpForNextLevel) * 100);
}

/**
 * Retourne les infos complètes de progression XP
 * Exemple avec 110 XP total:
 * - currentLevel: 2
 * - xpInCurrentLevel: 10 (110 - 100)
 * - xpNeededForNextLevel: 200
 * - progressPercentage: 5% (10/200)
 */
export function getXpProgressInfo(totalXp: number): {
  currentLevel: number;
  xpInCurrentLevel: number;
  xpNeededForNextLevel: number;
  progressPercentage: number;
} {
  const currentLevel = calculateLevel(totalXp);
  const xpForCurrentLevel = getTotalXpForLevel(currentLevel);
  const xpForNextLevel = getXpForNextLevel(currentLevel);
  const xpInCurrentLevel = totalXp - xpForCurrentLevel;
  const progressPercentage = Math.floor((xpInCurrentLevel / xpForNextLevel) * 100);

  // 🔍 DEBUG
  console.log('🔍 getXpProgressInfo:', {
    totalXp,
    currentLevel,
    xpForCurrentLevel,
    calculation: `${totalXp} - ${xpForCurrentLevel} = ${xpInCurrentLevel}`,
    xpForNextLevel,
    progressPercentage,
  });

  return {
    currentLevel,
    xpInCurrentLevel,
    xpNeededForNextLevel: xpForNextLevel,
    progressPercentage,
  };
}

// ============================================
// STREAK UTILS
// ============================================

/**
 * Formate un streak pour l'affichage (ex: 18 → "18j")
 */
export function formatStreak(days: number): string {
  if (days === 0) return '0j';
  if (days === 1) return '1j';
  return `${days}j`;
}

/**
 * Retourne une couleur selon la longueur du streak
 */
export function getStreakColor(days: number): string {
  if (days === 0) return '#9CA3AF'; // Gray
  if (days < 7) return '#34D399'; // Green
  if (days < 30) return '#60A5FA'; // Blue
  if (days < 100) return '#A78BFA'; // Purple
  return '#F59E0B'; // Orange (legendary)
}

// ============================================
// REACTION UTILS
// ============================================

export const REACTION_EMOJIS: ReactionEmoji[] = ['💪', '🔥', '👍', '⭐'];

/**
 * Compte les réactions par type
 */
export function groupReactionsByEmoji(reactions: { emoji: ReactionEmoji; user_id: string }[]): Record<ReactionEmoji, number> {
  return reactions.reduce((acc, reaction) => {
    acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
    return acc;
  }, {} as Record<ReactionEmoji, number>);
}

// ============================================
// DATE UTILS
// ============================================

/**
 * Formate une date ISO en jour de la semaine court (ex: "Lu", "Ma")
 */
export function getDayName(date: string): string {
  const dayNames = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'];
  const d = new Date(date);
  return dayNames[d.getDay()];
}

/**
 * Vérifie si une date est aujourd'hui
 */
export function isToday(dateStr: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return dateStr === today;
}

/**
 * Génère un range de dates (YYYY-MM-DD)
 */
export function generateDateRange(startDate: Date, days: number): string[] {
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}

// ============================================
// TIMELINE UTILS
// ============================================

export type CompletionStatus = 'all' | 'partial' | 'none' | 'today';

/**
 * Détermine le statut d'une journée dans la timeline
 */
export function getTimelineStatus(completedCount: number, totalMembers: number, isToday: boolean): CompletionStatus {
  if (isToday) return 'today';
  if (completedCount === 0) return 'none';
  if (completedCount === totalMembers) return 'all';
  return 'partial';
}

/**
 * Retourne le symbole pour la timeline selon le statut
 */
export function getTimelineSymbol(status: CompletionStatus): string {
  switch (status) {
    case 'all':
      return '✓✓';
    case 'partial':
      return '✓○';
    case 'none':
      return '○○';
    case 'today':
      return '●●';
  }
}

// ============================================
// PREMIUM LIMITS UTILS
// ============================================

export interface GroupLimits {
  maxGroups: number;
  maxMembers: number;
  maxHabits: number | 'unlimited';
}

export function getGroupLimits(isPremium: boolean): GroupLimits {
  return {
    maxGroups: isPremium ? 5 : 1,
    maxMembers: isPremium ? 10 : 3,
    maxHabits: isPremium ? 'unlimited' : 2,
  };
}

/**
 * Vérifie si une limite est atteinte
 */
export function isLimitReached(current: number, max: number | 'unlimited'): boolean {
  if (max === 'unlimited') return false;
  return current >= max;
}

// ============================================
// VALIDATION UTILS
// ============================================

/**
 * Valide le nom d'un groupe ou d'une habitude
 */
export function validateName(name: string): {
  valid: boolean;
  error?: string;
} {
  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return {
      valid: false,
      error: 'Le nom doit contenir au moins 2 caractères',
    };
  }

  if (trimmed.length > 50) {
    return {
      valid: false,
      error: 'Le nom ne peut pas dépasser 50 caractères',
    };
  }

  return { valid: true };
}

/**
 * Valide un emoji
 */
export function isValidEmoji(emoji: string): boolean {
  // Regex simple pour détecter les emojis
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
  return emojiRegex.test(emoji) && emoji.length <= 4;
}

// ============================================
// FORMATTING UTILS
// ============================================

/**
 * Formate un nombre pour l'affichage (ex: 1000 → 1k)
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
}

/**
 * Formate un temps relatif (ex: "il y a 5 min", "il y a 2h")
 */
export function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "à l'instant";
  if (diffMins < 60) return `il y a ${diffMins} min`;
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays < 7) return `il y a ${diffDays}j`;

  return time.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}
