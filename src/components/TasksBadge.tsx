// src/components/dashboard/TaskBadge.tsx
import React, { useMemo } from 'react';
import { View, Text, ImageBackground, Image } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import tw from '@/lib/tailwind';

interface TaskBadgeProps {
  completed: number;
  total: number;
}

interface ThemeConfig {
  title: string;
  subtitle: string;
  gemImage: any;
  texture: any;
  gradient: string[];
  textColor: string;
  message: string;
}

export const TaskBadge: React.FC<TaskBadgeProps> = ({ completed, total }) => {
  // Calcul du taux de complétion
  const completionRate = useMemo(() => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [completed, total]);

  // Thème dynamique basé sur le pourcentage (6 paliers)
  const theme = useMemo((): ThemeConfig => {
    // 100% - Obsidian (Mythique)
    if (completionRate === 100) {
      return {
        title: 'Legendary!',
        subtitle: 'Perfect mastery achieved!',
        gemImage: require('../../assets/interface/gems/obsidian-gem.png'),
        texture: require('../../assets/interface/progressBar/obsidian-texture.png'),
        gradient: ['#1a1625', '#2d1b3d', '#4c1d95'],
        textColor: '#FFFFFF',
        message: "Incredible! You've completed everything today!",
      };
    }

    // 80-99% - Topaz (Or)
    if (completionRate >= 80) {
      return {
        title: 'Almost Perfect!',
        subtitle: 'Golden progress shining through!',
        gemImage: require('../../assets/interface/gems/topaz-gem.png'),
        texture: require('../../assets/interface/progressBar/topaz-texture.png'),
        gradient: ['#fbbf24', '#f59e0b', '#d97706'],
        textColor: '#FFFFFF',
        message: `Just ${total - completed} more ${total - completed === 1 ? 'task' : 'tasks'}! You've got this!`,
      };
    }

    // 60-79% - Jade (Vert)
    if (completionRate >= 60) {
      return {
        title: 'Great Momentum!',
        subtitle: 'Growing stronger every task!',
        gemImage: require('../../assets/interface/gems/jade-gem.png'),
        texture: require('../../assets/interface/progressBar/jade-texture.png'),
        gradient: ['#10b981', '#059669', '#047857'],
        textColor: '#FFFFFF',
        message: "You're on fire! Keep that energy flowing!",
      };
    }

    // 40-59% - Amethyst (Violet)
    if (completionRate >= 40) {
      return {
        title: 'Halfway There!',
        subtitle: 'Building your path to success!',
        gemImage: require('../../assets/interface/gems/amethyst-gem.png'),
        texture: require('../../assets/interface/progressBar/amethyst-texture.png'),
        gradient: ['#8b5cf6', '#7c3aed', '#6d28d9'],
        textColor: '#FFFFFF',
        message: "Amazing progress! You're crushing it today!",
      };
    }

    // 20-39% - Ruby (Rouge)
    if (completionRate >= 20) {
      return {
        title: 'Getting Started!',
        subtitle: 'Every step brings you closer!',
        gemImage: require('../../assets/interface/gems/ruby-gem.png'),
        texture: require('../../assets/interface/progressBar/ruby-texture.png'),
        gradient: ['#ef4444', '#dc2626', '#b91c1c'],
        textColor: '#FFFFFF',
        message: 'Great start! Keep the momentum building!',
      };
    }

    // 0-19% - Crystal (Bleu)
    return {
      title: 'Ready to Shine!',
      subtitle: 'Your journey begins now!',
      gemImage: require('../../assets/interface/gems/crystal-gem.png'),
      texture: require('../../assets/interface/progressBar/crystal.png'),
      gradient: ['#60a5fa', '#3b82f6', '#2563eb'],
      textColor: '#FFFFFF',
      message: "Let's make today incredible! 🌟",
    };
  }, [completionRate, total, completed]);

  return (
    <Animated.View entering={FadeIn.duration(600)} style={tw`mb-5`}>
      <View
        style={[
          tw`rounded-3xl overflow-hidden`,
          {
            shadowColor: theme.gradient[1],
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
          },
        ]}
      >
        {/* Background avec texture uniquement */}
        <ImageBackground source={theme.texture} style={tw`w-full`} imageStyle={{ opacity: 1 }} resizeMode="cover">
          <View style={[tw`px-5 py-2`, { backgroundColor: `${theme.gradient[1]}80` }]}>
            {/* Header avec Gemme */}
            <View style={tw`flex-row items-center justify-between mb-2`}>
              {/* Textes à gauche */}
              <View style={tw`flex-1 mr-4`}>
                <Text
                  style={[
                    tw`text-2xl font-black mb-1`,
                    {
                      color: theme.textColor,
                      textShadowColor: 'rgba(0, 0, 0, 0.3)',
                      textShadowOffset: { width: 0, height: 2 },
                      textShadowRadius: 4,
                    },
                  ]}
                >
                  {theme.title}
                </Text>
                <Text
                  style={[
                    tw`text-sm font-semibold`,
                    {
                      color: theme.textColor,
                      opacity: 0.9,
                      textShadowColor: 'rgba(0, 0, 0, 0.2)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    },
                  ]}
                >
                  {theme.subtitle}
                </Text>
              </View>

              {/* Gemme à droite */}
              <Image
                source={theme.gemImage}
                style={{
                  width: 80,
                  height: 80,
                  transform: [{ rotate: '-15deg' }],
                }}
                resizeMode="contain"
              />
            </View>

            {/* Stats Counter - Inline & Clean */}
            <View style={tw`flex-row items-center justify-between`}>
              {/* Task count */}
              <View style={tw`flex-row items-baseline gap-1.5`}>
                <Text
                  style={[
                    tw`text-3xl font-black`,
                    {
                      color: theme.textColor,
                      textShadowColor: 'rgba(0, 0, 0, 0.2)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 3,
                    },
                  ]}
                >
                  {completed}
                </Text>
                <Text
                  style={[
                    tw`text-lg font-semibold`,
                    {
                      color: theme.textColor,
                      opacity: 0.7,
                    },
                  ]}
                >
                  / {total}
                </Text>
              </View>

              {/* Percentage - No background */}
              <Text
                style={[
                  tw`text-2xl font-black`,
                  {
                    color: theme.textColor,
                    textShadowColor: 'rgba(0, 0, 0, 0.2)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 3,
                  },
                ]}
              >
                {completionRate}%
              </Text>
            </View>
          </View>
        </ImageBackground>
      </View>
    </Animated.View>
  );
};

export default TaskBadge;
