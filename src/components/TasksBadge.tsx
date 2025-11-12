// src/components/dashboard/TaskBadge.tsx
import React, { useMemo } from 'react';
import { View, Text, ImageBackground, Image } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import tw from '@/lib/tailwind';

interface TaskBadgeProps {
  completed: number;
  total: number;
}

interface ThemeConfig {
  titleKey: string;
  subtitleKey: string;
  messageKey: string;
  gemImage: any;
  texture: any;
  gradient: string[];
  textColor: string;
}

export const TaskBadge: React.FC<TaskBadgeProps> = ({ completed, total }) => {
  const { t } = useTranslation();

  const completionRate = useMemo(() => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [completed, total]);

  const theme = useMemo((): ThemeConfig => {
    // 100% - Obsidian (Mythique)
    if (completionRate === 100) {
      return {
        titleKey: 'dashboard.taskBadge.legendary.title',
        subtitleKey: 'dashboard.taskBadge.legendary.subtitle',
        messageKey: 'dashboard.taskBadge.legendary.message',
        gemImage: require('../../assets/interface/gems/obsidian-gem.png'),
        texture: require('../../assets/interface/progressBar/obsidian-texture.png'),
        gradient: ['#1a1625', '#2d1b3d', '#4c1d95'],
        textColor: '#FFFFFF',
      };
    }

    // 80-99% - Topaz (Or)
    if (completionRate >= 80) {
      return {
        titleKey: 'dashboard.taskBadge.almostPerfect.title',
        subtitleKey: 'dashboard.taskBadge.almostPerfect.subtitle',
        messageKey: 'dashboard.taskBadge.almostPerfect.message',
        gemImage: require('../../assets/interface/gems/topaz-gem.png'),
        texture: require('../../assets/interface/progressBar/topaz-texture.png'),
        gradient: ['#fbbf24', '#f59e0b', '#d97706'],
        textColor: '#FFFFFF',
      };
    }

    // 60-79% - Jade (Vert)
    if (completionRate >= 60) {
      return {
        titleKey: 'dashboard.taskBadge.greatMomentum.title',
        subtitleKey: 'dashboard.taskBadge.greatMomentum.subtitle',
        messageKey: 'dashboard.taskBadge.greatMomentum.message',
        gemImage: require('../../assets/interface/gems/jade-gem.png'),
        texture: require('../../assets/interface/progressBar/jade-texture.png'),
        gradient: ['#10b981', '#059669', '#047857'],
        textColor: '#FFFFFF',
      };
    }

    // 40-59% - Amethyst (Violet)
    if (completionRate >= 40) {
      return {
        titleKey: 'dashboard.taskBadge.halfwayThere.title',
        subtitleKey: 'dashboard.taskBadge.halfwayThere.subtitle',
        messageKey: 'dashboard.taskBadge.halfwayThere.message',
        gemImage: require('../../assets/interface/gems/amethyst-gem.png'),
        texture: require('../../assets/interface/progressBar/amethyst-texture.png'),
        gradient: ['#8b5cf6', '#7c3aed', '#6d28d9'],
        textColor: '#FFFFFF',
      };
    }

    // 20-39% - Ruby (Rouge)
    if (completionRate >= 20) {
      return {
        titleKey: 'dashboard.taskBadge.gettingStarted.title',
        subtitleKey: 'dashboard.taskBadge.gettingStarted.subtitle',
        messageKey: 'dashboard.taskBadge.gettingStarted.message',
        gemImage: require('../../assets/interface/gems/ruby-gem.png'),
        texture: require('../../assets/interface/progressBar/ruby-texture.png'),
        gradient: ['#ef4444', '#dc2626', '#b91c1c'],
        textColor: '#FFFFFF',
      };
    }

    // 0-19% - Crystal (Bleu)
    return {
      titleKey: 'dashboard.taskBadge.readyToShine.title',
      subtitleKey: 'dashboard.taskBadge.readyToShine.subtitle',
      messageKey: 'dashboard.taskBadge.readyToShine.message',
      gemImage: require('../../assets/interface/gems/crystal-gem.png'),
      texture: require('../../assets/interface/progressBar/crystal.png'),
      gradient: ['#60a5fa', '#3b82f6', '#2563eb'],
      textColor: '#FFFFFF',
    };
  }, [completionRate, total, completed]);

  // Get the translated message with count for almostPerfect case
  const getMessage = () => {
    if (completionRate >= 80 && completionRate < 100) {
      const remaining = total - completed;
      return t(theme.messageKey, { count: remaining });
    }
    return t(theme.messageKey);
  };

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
        <ImageBackground source={theme.texture} style={tw`w-full`} imageStyle={{ opacity: 1 }} resizeMode="cover">
          <View style={[tw`px-5 py-2`, { backgroundColor: `${theme.gradient[1]}80` }]}>
            <View style={tw`flex-row items-center justify-between mb-2`}>
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
                  {t(theme.titleKey)}
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
                  {t(theme.subtitleKey)}
                </Text>
              </View>

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

            <View style={tw`flex-row items-center justify-between`}>
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
