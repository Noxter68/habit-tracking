// screens/GroupTiersScreen.tsx
import React, { useState, useEffect } from 'react';
import { ScrollView, Pressable, ActivityIndicator, View, Text, ImageBackground, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp as RNRouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { groupService } from '@/services/groupTypeService';
import { useAuth } from '@/context/AuthContext';
import type { GroupWithMembers } from '@/types/group.types';
import { getHabitTierTheme, getAchievementTierTheme } from '@/utils/tierTheme';
import { getGroupTierConfigByLevel, GROUP_TIERS_BY_LEVEL, calculateGroupTierFromLevel, getGroupTierThemeKey } from '@utils/groups/groupConstants';
import { GroupTierZoomModal } from '@/components/groups/GroupTierZoomModal';
import tw from '@/lib/tailwind';

type NavigationProp = NativeStackNavigationProp<any>;
type RouteParams = RNRouteProp<{ GroupTiers: { groupId: string } }, 'GroupTiers'>;

export default function GroupTiersScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const { user } = useAuth();
  const { groupId } = route.params;

  const [group, setGroup] = useState<GroupWithMembers | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<{
    tierConfig: any;
    tierTheme: any;
    isUnlocked: boolean;
  } | null>(null);

  useEffect(() => {
    loadGroup();
  }, [groupId]);

  const loadGroup = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const currentGroup = await groupService.getGroupById(groupId, user.id);
      setGroup(currentGroup);
    } catch (error) {
      console.error('Error loading group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handleTierPress = (tierConfig: any, tierTheme: any, isUnlocked: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedTier({ tierConfig, tierTheme, isUnlocked });
  };

  if (loading) {
    return (
      <View style={tw`flex-1 bg-[#FAFAFA] items-center justify-center`}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={tw`flex-1 bg-[#FAFAFA] items-center justify-center`}>
        <Text style={tw`text-sm text-stone-400`}>Groupe introuvable</Text>
      </View>
    );
  }

  const currentLevel = group.level || 1;
  const currentTierConfig = getGroupTierConfigByLevel(currentLevel);
  const currentTierNumber = calculateGroupTierFromLevel(currentLevel);

  // Utiliser getHabitTierTheme pour Crystal/Ruby/Amethyst, getAchievementTierTheme pour Jade/Topaz/Obsidian
  const tierTheme = currentTierNumber <= 3 ? getHabitTierTheme(currentTierConfig.name as any) : getAchievementTierTheme(getGroupTierThemeKey(currentTierNumber));

  const isObsidian = tierTheme.accent === '#8b5cf6';
  const isJade = tierTheme.accent === '#059669';
  const isTopaz = tierTheme.accent === '#f59e0b';

  // TOUJOURS utiliser le gradient normal (pas backgroundGradient)
  const headerGradient = tierTheme.gradient;

  const allTiers = [1, 2, 3, 4, 5, 6];

  return (
    <View style={tw`flex-1 bg-[#FAFAFA]`}>
      <StatusBar style="light" />
      {/* Compact Header with Current Tier Centered */}
      <LinearGradient
        colors={headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          {
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
            shadowColor: isObsidian ? '#8b5cf6' : isJade ? '#059669' : isTopaz ? '#f59e0b' : '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isObsidian || isJade || isTopaz ? 0.3 : 0.15,
            shadowRadius: 12,
          },
        ]}
      >
        {/* Force status bar to white */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 50,
            zIndex: 10,
          }}
        />

        <ImageBackground source={tierTheme.texture} resizeMode="cover" imageStyle={{ opacity: 0.2 }}>
          {(isObsidian || isJade || isTopaz) && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: isObsidian ? 'rgba(139, 92, 246, 0.08)' : isJade ? 'rgba(5, 150, 105, 0.08)' : 'rgba(245, 158, 11, 0.08)',
              }}
            />
          )}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: isObsidian || isJade || isTopaz ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.05)',
            }}
          />

          <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
            <View style={tw`px-5 pt-4 pb-6`}>
              {/* Back Button Only */}
              <Pressable onPress={handleGoBack} style={({ pressed }) => [tw`p-2 -ml-2 rounded-full self-start mb-5`, { backgroundColor: pressed ? 'rgba(255, 255, 255, 0.2)' : 'transparent' }]}>
                <ChevronLeft size={24} color="#FFFFFF" strokeWidth={2.5} />
              </Pressable>

              {/* Current Tier - Centered with Large Icon */}
              <View style={tw`items-center`}>
                <View
                  style={[
                    tw`rounded-2xl p-2 mb-2`,
                    {
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      borderWidth: 1.5,
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.25,
                      shadowRadius: 12,
                    },
                  ]}
                >
                  <Image source={currentTierConfig.icon} style={{ width: 140, height: 140 }} resizeMode="contain" />
                </View>

                <Text
                  style={[
                    tw`text-2xl font-black mb-1.5`,
                    {
                      color: '#FFFFFF',
                      textShadowColor: isObsidian ? 'rgba(139, 92, 246, 0.6)' : 'rgba(0, 0, 0, 0.4)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 3,
                    },
                  ]}
                >
                  {currentTierConfig.name}
                </Text>

                <View
                  style={[
                    tw`rounded-full px-3 py-1`,
                    {
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      tw`text-sm font-black`,
                      {
                        color: '#FFFFFF',
                        textShadowColor: 'rgba(0, 0, 0, 0.3)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 2,
                      },
                    ]}
                  >
                    Niveau {currentLevel}
                  </Text>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </ImageBackground>
      </LinearGradient>

      {/* All Tiers List */}
      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-5 py-5`} showsVerticalScrollIndicator={false}>
        <Text style={tw`text-lg font-black text-stone-800 mb-4`}>Tous les tiers</Text>

        {allTiers.map((tierNumber) => {
          const tierConfig = GROUP_TIERS_BY_LEVEL[tierNumber];
          const isUnlocked = currentTierNumber >= tierNumber;
          const isCurrent = currentTierNumber === tierNumber;

          // Utiliser getHabitTierTheme pour tiers 1-3, getAchievementTierTheme pour tiers 4-6
          const theme = tierNumber <= 3 ? getHabitTierTheme(tierConfig.name as any) : getAchievementTierTheme(getGroupTierThemeKey(tierNumber));

          return (
            <Pressable
              key={tierNumber}
              onPress={() => handleTierPress(tierConfig, theme, isUnlocked)}
              style={({ pressed }) => [
                tw`rounded-2xl p-4 mb-3`,
                {
                  backgroundColor: '#FFFFFF',
                  borderWidth: isCurrent ? 2 : 1,
                  borderColor: isCurrent ? theme.accent : 'rgba(0, 0, 0, 0.05)',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: pressed ? 0.1 : 0.05,
                  shadowRadius: 8,
                  opacity: isUnlocked ? 1 : 0.6,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <View style={tw`flex-row items-center gap-3`}>
                {/* Tier Icon */}
                <View style={tw`w-16 h-16 items-center justify-center`}>
                  <Image source={tierConfig.icon} style={{ width: 64, height: 64 }} resizeMode="contain" />
                </View>

                {/* Info */}
                <View style={tw`flex-1`}>
                  <View style={tw`flex-row items-center gap-2 mb-1`}>
                    <Text style={tw`text-lg font-black text-stone-800`}>{tierConfig.name}</Text>
                    {isCurrent && (
                      <View style={[tw`rounded-full px-2 py-0.5`, { backgroundColor: `${theme.accent}20` }]}>
                        <Text style={[tw`text-xs font-bold`, { color: theme.accent }]}>Actuel</Text>
                      </View>
                    )}
                  </View>

                  <Text style={tw`text-sm text-stone-600 mb-2`}>{tierConfig.description}</Text>

                  {/* Level Required */}
                  <View
                    style={[
                      tw`rounded-lg px-2.5 py-1.5 self-start`,
                      {
                        backgroundColor: isUnlocked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        tw`text-xs font-semibold`,
                        {
                          color: isUnlocked ? '#10b981' : '#78716c',
                        },
                      ]}
                    >
                      {isUnlocked ? `✓ Niveau ${tierConfig.minLevel}+` : `Niveau ${tierConfig.minLevel} requis`}
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}

        <View style={tw`h-6`} />
      </ScrollView>

      {/* Zoom Modal */}
      {selectedTier && (
        <GroupTierZoomModal
          visible={!!selectedTier}
          onClose={() => setSelectedTier(null)}
          tierConfig={selectedTier.tierConfig}
          tierTheme={selectedTier.tierTheme}
          isUnlocked={selectedTier.isUnlocked}
          currentLevel={currentLevel}
        />
      )}
    </View>
  );
}
