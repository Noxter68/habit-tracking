/**
 * FeedbackContext.tsx
 *
 * Contexte global pour gérer l'affichage de la modal de feedback.
 * Vérifie au lancement de l'app si le feedback n'a pas été donné
 * et affiche la modal après un délai.
 * Peut aussi être déclenché manuellement depuis Settings.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useStats } from '@/context/StatsContext';
import { useHabits } from '@/context/HabitContext';
import Logger from '@/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

interface FeedbackContextType {
  showFeedbackModal: boolean;
  isDebug: boolean;
  openFeedback: () => void;
  openFeedbackDebug: () => void;
  closeFeedback: () => void;
  onFeedbackSent: (xpAwarded: number) => void;
  hasGivenFeedback: boolean;
}

const FeedbackContext = createContext<FeedbackContextType>({
  showFeedbackModal: false,
  isDebug: false,
  openFeedback: () => {},
  openFeedbackDebug: () => {},
  closeFeedback: () => {},
  onFeedbackSent: () => {},
  hasGivenFeedback: false,
});

export const useFeedback = () => useContext(FeedbackContext);

// ============================================================================
// PROVIDER
// ============================================================================

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { stats, refreshStats } = useStats();
  const { habits } = useHabits();

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isDebug, setIsDebug] = useState(false);
  const [hasGivenFeedback, setHasGivenFeedback] = useState(true); // default true to avoid flash
  const [hasInteracted, setHasInteracted] = useState(true); // true if user closed or submitted → blocks auto-show
  const hasCheckedRef = useRef(false);
  const hasTriggeredRef = useRef(false);
  const prevHabitsCountRef = useRef<number | null>(null);

  // ==========================================================================
  // Check feedback status on mount / user change
  // ==========================================================================

  const checkFeedbackStatus = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('feedback')
        .eq('id', user.id)
        .single();

      if (error) {
        Logger.error('[FeedbackContext] Error checking feedback:', error);
        return;
      }

      if (!data?.feedback) {
        // No feedback at all
        setHasGivenFeedback(false);
        setHasInteracted(false);
        return;
      }

      // User has interacted with the modal → don't auto-show again
      setHasInteracted(true);

      // Check if it's a real feedback or just closed_by_user
      try {
        const parsed = JSON.parse(data.feedback);
        // closed_by_user = not real feedback, Settings can still offer it
        setHasGivenFeedback(parsed.status !== 'closed_by_user');
      } catch {
        setHasGivenFeedback(true);
      }
    } catch (err) {
      Logger.error('[FeedbackContext] Error:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    checkFeedbackStatus();
  }, [checkFeedbackStatus]);

  // ==========================================================================
  // Auto-show: on app launch if user has habits but hasn't given feedback
  // ==========================================================================

  useEffect(() => {
    if (hasCheckedRef.current || hasTriggeredRef.current || !user?.id || hasInteracted) return;
    if (habits.length === 0) return; // no habits yet, wait

    hasCheckedRef.current = true;
    hasTriggeredRef.current = true;

    // User has habits and hasn't given feedback → show after delay
    const timer = setTimeout(() => {
      setShowFeedbackModal(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, [user?.id, habits.length, hasInteracted]);

  // ==========================================================================
  // Auto-show: detect first habit creation (0 → 1+)
  // ==========================================================================

  useEffect(() => {
    const currentCount = habits.length;
    const prevCount = prevHabitsCountRef.current;
    prevHabitsCountRef.current = currentCount;

    // Skip if already triggered by the other effect
    if (hasTriggeredRef.current) return;

    if (prevCount !== null && prevCount === 0 && currentCount >= 1 && user?.id && !hasInteracted) {
      hasTriggeredRef.current = true;
      const timer = setTimeout(() => {
        setShowFeedbackModal(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [habits.length, user?.id, hasInteracted]);

  // ==========================================================================
  // Public methods
  // ==========================================================================

  const openFeedback = useCallback(() => {
    setIsDebug(false);
    setShowFeedbackModal(true);
  }, []);

  const openFeedbackDebug = useCallback(() => {
    setIsDebug(true);
    setShowFeedbackModal(true);
  }, []);

  const pendingRefreshRef = useRef(false);

  const closeFeedback = useCallback(() => {
    setShowFeedbackModal(false);
    setIsDebug(false);
    setHasInteracted(true);
    // Refresh stats after modal is closed so level up detection happens
    // when the feedback modal is no longer blocking the celebration modal
    if (pendingRefreshRef.current) {
      pendingRefreshRef.current = false;
      setTimeout(() => refreshStats(true), 300);
    }
  }, [refreshStats]);

  const onFeedbackSent = useCallback((xpAwarded: number) => {
    setHasGivenFeedback(true);
    pendingRefreshRef.current = true;
  }, []);

  return (
    <FeedbackContext.Provider
      value={{
        showFeedbackModal,
        isDebug,
        openFeedback,
        openFeedbackDebug,
        closeFeedback,
        onFeedbackSent,
        hasGivenFeedback,
      }}
    >
      {children}
    </FeedbackContext.Provider>
  );
};
