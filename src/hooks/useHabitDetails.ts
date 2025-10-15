import { useEffect, useState, useCallback } from 'react';
import { HabitProgressionService, TierInfo, HabitMilestone } from '@/services/habitProgressionService';

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

  const fetchData = useCallback(async () => {
    if (!habitId || !userId) return;

    try {
      setLoading(true);

      // 1. Tier from streak
      const { tier, progress } = HabitProgressionService.calculateTierFromStreak(currentStreak);
      setTierInfo(tier);
      setTierProgress(progress);
      setNextTier(HabitProgressionService.getNextTier(tier));

      // 2. Milestones from DB
      const progression = await HabitProgressionService.getOrCreateProgression(habitId, userId);
      if (progression) {
        const status = await HabitProgressionService.getMilestoneStatus(currentStreak, progression.milestones_unlocked || []);
        setMilestoneStatus(status);
      }

      // 3. Performance metrics
      const metrics = await HabitProgressionService.getPerformanceMetrics(habitId, userId);

      if (metrics) {
        // ✅ Always use real-time currentStreak from props
        setPerformanceMetrics({
          ...metrics,
          currentStreak: currentStreak, // Override with real-time value
          bestStreak: Math.max(metrics.bestStreak || 0, currentStreak), // Take the maximum
        });
      } else {
        // ✅ If metrics are null, create a basic object with streak info
        setPerformanceMetrics({
          avgTasksPerDay: 0,
          perfectDayRate: 0,
          currentTier: tier,
          tierProgress: progress,
          consistency: 0,
          totalXPEarned: 0,
          currentStreak: currentStreak,
          bestStreak: currentStreak,
        });
      }
    } catch (err) {
      console.error('useHabitDetails error', err);

      // ✅ Set fallback metrics on error
      const { tier, progress } = HabitProgressionService.calculateTierFromStreak(currentStreak);
      setPerformanceMetrics({
        avgTasksPerDay: 0,
        perfectDayRate: 0,
        currentTier: tier,
        tierProgress: progress,
        consistency: 0,
        totalXPEarned: 0,
        currentStreak: currentStreak,
        bestStreak: currentStreak,
      });
    } finally {
      setLoading(false);
    }
  }, [habitId, userId, currentStreak]);

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
