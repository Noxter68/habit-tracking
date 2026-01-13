/**
 * QuestNotificationContext.tsx
 *
 * Global context to show quest completion notifications throughout the app
 * Shows one toast at a time with a queue system
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { QuestCompletionToast } from '@/components/quests/QuestCompletionToast';

interface QuestReward {
  kind: 'XP' | 'BOOST' | 'TITLE';
  amount?: number;
  boost?: {
    percent: number;
    durationHours: number;
  };
  title?: {
    key: string;
  };
}

interface QuestNotification {
  id: string;
  questName: string;
  reward: QuestReward;
}

interface QuestNotificationContextType {
  showQuestCompletion: (questName: string, reward: QuestReward) => void;
}

const QuestNotificationContext = createContext<QuestNotificationContextType | undefined>(
  undefined
);

const TOAST_DISPLAY_DURATION = 5000; // 5 seconds visible
const TOAST_HIDE_ANIMATION_DURATION = 300; // Duration of hide animation
const TOAST_DELAY_BEFORE_NEXT = 150; // Small delay before showing next toast

export const QuestNotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentNotification, setCurrentNotification] = useState<QuestNotification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const queueRef = useRef<Array<{ questName: string; reward: QuestReward }>>([]);
  const isProcessingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const processQueue = useCallback(() => {
    if (isProcessingRef.current || queueRef.current.length === 0 || currentNotification) {
      return;
    }

    isProcessingRef.current = true;
    const next = queueRef.current.shift();

    if (next) {
      const id = `quest-${Date.now()}-${Math.random()}`;
      const newNotification: QuestNotification = {
        id,
        questName: next.questName,
        reward: next.reward,
      };

      setCurrentNotification(newNotification);
      setIsVisible(true);

      // Auto-hide after display duration
      timerRef.current = setTimeout(() => {
        setIsVisible(false);

        // Wait for hide animation to complete before showing next
        setTimeout(() => {
          setCurrentNotification(null);
          isProcessingRef.current = false;
          processQueue();
        }, TOAST_HIDE_ANIMATION_DURATION + TOAST_DELAY_BEFORE_NEXT);
      }, TOAST_DISPLAY_DURATION);
    } else {
      isProcessingRef.current = false;
    }
  }, [currentNotification]);

  useEffect(() => {
    if (!currentNotification && queueRef.current.length > 0) {
      processQueue();
    }
  }, [currentNotification, processQueue]);

  const showQuestCompletion = useCallback((questName: string, reward: QuestReward) => {
    queueRef.current.push({ questName, reward });
    if (!currentNotification && !isProcessingRef.current) {
      processQueue();
    }
  }, [currentNotification, processQueue]);

  const handleManualHide = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setIsVisible(false);

    setTimeout(() => {
      setCurrentNotification(null);
      isProcessingRef.current = false;
      processQueue();
    }, TOAST_HIDE_ANIMATION_DURATION + TOAST_DELAY_BEFORE_NEXT);
  }, [processQueue]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <QuestNotificationContext.Provider value={{ showQuestCompletion }}>
      {children}
      {currentNotification && (
        <QuestCompletionToast
          visible={isVisible}
          questName={currentNotification.questName}
          reward={currentNotification.reward}
          onHide={handleManualHide}
        />
      )}
    </QuestNotificationContext.Provider>
  );
};

export const useQuestNotification = (): QuestNotificationContextType => {
  const context = useContext(QuestNotificationContext);
  if (context === undefined) {
    throw new Error(
      'useQuestNotification must be used within a QuestNotificationProvider'
    );
  }
  return context;
};
