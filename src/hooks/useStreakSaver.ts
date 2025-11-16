// src/hooks/useStreakSaver.ts
// Hook unifié pour gérer les Streak Savers (Personal Habits + Group Habits)

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { StreakSaverService } from '../services/StreakSaverService';
import Logger from '@/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

type StreakSaverType = 'personal' | 'group';

interface BaseStreakSaverProps {
  userId: string;
  enabled?: boolean;
  onStreakRestored?: (newStreak?: number) => void;
}

interface PersonalStreakSaverProps extends BaseStreakSaverProps {
  type: 'personal';
  habitId: string;
}

interface GroupStreakSaverProps extends BaseStreakSaverProps {
  type: 'group';
  groupHabitId: string;
  groupId: string;
}

type UseStreakSaverProps = PersonalStreakSaverProps | GroupStreakSaverProps;

interface StreakEligibility {
  canSave: boolean;
  reason?: string;
  habitName?: string;
  previousStreak?: number;
  missedDate?: string;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useStreakSaver = (props: UseStreakSaverProps) => {
  const { userId, enabled = true, onStreakRestored, type } = props;

  const [eligibility, setEligibility] = useState<StreakEligibility>({ canSave: false });
  const [inventory, setInventory] = useState({ available: 0, totalUsed: 0 });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [using, setUsing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [newStreak, setNewStreak] = useState(0);

  // Extraire les IDs selon le type
  const habitId = type === 'personal' ? props.habitId : '';
  const groupHabitId = type === 'group' ? props.groupHabitId : '';
  const groupId = type === 'group' ? props.groupId : '';

  useEffect(() => {
    if (enabled && userId) {
      if (type === 'personal' && habitId) {
        Logger.debug('🔍 [PERSONAL] Checking streak saver eligibility for habit:', habitId);
        checkEligibility();
        loadInventory();
      } else if (type === 'group' && groupHabitId) {
        Logger.debug('🔍 [GROUP] Checking streak saver eligibility for group habit:', groupHabitId);
        checkEligibility();
        loadInventory();
      }
    }
  }, [habitId, groupHabitId, userId, enabled, type]);

  const checkPersonalEligibility = useCallback(async () => {
    try {
      setLoading(true);
      const [result, inv] = await Promise.all([StreakSaverService.checkEligibility(habitId, userId), StreakSaverService.getInventory(userId)]);

      Logger.debug('✅ [PERSONAL] Eligibility check result:', result);
      Logger.debug('💰 Inventory:', inv);

      setEligibility(result);
      setInventory(inv);

      if (result.canSave && inv.available > 0) {
        Logger.debug('🎯 [PERSONAL] Auto-showing streak saver modal');
        setShowModal(true);
      }
    } catch (error) {
      Logger.error('❌ [PERSONAL] Error checking eligibility:', error);
    } finally {
      setLoading(false);
    }
  }, [habitId, userId]);

  // ==========================================================================
  // ELIGIBILITY - GROUP HABITS
  // ==========================================================================

  const checkGroupEligibility = useCallback(async () => {
    try {
      setLoading(true);

      // Calculer la date d'hier
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Chercher le daily summary d'hier pour cet habit
      const { data: summary, error: summaryError } = await supabase
        .from('group_daily_summaries')
        .select('bonus_type, date, group_habit_id')
        .eq('group_habit_id', groupHabitId)
        .eq('date', yesterdayStr)
        .maybeSingle();

      if (summaryError) throw summaryError;

      // Récupérer les infos de l'habit
      const { data: habit, error: habitError } = await supabase.from('group_habits').select('name, current_streak').eq('id', groupHabitId).single();

      if (habitError) throw habitError;

      // Charger l'inventaire
      const inv = await loadInventoryData();

      // Déterminer l'éligibilité
      if (!summary) {
        // Pas de summary = pas encore validé par le cron
        Logger.debug('⏳ [GROUP] No summary yet for yesterday, waiting for midnight validation');
        setEligibility({ canSave: false, reason: 'Validation en cours (minuit)' });
        setInventory(inv);
        return;
      }

      if (summary.bonus_type === 'none') {
        // Streak cassée ! On peut sauver
        Logger.debug('💔 [GROUP] Streak broken! Eligible for streak saver');
        const eligibilityData: StreakEligibility = {
          canSave: true,
          habitName: habit?.name || 'Habit de groupe',
          previousStreak: habit?.current_streak || 0,
          missedDate: yesterdayStr,
        };

        setEligibility(eligibilityData);
        setInventory(inv);

        // Auto-show modal si l'utilisateur a des savers
        if (inv.available > 0) {
          Logger.debug('🎯 [GROUP] Auto-showing streak saver modal');
          setShowModal(true);
        }
      } else {
        // Streak OK (full ou reduced)
        Logger.debug('✅ [GROUP] Streak is safe, no need for saver');
        setEligibility({ canSave: false, reason: 'Streak non cassée' });
        setInventory(inv);
      }
    } catch (error) {
      Logger.error('❌ [GROUP] Error checking eligibility:', error);
      setEligibility({ canSave: false, reason: 'Erreur lors de la vérification' });
    } finally {
      setLoading(false);
    }
  }, [groupHabitId, userId]);

  // ==========================================================================
  // ELIGIBILITY - DISPATCHER (nom original conservé)
  // ==========================================================================

  const checkEligibility = useCallback(async () => {
    if (!enabled || !userId) return;

    if (type === 'personal') {
      await checkPersonalEligibility();
    } else if (type === 'group') {
      await checkGroupEligibility();
    }
  }, [type, enabled, userId, checkPersonalEligibility, checkGroupEligibility]);

  // ==========================================================================
  // INVENTORY (nom original conservé)
  // ==========================================================================

  const loadInventoryData = async () => {
    const { data, error } = await supabase.from('profiles').select('streak_savers, total_streak_savers_used').eq('id', userId).single();

    if (error) throw error;

    return {
      available: data?.streak_savers || 0,
      totalUsed: data?.total_streak_savers_used || 0,
    };
  };

  const loadInventory = useCallback(async () => {
    if (!userId) return;

    try {
      const inv = await loadInventoryData();
      Logger.debug(`📊 [${type.toUpperCase()}] Loaded inventory:`, inv);
      setInventory(inv);
    } catch (error) {
      Logger.error('Error loading inventory:', error);
    }
  }, [userId, type]);

  // ==========================================================================
  // USE STREAK SAVER - PERSONAL HABITS (logique originale conservée)
  // ==========================================================================

  const usePersonalStreakSaver = useCallback(async () => {
    try {
      setUsing(true);
      Logger.debug('🔄 [PERSONAL] Using streak saver for habit:', habitId);
      const result = await StreakSaverService.useStreakSaver(habitId, userId);

      if (result.success && result.newStreak) {
        Logger.debug('✅ [PERSONAL] Streak restored to:', result.newStreak);

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
        Logger.error('❌ [PERSONAL] Failed to use streak saver:', result.message);
      }
    } catch (error: any) {
      Logger.error('❌ [PERSONAL] Error using streak saver:', error);
    } finally {
      setUsing(false);
    }
  }, [habitId, userId, onStreakRestored]);

  // ==========================================================================
  // USE STREAK SAVER - GROUP HABITS
  // ==========================================================================

  const useGroupStreakSaver = useCallback(async () => {
    if (inventory.available < 1) {
      Logger.debug('❌ [GROUP] No streak savers available');
      return;
    }

    try {
      setUsing(true);
      Logger.debug('🔄 [GROUP] Using streak saver for habit:', groupHabitId);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // 1. Déduire le streak saver de l'utilisateur
      const { error: profileError } = await supabase.rpc('decrement_streak_saver', {
        p_user_id: userId,
      });

      if (profileError) throw profileError;

      // 2. Marquer le daily summary comme "sauvé" + changer bonus_type
      // Le cron a mis bonus_type='none' (0 XP), on le change en 'reduced' (35 XP)
      const { error: summaryError } = await supabase
        .from('group_daily_summaries')
        .update({
          is_streak_saved: true,
          bonus_type: 'reduced', // Passe de 'none' → 'reduced'
        })
        .eq('group_habit_id', groupHabitId)
        .eq('date', yesterdayStr);

      if (summaryError) throw summaryError;

      // 3. Ajouter rétroactivement 35 XP au groupe
      // Le cron avait donné 0 XP car bonus_type='none'
      // Maintenant qu'on sauve avec 'reduced', on ajoute les 35 XP manquants
      const { error: xpError } = await supabase.from('group_xp_transactions').insert({
        group_id: groupId,
        amount: 35,
        reason: 'daily_bonus_reduced',
        metadata: {
          habit_id: groupHabitId,
          date: yesterdayStr,
          streak_saved: true,
        },
      });

      if (xpError) throw xpError;

      // Mettre à jour le total XP du groupe
      await supabase.rpc('increment_group_xp', {
        p_group_id: groupId,
        p_amount: 35,
      });

      // 4. Restaurer la streak de l'habit
      const restoredStreak = (eligibility.previousStreak || 0) + 1;
      const { error: habitError } = await supabase
        .from('group_habits')
        .update({
          current_streak: restoredStreak,
        })
        .eq('id', groupHabitId);

      if (habitError) throw habitError;

      Logger.debug('✅ [GROUP] Streak saved! New streak:', restoredStreak);

      // Update local state
      setInventory((prev) => ({
        available: prev.available - 1,
        totalUsed: prev.totalUsed + 1,
      }));

      setNewStreak(restoredStreak);
      setSuccess(true);

      // Notify parent
      setTimeout(() => {
        if (onStreakRestored) {
          onStreakRestored();
        }
      }, 3000);

      setEligibility({ canSave: false });
    } catch (error: any) {
      Logger.error('❌ [GROUP] Error using streak saver:', error);
    } finally {
      setUsing(false);
    }
  }, [groupHabitId, groupId, userId, inventory, eligibility, onStreakRestored]);

  // ==========================================================================
  // USE STREAK SAVER - DISPATCHER (nom original conservé)
  // ==========================================================================

  const useStreakSaver = useCallback(async () => {
    if (!eligibility.canSave) {
      Logger.debug(`❌ [${type.toUpperCase()}] Cannot use streak saver - not eligible`);
      return;
    }

    if (type === 'personal') {
      await usePersonalStreakSaver();
    } else if (type === 'group') {
      await useGroupStreakSaver();
    }
  }, [type, eligibility, usePersonalStreakSaver, useGroupStreakSaver]);

  // ==========================================================================
  // MODAL CONTROLS (noms originaux conservés)
  // ==========================================================================

  const closeModal = useCallback(() => {
    Logger.debug(`👋 [${type.toUpperCase()}] Closing streak saver modal`);
    setShowModal(false);
    setSuccess(false);
    setNewStreak(0);
  }, [type]);

  const openModal = useCallback(() => {
    if (eligibility.canSave && inventory.available > 0) {
      Logger.debug(`🎯 [${type.toUpperCase()}] Manually opening streak saver modal`);
      setShowModal(true);
    }
  }, [eligibility, inventory, type]);

  // ==========================================================================
  // RETURN
  // ==========================================================================

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
