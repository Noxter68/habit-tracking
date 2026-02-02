/**
 * FeedbackModal.tsx
 *
 * Modal de feedback affichée après la création de la première habitude
 * ou depuis les Settings.
 * Design violet gamifié avec texture amethyste.
 * 2 states : formulaire de feedback → écran de remerciement.
 *
 * XP reward basé sur le niveau :
 * Level 1-5: 100 XP, 5-10: 200 XP, 10-15: 300 XP, ... up to 40: 800 XP
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  Image,
  ImageBackground,
  Animated as RNAnimated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { ThumbsUp, Smile, Meh, ChevronRight, Crown } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { supabase } from '@/lib/supabase';
import { XPService } from '@/services/xpService';
import Logger from '@/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

type FeedbackRating = 'great' | 'good' | 'could_be_better';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  onFeedbackSent: (xpAwarded: number) => void;
  userLevel?: number;
  isDebug?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Calcule le montant d'XP en fonction du niveau de l'utilisateur.
 * Level 1-5: 100, 6-10: 200, 11-15: 300, ..., 36-40: 800
 */
const getXPRewardForLevel = (level: number): number => {
  const tier = Math.min(Math.floor((level - 1) / 5), 7);
  return (tier + 1) * 100;
};

// ============================================================================
// CONSTANTS
// ============================================================================

const RATINGS: {
  key: FeedbackRating;
  icon: React.FC<{ size: number; color: string; strokeWidth: number }>;
  accentColor: string;
}[] = [
  { key: 'great', icon: ThumbsUp, accentColor: '#34d399' },
  { key: 'good', icon: Smile, accentColor: '#60a5fa' },
  { key: 'could_be_better', icon: Meh, accentColor: '#fbbf24' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  onClose,
  userId,
  onFeedbackSent,
  userLevel = 1,
  isDebug = false,
}) => {
  const { t } = useTranslation();

  const xpReward = useMemo(() => getXPRewardForLevel(userLevel), [userLevel]);

  // State
  const [selectedRating, setSelectedRating] = useState<FeedbackRating | null>(null);
  const [suggestion, setSuggestion] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  // Animations (60fps with native driver)
  const scaleAnim = useRef(new RNAnimated.Value(0.85)).current;
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  const backdropAnim = useRef(new RNAnimated.Value(0)).current;
  const thankYouFade = useRef(new RNAnimated.Value(0)).current;

  // ==========================================================================
  // ANIMATIONS
  // ==========================================================================

  useEffect(() => {
    if (visible) {
      RNAnimated.parallel([
        RNAnimated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 9,
          useNativeDriver: true,
        }),
        RNAnimated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        RNAnimated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      fadeAnim.setValue(0);
      backdropAnim.setValue(0);
      thankYouFade.setValue(0);
      setSelectedRating(null);
      setSuggestion('');
      setIsSending(false);
      setShowThankYou(false);
    }
  }, [visible]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const animateOut = useCallback(
    (callback: () => void) => {
      RNAnimated.parallel([
        RNAnimated.timing(scaleAnim, {
          toValue: 0.85,
          duration: 200,
          useNativeDriver: true,
        }),
        RNAnimated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        RNAnimated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(callback);
    },
    [scaleAnim, fadeAnim, backdropAnim]
  );

  const handleClose = useCallback(() => {
    if (isDebug) {
      animateOut(() => onClose());
      return;
    }

    (async () => {
      try {
        const closedData = JSON.stringify({
          status: 'closed_by_user',
          closed_at: new Date().toISOString(),
        });
        await supabase.from('profiles').update({ feedback: closedData }).eq('id', userId);
      } catch (error) {
        Logger.error('[FeedbackModal] Error saving closed status:', error);
      }
    })();

    animateOut(() => onClose());
  }, [isDebug, userId, animateOut, onClose]);

  const handleDismissThankYou = useCallback(() => {
    animateOut(() => onClose());
  }, [animateOut, onClose]);

  const handleSelectRating = (rating: FeedbackRating) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRating(rating);
  };

  const handleSubmit = useCallback(async () => {
    if (!selectedRating || isSending) return;

    Keyboard.dismiss();
    setIsSending(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      if (!isDebug) {
        const feedbackData = JSON.stringify({
          rating: selectedRating,
          suggestion: suggestion.trim() || null,
          submitted_at: new Date().toISOString(),
        });

        const { error } = await supabase
          .from('profiles')
          .update({ feedback: feedbackData })
          .eq('id', userId);

        if (error) throw error;

        await XPService.awardXP(userId, {
          amount: xpReward,
          source_type: 'achievement_unlock',
          description: `Feedback XP reward (+${xpReward} XP)`,
        });
      }

      onFeedbackSent(xpReward);

      // Show thank you state
      setShowThankYou(true);
      RNAnimated.timing(thankYouFade, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      Logger.error('[FeedbackModal] Error submitting feedback:', error);
      setIsSending(false);
    }
  }, [selectedRating, suggestion, userId, isSending, isDebug, xpReward, onFeedbackSent, thankYouFade]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (!visible) return null;

  const textShadow = {
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  };

  // ==========================================================================
  // THANK YOU STATE
  // ==========================================================================

  const renderThankYou = () => (
    <RNAnimated.View style={{ opacity: thankYouFade }}>
      {/* Potion icon */}
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            backgroundColor: 'rgba(255,255,255,0.15)',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.2)',
          }}
        >
          <Image
            source={require('../../../assets/achievement-quests/achievement-boost-xp.png')}
            style={{ width: 48, height: 48 }}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Title */}
      <Text
        style={[
          tw`text-white text-2xl font-black text-center mb-3`,
          { letterSpacing: -0.5, ...textShadow },
        ]}
      >
        {t('feedback.thankYouTitle')}
      </Text>

      {/* XP Badge */}
      <View
        style={{
          alignSelf: 'center',
          backgroundColor: 'rgba(255,255,255,0.18)',
          borderRadius: 12,
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.25)',
          marginBottom: 16,
        }}
      >
        <Text style={[tw`text-white font-black text-base text-center`, textShadow]}>
          +{xpReward} XP
        </Text>
      </View>

      {/* Explanation */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: 14,
          padding: 14,
          gap: 12,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.15)',
          marginBottom: 24,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: 'rgba(255,255,255,0.15)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Crown size={18} color="#fff" strokeWidth={2.5} />
        </View>
        <Text
          style={[
            tw`text-white/90 text-sm font-semibold flex-1`,
            { lineHeight: 20, ...textShadow },
          ]}
        >
          {t('feedback.boostLocation')}
        </Text>
      </View>

      {/* Close button */}
      <Pressable
        onPress={handleDismissThankYou}
        style={{
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderRadius: 16,
          paddingVertical: 16,
          alignItems: 'center',
        }}
      >
        <Text style={{ fontWeight: '900', fontSize: 16, color: '#6D28D9', letterSpacing: -0.3 }}>
          {t('common.done')}
        </Text>
      </Pressable>
    </RNAnimated.View>
  );

  // ==========================================================================
  // FEEDBACK FORM STATE
  // ==========================================================================

  const renderForm = () => (
    <>
      {/* Title Section */}
      <Text
        style={[
          tw`text-white text-2xl font-black text-center`,
          { letterSpacing: -0.5, ...textShadow },
        ]}
      >
        {t('feedback.title')}
      </Text>
      <Text
        style={[
          tw`text-white/60 text-sm font-semibold text-center mt-2 mb-8`,
          textShadow,
        ]}
      >
        {t('feedback.subtitle')}
      </Text>

      {/* Rating Options - Vertical stacked */}
      <View style={{ gap: 10, marginBottom: 20 }}>
        {RATINGS.map((item) => {
          const isSelected = selectedRating === item.key;
          const IconComponent = item.icon;
          return (
            <Pressable
              key={item.key}
              onPress={() => handleSelectRating(item.key)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: 16,
                backgroundColor: isSelected ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)',
                borderWidth: 1.5,
                borderColor: isSelected ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.18)',
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: isSelected
                    ? 'rgba(255,255,255,0.22)'
                    : 'rgba(255,255,255,0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}
              >
                <IconComponent
                  size={20}
                  color="#fff"
                  strokeWidth={2.5}
                />
              </View>

              <Text
                style={[
                  tw`font-bold flex-1`,
                  {
                    fontSize: 15,
                    color: isSelected ? '#fff' : 'rgba(255,255,255,0.8)',
                    ...textShadow,
                  },
                ]}
              >
                {t(`feedback.ratings.${item.key}`)}
              </Text>

              {isSelected && <ChevronRight size={16} color="#fff" strokeWidth={2.5} />}
            </Pressable>
          );
        })}
      </View>

      {/* Suggestion Input */}
      <TextInput
        style={{
          borderRadius: 14,
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 14,
          color: '#fff',
          fontSize: 14,
          fontWeight: '500',
          backgroundColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.15)',
          minHeight: 90,
          maxHeight: 140,
          textAlignVertical: 'top',
          marginBottom: 20,
        }}
        placeholder={t('feedback.suggestionPlaceholder')}
        placeholderTextColor="rgba(255,255,255,0.35)"
        value={suggestion}
        onChangeText={setSuggestion}
        multiline
        maxLength={500}
        returnKeyType="done"
        blurOnSubmit
      />

      {/* XP Bonus Badge with potion icon */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 12,
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.18)',
          alignSelf: 'center',
          marginBottom: 20,
        }}
      >
        <Image
          source={require('../../../assets/achievement-quests/achievement-boost-xp.png')}
          style={{ width: 22, height: 22 }}
          resizeMode="contain"
        />
        <Text style={[tw`text-white/90 text-xs font-bold`, textShadow]}>
          +{xpReward} XP {t('feedback.bonusHint')}
        </Text>
      </View>

      {/* Submit Button - White */}
      <Pressable
        onPress={handleSubmit}
        disabled={!selectedRating || isSending}
        style={{
          borderRadius: 16,
          paddingVertical: 16,
          alignItems: 'center',
          backgroundColor: selectedRating ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.15)',
        }}
      >
        <Text
          style={{
            fontWeight: '900',
            fontSize: 16,
            color: selectedRating ? '#6D28D9' : 'rgba(255,255,255,0.3)',
            letterSpacing: -0.3,
          }}
        >
          {isSending ? t('common.loading') : t('feedback.submit')}
        </Text>
      </Pressable>

      {/* Skip link */}
      <Pressable onPress={handleClose} style={{ marginTop: 16, alignItems: 'center' }}>
        <Text style={[tw`text-white/35 text-xs font-semibold`, textShadow]}>
          {t('feedback.skipForNow')}
        </Text>
      </Pressable>

      <Text style={[tw`text-white/25 text-center mt-2`, { fontSize: 11, lineHeight: 15 }]}>
        {t('feedback.skipHint')}
      </Text>
    </>
  );

  // ==========================================================================
  // MAIN RENDER
  // ==========================================================================

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      {/* Backdrop - Noir opaque */}
      <RNAnimated.View
        style={[
          tw`absolute inset-0 bg-black`,
          {
            opacity: backdropAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.88],
            }),
          },
        ]}
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`flex-1 justify-center px-5`}
      >
        <RNAnimated.View
          style={{
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim,
          }}
        >
          {/* Card with purple gradient + texture */}
          <View
            style={{
              borderRadius: 24,
              shadowColor: '#7C3AED',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.35,
              shadowRadius: 20,
              elevation: 20,
            }}
          >
            <View style={{ borderRadius: 24, overflow: 'hidden' }}>
              {/* Gradient border */}
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED', '#6D28D9'] as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 2, borderRadius: 24 }}
              >
                <View style={{ borderRadius: 22, overflow: 'hidden' }}>
                  <ImageBackground
                    source={require('../../../assets/interface/textures/texture-white.png')}
                    style={{ overflow: 'hidden' }}
                    imageStyle={{ opacity: 0.85 }}
                    resizeMode="repeat"
                  >
                    <LinearGradient
                      colors={['#8B5CF6D8', '#7C3AEDD8', '#6D28D9CC'] as any}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 28 }}
                    >
                      {showThankYou ? renderThankYou() : renderForm()}
                    </LinearGradient>
                  </ImageBackground>
                </View>
              </LinearGradient>
            </View>
          </View>
        </RNAnimated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
