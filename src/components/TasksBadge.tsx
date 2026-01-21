// src/components/dashboard/TaskBadge.tsx
import React, { useMemo } from 'react';
import { View, Text, ImageBackground } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import tw from '@/lib/tailwind';

interface TaskBadgeProps {
  completed: number;
  total: number;
  username?: string;
  userLevel?: number;
}

interface ThemeConfig {
  titleKey: string;
  subtitleKey: string;
  messageKey: string;
  texture: any;
  gradient: string[];
  textColor: string;
}

export const TaskBadge: React.FC<TaskBadgeProps> = ({ completed, total, username, userLevel = 1 }) => {
  const { t } = useTranslation();
  const displayName = username || t('common.friend');

  const completionRate = useMemo(() => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [completed, total]);

  const theme = useMemo((): ThemeConfig => {
    // 100% - Thème basé sur le niveau utilisateur
    if (completionRate === 100) {
      // Niveau 36+ - Inferno (Infernal Dominion) avec le phoenix (level-39)
      if (userLevel >= 36) {
        return {
          titleKey: 'dashboard.taskBadge.legendary.title',
          subtitleKey: 'dashboard.taskBadge.legendary.subtitle',
          messageKey: 'dashboard.taskBadge.legendary.message',
          texture: require('../../assets/interface/texture-fire.png'),
          gradient: ['#ff6b35', '#ff4500', '#8b0000'],
          textColor: '#FFFFFF',
        };
      }
      // Niveau 31-35 - Celeste (Celestial Ascension)
      if (userLevel >= 31) {
        return {
          titleKey: 'dashboard.taskBadge.legendary.title',
          subtitleKey: 'dashboard.taskBadge.legendary.subtitle',
          messageKey: 'dashboard.taskBadge.legendary.message',
          texture: require('../../assets/interface/progressBar/celeste-texture.png'),
          gradient: ['#60a5fa', '#3f7eea', '#1e40af'],
          textColor: '#FFFFFF',
        };
      }
      // Niveau < 31 - Obsidian (Mythique)
      return {
        titleKey: 'dashboard.taskBadge.legendary.title',
        subtitleKey: 'dashboard.taskBadge.legendary.subtitle',
        messageKey: 'dashboard.taskBadge.legendary.message',
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
      texture: require('../../assets/interface/progressBar/crystal.png'),
      gradient: ['#60a5fa', '#3b82f6', '#2563eb'],
      textColor: '#FFFFFF',
    };
  }, [completionRate, total, completed, userLevel]);

  // Get the translated message with username and count
  const getMessage = () => {
    if (completionRate >= 80 && completionRate < 100) {
      const remaining = total - completed;
      return t(theme.messageKey, { count: remaining, name: displayName });
    }
    return t(theme.messageKey, { name: displayName });
  };

  return (
    <Animated.View entering={FadeIn.duration(600)}>
      <View style={{ position: 'relative' }}>
        {/* Shadow layer for depth effect */}
        <View
          style={{
            position: 'absolute',
            top: 3,
            left: 0,
            right: 0,
            bottom: -3,
            backgroundColor: `${theme.gradient[2]}`,
            borderRadius: 16,
          }}
        />
        <View
          style={[
            tw`rounded-2xl overflow-hidden`,
            {
              borderRadius: 16,
            },
          ]}
        >
          <ImageBackground source={theme.texture} style={tw`w-full`} imageStyle={{ opacity: 1 }} resizeMode="cover">
            <View style={[tw`px-4 py-3`, { backgroundColor: `${theme.gradient[1]}80` }]}>
            <View style={tw`flex-row items-center justify-between`}>
              <View style={tw`flex-1 mr-3`}>
                <Text
                  style={[
                    tw`text-xl font-black`,
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
                    tw`text-xs font-semibold`,
                    {
                      color: theme.textColor,
                      opacity: 0.9,
                      textShadowColor: 'rgba(0, 0, 0, 0.2)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    },
                  ]}
                >
                  {t(theme.subtitleKey, { name: displayName })}
                </Text>
              </View>

              {/* Stats compacts - plus grand, sans icône */}
              <View style={tw`flex-row items-baseline`}>
                <Text
                  style={[
                    tw`text-4xl font-black`,
                    {
                      color: theme.textColor,
                      textShadowColor: 'rgba(0, 0, 0, 0.3)',
                      textShadowOffset: { width: 0, height: 2 },
                      textShadowRadius: 4,
                    },
                  ]}
                >
                  {completed}
                </Text>
                <Text
                  style={[
                    tw`text-2xl font-bold`,
                    {
                      color: theme.textColor,
                      opacity: 0.8,
                    },
                  ]}
                >
                  /{total}
                </Text>
              </View>
            </View>
          </View>
          </ImageBackground>
        </View>
      </View>
    </Animated.View>
  );
};

export default TaskBadge;
