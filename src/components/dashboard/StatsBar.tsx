/**
 * StatsBar.tsx
 *
 * Fixed stats bar at the top of the dashboard displaying:
 * - Level
 * - Streak
 * - Streak Savers
 * - XP Boost indicator (when active)
 */

import React from 'react';
import { View, Text, Image, ImageBackground, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame } from 'lucide-react-native';

import { useSubscription } from '@/context/SubscriptionContext';
import { useInventory } from '@/context/InventoryContext';

// Amethyst theme colors
const AMETHYST_GRADIENT: [string, string, string] = ['#8b5cf6', '#7c3aed', '#6d28d9'];
const AMETHYST_SHADOW = '#5b21b6';

interface StatsBarProps {
  userLevel: number;
  totalStreak: number;
}

const StatsBar: React.FC<StatsBarProps> = ({ userLevel, totalStreak }) => {
  const { streakSavers } = useSubscription();
  const { activeBoost } = useInventory();

  // Check if boost is valid
  const hasActiveBoost = activeBoost && new Date(activeBoost.expires_at) > new Date();

  return (
    <View style={styles.container}>
      {/* Shadow layer for depth effect */}
      <View style={styles.shadowLayer} />

      {/* Main bar with gradient and texture */}
      <View style={styles.barContainer}>
        <ImageBackground
          source={require('../../../assets/interface/progressBar/amethyst-texture.png')}
          style={styles.textureBackground}
          imageStyle={styles.textureImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={[AMETHYST_GRADIENT[0] + 'cc', AMETHYST_GRADIENT[1] + 'cc', AMETHYST_GRADIENT[2] + 'cc']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            <View style={styles.content}>
              {/* Level */}
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>LVL</Text>
                <Text style={styles.statValue}>{userLevel}</Text>
              </View>

              {/* Streak */}
              <View style={styles.statItem}>
                <Flame
                  size={20}
                  color="#FFFFFF"
                  strokeWidth={2.5}
                  fill="rgba(255, 255, 255, 0.4)"
                />
                <Text style={styles.statValue}>{totalStreak}</Text>
              </View>

              {/* Streak Savers */}
              <View style={styles.statItem}>
                <Image
                  source={require('../../../assets/interface/streak-saver.png')}
                  style={styles.streakSaverIcon}
                  resizeMode="contain"
                />
                <Text style={styles.statValue}>{streakSavers}</Text>
              </View>

              {/* Boost indicator */}
              {hasActiveBoost && (
                <View style={styles.boostBadge}>
                  <Image
                    source={require('../../../assets/achievement-quests/achievement-boost-xp.png')}
                    style={styles.boostIcon}
                    resizeMode="contain"
                  />
                </View>
              )}
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  shadowLayer: {
    position: 'absolute',
    top: 3,
    left: 0,
    right: 0,
    bottom: -3,
    backgroundColor: AMETHYST_SHADOW,
    borderRadius: 16,
  },
  barContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  textureBackground: {
    width: '100%',
  },
  textureImage: {
    opacity: 0.85,
  },
  gradient: {
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  streakSaverIcon: {
    width: 22,
    height: 22,
  },
  boostBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 6,
  },
  boostIcon: {
    width: 20,
    height: 20,
  },
});

export default React.memo(StatsBar);
