// src/hooks/useStreakSaver.ts
import { useState, useEffect, useCallback } from 'react';
import { StreakSaverService } from '../services/StreakSaverService';

interface UseStreakSaverProps {
  habitId: string;
  userId: string;
  enabled?: boolean;
  onStreakRestored?: (newStreak: number) => void;
}

export const useStreakSaver = ({ habitId, userId, enabled = true, onStreakRestored }: UseStreakSaverProps) => {
  const [eligibility, setEligibility] = useState<{
    canSave: boolean;
    reason?: string;
    habitName?: string;
    previousStreak?: number;
    missedDate?: string;
  }>({ canSave: false });

  const [inventory, setInventory] = useState({ available: 0, totalUsed: 0 });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [using, setUsing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [newStreak, setNewStreak] = useState(0);

  useEffect(() => {
    if (enabled && habitId && userId) {
      console.log('🔍 Checking streak saver eligibility for habit:', habitId);
      checkEligibility();
      loadInventory();
    }
  }, [habitId, userId, enabled]);

  const checkEligibility = useCallback(async () => {
    if (!enabled || !habitId || !userId) return;

    try {
      setLoading(true);
      const [result, inv] = await Promise.all([StreakSaverService.checkEligibility(habitId, userId), StreakSaverService.getInventory(userId)]);

      console.log('✅ Eligibility check result:', result);
      console.log('💰 Inventory:', inv);

      setEligibility(result);
      setInventory(inv);

      if (result.canSave && inv.available > 0) {
        console.log('🎯 Auto-showing streak saver modal');
        setShowModal(true);
      }
    } catch (error) {
      console.error('❌ Error checking eligibility:', error);
    } finally {
      setLoading(false);
    }
  }, [habitId, userId, enabled]);

  const loadInventory = useCallback(async () => {
    if (!userId) return;

    try {
      const inv = await StreakSaverService.getInventory(userId);
      console.log('📊 Loaded inventory:', inv);
      setInventory(inv);
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  }, [userId]);

  const useStreakSaver = useCallback(async () => {
    if (!eligibility.canSave) {
      console.log('❌ Cannot use streak saver - not eligible');
      return;
    }

    try {
      setUsing(true);
      console.log('🔄 Using streak saver for habit:', habitId);
      const result = await StreakSaverService.useStreakSaver(habitId, userId);

      if (result.success && result.newStreak) {
        console.log('✅ Streak restored to:', result.newStreak);

        // Update inventory
        setInventory((prev) => ({
          available: prev.available - 1,
          totalUsed: prev.totalUsed + 1,
        }));

        // Show success state
        setNewStreak(result.newStreak);
        setSuccess(true);

        // Notify parent after success animation
        setTimeout(() => {
          if (onStreakRestored) {
            onStreakRestored(result.newStreak);
          }
        }, 3000);

        // Reset eligibility
        setEligibility({ canSave: false });
      } else {
        console.error('❌ Failed to use streak saver:', result.message);
      }
    } catch (error: any) {
      console.error('❌ Error using streak saver:', error);
    } finally {
      setUsing(false);
    }
  }, [eligibility, habitId, userId, onStreakRestored]);

  const closeModal = useCallback(() => {
    console.log('👋 Closing streak saver modal');
    setShowModal(false);
    setSuccess(false);
    setNewStreak(0);
  }, []);

  const openModal = useCallback(() => {
    if (eligibility.canSave && inventory.available > 0) {
      console.log('🎯 Manually opening streak saver modal');
      setShowModal(true);
    }
  }, [eligibility, inventory]);

  return {
    eligibility,
    inventory,
    loading,
    showModal,
    using,
    success,
    newStreak,
    checkEligibility,
    loadInventory,
    useStreakSaver,
    closeModal,
    openModal,
  };
};
