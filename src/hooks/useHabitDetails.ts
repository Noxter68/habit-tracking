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
  const [performanceMetrics, setPerformanceMetrics] = useState<UseHabitDetailsResult['performanceMetrics']>(null);
  const [loading, setLoading] = useState(true);

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

      // Fetch async data in parallel
      const [progression, metrics] = await Promise.all([HabitProgressionService.getOrCreateProgression(habitId, userId), HabitProgressionService.getPerformanceMetrics(habitId, userId)]);

      // Update milestones - basé sur l'ancienneté de l'habitude (jours depuis création)
      if (progression) {
        const unlockedData = currentTierLevel !== undefined && currentTierLevel > 0
          ? currentTierLevel
          : progression.milestones_unlocked || [];

        // Calculer l'ancienneté de l'habitude
        let habitAge = 1; // Par défaut, 1 jour
        if (createdAt) {
          const created = new Date(createdAt);
          const today = new Date();
          created.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);
          habitAge = Math.floor((today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        }

        const status = await HabitProgressionService.getMilestoneStatus(habitAge, unlockedData);
        setMilestoneStatus(status);
      }

      // Update performance metrics with real data from backend
      if (metrics) {
        const currentStreakValue = currentStreakRef.current;
        setPerformanceMetrics((prev) => ({
          ...metrics,
          currentStreak: currentStreakValue, // Always use real-time value from ref
          bestStreak: Math.max(metrics.bestStreak || 0, currentStreakValue),
          // Preserve existing values if new ones are 0 or null (optimistic update)
          totalXPEarned: metrics.totalXPEarned || prev?.totalXPEarned || 0,
          consistency: metrics.consistency !== undefined ? metrics.consistency : (prev?.consistency || 0),
        }));
      }
    } catch (err) {
      Logger.error('useHabitDetails error', err);
      // Keep the initial values set in useEffect above
    } finally {
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
    performanceMetrics,
    refreshProgression: () => fetchData(true), // Silent refresh
    loading,
  };
}
