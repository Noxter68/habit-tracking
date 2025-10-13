// src/components/dashboard/NextAchievement.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Lock, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';

interface NextAchievementProps {
  nextTitle?: {
    title: string;
    level: number;
  };
  xpToNextLevel: number;
}

const NextAchievement: React.FC<NextAchievementProps> = ({ nextTitle, xpToNextLevel }) => {
  const navigation = useNavigation();

  if (!nextTitle) return null;

  const handlePress = () => {
    navigation.navigate('Achievements' as never);
  };

  return (
    <Animated.View entering={FadeIn.delay(300)}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => ({
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        {/* Gradient card with Quartz accent */}
        <LinearGradient
          colors={['#FDF4FF', '#FCE7F3', '#FAF9F7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(236, 72, 153, 0.2)',
            shadowColor: '#EC4899',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Left side: Icon + Text */}
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              {/* Lock Icon with Quartz gradient */}
              <LinearGradient
                colors={['#EC4899', '#DB2777']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                  shadowColor: '#EC4899',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                }}
              >
                <Lock size={20} color="#FFFFFF" strokeWidth={2.5} />
              </LinearGradient>

              {/* Text Content */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '800',
                    color: '#EC4899',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}
                >
                  NEXT ACHIEVEMENT
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '800',
                    color: '#1F2937',
                    marginTop: 2,
                  }}
                >
                  {nextTitle.title}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                  <LinearGradient
                    colors={['#EC4899', '#DB2777']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      borderRadius: 20,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: '#FFFFFF',
                      }}
                    >
                      {xpToNextLevel} XP needed
                    </Text>
                  </LinearGradient>
                </View>
              </View>
            </View>

            {/* Right side: Chevron indicator */}
            <View
              style={{
                width: 32,
                height: 32,
                backgroundColor: 'rgba(236, 72, 153, 0.1)',
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(236, 72, 153, 0.2)',
              }}
            >
              <ChevronRight size={18} color="#EC4899" strokeWidth={2.5} />
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

export default NextAchievement;
