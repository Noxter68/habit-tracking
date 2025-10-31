// src/hooks/useHabitDetails.ts
import { useEffect, useState, useCallback, useMemo } from 'react';
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

export function useHabitDetails(habitId: string, userId: string, currentStreak: number, completedTasksToday?: number): UseHabitDetailsResult {
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

    // Set initial performance metrics with streak data
    setPerformanceMetrics({
      avgTasksPerDay: 0,
      perfectDayRate: 0,
      currentTier: immediateTierInfo.tier,
      tierProgress: immediateTierInfo.progress,
      consistency: 0,
      totalXPEarned: 0,
      currentStreak: currentStreak,
      bestStreak: currentStreak,
    });
  }, [currentStreak, immediateTierInfo]);

  // ============================================================================
  // FETCH DETAILED DATA FROM BACKEND
  // ============================================================================

  const fetchData = useCallback(async () => {
    if (!habitId || !userId) return;

    try {
      // Don't show loading on subsequent fetches (prevents flash)
      if (!performanceMetrics) {
        setLoading(true);
      }

      // Fetch async data in parallel
      const [progression, metrics] = await Promise.all([HabitProgressionService.getOrCreateProgression(habitId, userId), HabitProgressionService.getPerformanceMetrics(habitId, userId)]);

      // Update milestones
      if (progression) {
        const status = await HabitProgressionService.getMilestoneStatus(currentStreak, progression.milestones_unlocked || []);
        setMilestoneStatus(status);
      }

      // Update performance metrics with real data from backend
      if (metrics) {
        setPerformanceMetrics({
          ...metrics,
          currentStreak: currentStreak, // Always use real-time value
          bestStreak: Math.max(metrics.bestStreak || 0, currentStreak),
        });
      }
    } catch (err) {
      Logger.error('useHabitDetails error', err);
      // Keep the initial values set in useEffect above
    } finally {
      setLoading(false);
    }
  }, [habitId, userId, currentStreak, performanceMetrics]);

  // ============================================================================
  // FETCH ON MOUNT AND WHEN DEPENDENCIES CHANGE
  // ============================================================================

  useEffect(() => {
    fetchData();
  }, [habitId, userId, currentStreak, completedTasksToday]);

  return {
    tierInfo,
    tierProgress,
    nextTier,
    milestoneStatus,
    performanceMetrics,
    refreshProgression: fetchData,
    loading,
  };
}
