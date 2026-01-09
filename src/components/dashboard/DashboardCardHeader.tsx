/**
 * DashboardCardHeader.tsx
 *
 * Header compact pour les cartes d'habitudes sur le Dashboard.
 * Affiche le nom de l'habitude, puis sur une ligne: Streak, Milestone, Gem, Chevron
 */

import React, { useEffect } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { ChevronRight, Flame } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import tw from '@/lib/tailwind';
import { HabitTier } from '@/services/habitProgressionService';
import { getTierIcon } from '@/utils/tierIcons';

// Couleurs dorées pour les milestones non réclamés
const MILESTONE_COLORS = {
  gradient: ['#fbbf24', '#f59e0b', '#d97706'] as const,
  border: '#f59e0b',
};

interface DashboardCardHeaderProps {
  habitName: string;
  tierName: HabitTier;
  currentStreak: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  unlockedMilestonesCount: number;
  hasUnclaimedMilestone?: boolean;
  onNavigate: () => void;
}

/**
 * Retourne l'icone de gemme selon le tier
 */
const getGemIcon = (tier: string) => {
  switch (tier) {
    case 'Obsidian':
      return require('../../../assets/interface/gems/obsidian-gem.png');
    case 'Topaz':
      return require('../../../assets/interface/gems/topaz-gem.png');
    case 'Jade':
      return require('../../../assets/interface/gems/jade-gem.png');
    case 'Amethyst':
      return require('../../../assets/interface/gems/amethyst-gem.png');
    case 'Ruby':
      return require('../../../assets/interface/gems/ruby-gem.png');
    case 'Crystal':
    default:
      return require('../../../assets/interface/gems/crystal-gem.png');
  }
};

/**
 * Particule animée qui monte et disparaît
 */
interface FloatingParticleProps {
  startX: number;
  startY: number;
  size: number;
  delay: number;
  duration: number;
}

const FloatingParticle: React.FC<FloatingParticleProps> = ({
  startX,
  startY,
  size,
  delay,
  duration,
}) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Animation de montée + fade in/out
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-20, { duration, easing: Easing.out(Easing.ease) }),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0, { duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        false
      )
    );
    // Reset opacity au début de chaque cycle
    const interval = setInterval(() => {
      translateY.value = 0;
      opacity.value = 0.9;
      translateY.value = withTiming(-20, { duration, easing: Easing.out(Easing.ease) });
      opacity.value = withTiming(0, { duration, easing: Easing.inOut(Easing.ease) });
    }, duration + delay);

    // Initial start
    setTimeout(() => {
      translateY.value = 0;
      opacity.value = 0.9;
      translateY.value = withTiming(-20, { duration, easing: Easing.out(Easing.ease) });
      opacity.value = withTiming(0, { duration, easing: Easing.inOut(Easing.ease) });
    }, delay);

    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: startX,
          bottom: startY,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          // Glow effect
          shadowColor: '#fff',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 3,
        },
        animatedStyle,
      ]}
    />
  );
};

/**
 * Conteneur des particules flottantes
 */
const FloatingSparkles: React.FC = () => (
  <>
    <FloatingParticle startX={4} startY={8} size={2.5} delay={0} duration={1800} />
    <FloatingParticle startX={18} startY={6} size={2} delay={600} duration={2000} />
    <FloatingParticle startX={10} startY={12} size={3} delay={1200} duration={1600} />
    <FloatingParticle startX={24} startY={10} size={2} delay={400} duration={2200} />
  </>
);

/**
 * Bouton chevron avec glow animé pour les milestones non réclamés
 */
interface AnimatedChevronButtonProps {
  onNavigate: () => void;
  hasUnclaimedMilestone: boolean;
}

const AnimatedChevronButton: React.FC<AnimatedChevronButtonProps> = ({
  onNavigate,
  hasUnclaimedMilestone,
}) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (hasUnclaimedMilestone) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      scale.value = withTiming(1, { duration: 300 });
    }
  }, [hasUnclaimedMilestone]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!hasUnclaimedMilestone) {
    return (
      <Pressable
        onPress={onNavigate}
        style={({ pressed }) => [
          tw`w-10 h-10 rounded-xl items-center justify-center`,
          {
            backgroundColor: pressed ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.15)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)',
          },
        ]}
      >
        <ChevronRight size={18} color="#fff" strokeWidth={2.5} />
      </Pressable>
    );
  }

  return (
    <Animated.View style={[tw`rounded-xl`, animatedStyle]}>
      <Pressable
        onPress={onNavigate}
        style={({ pressed }) => [
          tw`w-10 h-10 rounded-xl items-center justify-center overflow-hidden`,
          pressed && { opacity: 0.8 },
        ]}
      >
        <LinearGradient
          colors={MILESTONE_COLORS.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
          }}
        />
        <ChevronRight size={18} color="#fff" strokeWidth={2.5} style={{ zIndex: 1 }} />
      </Pressable>
    </Animated.View>
  );
};

export const DashboardCardHeader: React.FC<DashboardCardHeaderProps> = ({
  habitName,
  tierName,
  currentStreak,
  unlockedMilestonesCount,
  hasUnclaimedMilestone = false,
  onNavigate,
}) => {
  return (
    <View style={tw`mb-3`}>
      {/* Row 1: Badges container + Chevron - En haut */}
      <View style={tw`flex-row items-center justify-between mb-2`}>
        {/* Badges: Streak | Milestone | Gem */}
        <View
          style={[
            tw`flex-row items-center py-2 px-3 rounded-xl`,
            {
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
          ]}
        >
          {/* Streak Badge */}
          <View style={tw`flex-row items-center`}>
            <View
              style={[
                tw`w-7 h-7 rounded-lg items-center justify-center mr-1.5`,
                { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
              ]}
            >
              <Flame size={16} color="#FFFFFF" strokeWidth={2} fill="rgba(255, 255, 255, 0.4)" />
            </View>
            <Text style={tw`text-lg font-black text-white`}>{currentStreak}</Text>
          </View>

          {/* Separator */}
          <View style={[tw`w-px h-6 mx-3`, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]} />

          {/* Milestone Icon - avec effet doré si unclaimed */}
          <View
            style={[
              tw`w-8 h-8 rounded-lg items-center justify-center overflow-hidden`,
              {
                borderWidth: hasUnclaimedMilestone ? 1.5 : 0,
                borderColor: MILESTONE_COLORS.border,
                // Léger glow autour
                shadowColor: hasUnclaimedMilestone ? MILESTONE_COLORS.border : 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: hasUnclaimedMilestone ? 0.6 : 0,
                shadowRadius: 4,
              },
            ]}
          >
            {/* Fond gradient doré si milestone non réclamé */}
            {hasUnclaimedMilestone ? (
              <LinearGradient
                colors={MILESTONE_COLORS.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                }}
              />
            ) : (
              <View
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                }}
              />
            )}

            {/* Particules blanches flottantes */}
            {hasUnclaimedMilestone && <FloatingSparkles />}

            {/* Icône du milestone */}
            {unlockedMilestonesCount > 0 ? (
              <Image
                source={getTierIcon(unlockedMilestonesCount)}
                style={[tw`w-6 h-6`, { zIndex: 1 }]}
                resizeMode="contain"
              />
            ) : (
              <Text style={tw`text-white/50 text-xs font-bold`}>-</Text>
            )}
          </View>

          {/* Separator */}
          <View style={[tw`w-px h-6 mx-3`, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]} />

          {/* Tier Gem */}
          <View
            style={[
              tw`w-8 h-8 rounded-lg items-center justify-center`,
              { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
            ]}
          >
            <Image source={getGemIcon(tierName)} style={tw`w-6 h-6`} resizeMode="contain" />
          </View>
        </View>

        {/* Navigate Button - avec glow animé si milestone non réclamé */}
        <AnimatedChevronButton
          onNavigate={onNavigate}
          hasUnclaimedMilestone={hasUnclaimedMilestone}
        />
      </View>

      {/* Row 2: Habit Name */}
      <Text numberOfLines={1} style={tw`text-lg font-black text-white`}>
        {habitName}
      </Text>
    </View>
  );
};

export default DashboardCardHeader;
