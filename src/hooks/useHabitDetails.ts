// src/hooks/useHabitDetails.ts
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { HabitProgressionService, TierInfo, HabitMilestone } from '@/services/habitProgressionService';
import Logger from '@/utils/logger';

interface UseHabitDetailsResult {
  tierInfo: TierInfo | null;
  tierProgress: number;
  nextTier: TierInfo | null;
  milestoneStatus: {
    unlocked: HabitMilestone[];
    next: HabitMilestone | null;
    upcoming: HabitMilestone[];
    all: HabitMilestone[];
  };
  newlyUnlockedMilestones: HabitMilestone[];
  milestoneXpAwarded: number;
  performanceMetrics: {
    avgTasksPerDay: number;
    perfectDayRate: number;
    currentTier: TierInfo;
    tierProgress: number;
    consistency: number;
    totalXPEarned: number;
    currentStreak: number;
    bestStreak: number;
  } | null;
  refreshProgression: () => Promise<void>;
  loading: boolean;
}

export function useHabitDetails(habitId: string, userId: string, currentStreak: number, currentTierLevel?: number, createdAt?: Date): UseHabitDetailsResult {
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);
  const [tierProgress, setTierProgress] = useState(0);
  const [nextTier, setNextTier] = useState<TierInfo | null>(null);
  const [milestoneStatus, setMilestoneStatus] = useState<{
    unlocked: HabitMilestone[];
    next: HabitMilestone | null;
    upcoming: HabitMilestone[];
    all: HabitMilestone[];
  }>({ unlocked: [], next: null, upcoming: [], all: [] });
  const [newlyUnlockedMilestones, setNewlyUnlockedMilestones] = useState<HabitMilestone[]>([]);
  const [milestoneXpAwarded, setMilestoneXpAwarded] = useState(0);
  const [performanceMetrics, setPerformanceMetrics] = useState<UseHabitDetailsResult['performanceMetrics']>(null);
  const [loading, setLoading] = useState(true);

  // Ref pour éviter de checker les milestones plusieurs fois
  const milestoneCheckDone = useRef(false);

  // Use ref to avoid fetchData recreating when currentStreak changes
  const currentStreakRef = useRef(currentStreak);

  useEffect(() => {
    currentStreakRef.current = currentStreak;
  }, [currentStreak]);

  // ============================================================================
  // CALCULATE TIER IMMEDIATELY (SYNCHRONOUS)
  // ============================================================================

  // This ensures tierInfo is available immediately on mount, no flash
  const immediateTierInfo = useMemo(() => {
    return HabitProgressionService.calculateTierFromStreak(currentStreak);
  }, [currentStreak]);

  // ============================================================================
  // SET INITIAL VALUES IMMEDIATELY
  // ============================================================================

  useEffect(() => {
    // Set tier info synchronously to prevent flash
    setTierInfo(immediateTierInfo.tier);
    setTierProgress(immediateTierInfo.progress);
    setNextTier(HabitProgressionService.getNextTier(immediateTierInfo.tier));

    // Update only tier-related data and streak, keep existing metrics
    setPerformanceMetrics((prev) => ({
      avgTasksPerDay: prev?.avgTasksPerDay ?? 0,
      perfectDayRate: prev?.perfectDayRate ?? 0,
      currentTier: immediateTierInfo.tier,
      tierProgress: immediateTierInfo.progress,
      consistency: prev?.consistency ?? 0,
      totalXPEarned: prev?.totalXPEarned ?? 0,
      currentStreak: currentStreak,
      bestStreak: Math.max(prev?.bestStreak ?? 0, currentStreak),
    }));
  }, [currentStreak, immediateTierInfo]);

  // ============================================================================
  // FETCH DETAILED DATA FROM BACKEND
  // ============================================================================

  const fetchData = useCallback(async (silent: boolean = false) => {
    if (!habitId || !userId) return;

    try {
      if (!silent) {
        setLoading(true);
      }

      // Calculer l'ancienneté de l'habitude une seule fois
      let habitAge = 1;
      if (createdAt) {
        const created = new Date(createdAt);
        const today = new Date();
        created.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        habitAge = Math.floor((today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      }

      // Fetch async data in parallel (progression, metrics, et milestone status)
      const [progression, metrics, milestoneStatusResult] = await Promise.all([
        HabitProgressionService.getOrCreateProgression(habitId, userId),
        HabitProgressionService.getPerformanceMetrics(habitId, userId),
        HabitProgressionService.getMilestoneStatus(
          habitAge,
          currentTierLevel !== undefined && currentTierLevel > 0 ? currentTierLevel : []
        ),
      ]);

      // Update milestone status immédiatement
      setMilestoneStatus(milestoneStatusResult);

      // Update performance metrics with real data from backend
      if (metrics) {
        const currentStreakValue = currentStreakRef.current;
        setPerformanceMetrics((prev) => ({
          ...metrics,
          currentStreak: currentStreakValue,
          bestStreak: Math.max(metrics.bestStreak || 0, currentStreakValue),
          totalXPEarned: metrics.totalXPEarned || prev?.totalXPEarned || 0,
          consistency: metrics.consistency !== undefined ? metrics.consistency : (prev?.consistency || 0),
        }));
      }

      // Terminer le loading AVANT le check des milestones (non-bloquant)
      if (!silent) {
        setLoading(false);
      }

      // Vérifier et octroyer l'XP des milestones EN ARRIÈRE-PLAN (ne bloque pas l'UI)
      if (createdAt && !milestoneCheckDone.current) {
        milestoneCheckDone.current = true;
        // Fire and forget - l'UI est déjà affichée
        HabitProgressionService.checkAndAwardMilestoneXP(habitId, userId, createdAt)
          .then(({ newlyUnlocked, totalXpAwarded }) => {
            if (newlyUnlocked.length > 0) {
              setNewlyUnlockedMilestones(newlyUnlocked);
              setMilestoneXpAwarded(totalXpAwarded);
              Logger.debug('Newly unlocked milestones:', newlyUnlocked.map((m) => m.title), 'XP:', totalXpAwarded);
            }
          })
          .catch((err) => Logger.error('checkAndAwardMilestoneXP error:', err));
      }
    } catch (err) {
      Logger.error('useHabitDetails error', err);
      if (!silent) {
        setLoading(false);
      }
    }
  }, [habitId, userId, currentTierLevel, createdAt]);

  // ============================================================================
  // FETCH ON MOUNT AND WHEN DEPENDENCIES CHANGE
  // ============================================================================

  useEffect(() => {
    fetchData();
  }, [habitId, userId, currentTierLevel]);

  return {
    tierInfo,
    tierProgress,
    nextTier,
    milestoneStatus,
    newlyUnlockedMilestones,
    milestoneXpAwarded,
    performanceMetrics,
    refreshProgression: () => fetchData(true), // Silent refresh
    loading,
  };
}
