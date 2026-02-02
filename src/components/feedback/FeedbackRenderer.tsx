/**
 * FeedbackRenderer.tsx
 *
 * Composant global qui affiche la modal de feedback depuis le FeedbackContext.
 * Placé une seule fois dans App.tsx (dans AppNavigator).
 */

import React from 'react';
import { FeedbackModal } from '@/components/feedback/FeedbackModal';
import { useFeedback } from '@/context/FeedbackContext';
import { useAuth } from '@/context/AuthContext';
import { useStats } from '@/context/StatsContext';

export const FeedbackRenderer: React.FC = () => {
  const { showFeedbackModal, isDebug, closeFeedback, onFeedbackSent } = useFeedback();
  const { user } = useAuth();
  const { stats } = useStats();

  if (!showFeedbackModal || !user?.id) return null;

  return (
    <FeedbackModal
      visible={showFeedbackModal}
      onClose={closeFeedback}
      userId={user.id}
      onFeedbackSent={onFeedbackSent}
      userLevel={stats?.level ?? 1}
      isDebug={isDebug}
    />
  );
};
