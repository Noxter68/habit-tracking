// components/groups/GroupTierZoomModal.tsx
import React from 'react';
import { Modal, Pressable, View, Text, ImageBackground, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '@/lib/tailwind';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GroupTierZoomModalProps {
  visible: boolean;
  onClose: () => void;
  tierConfig: {
    name: string;
    description: string;
    minLevel: number;
    tier?: number;
    icon: any;
  };
  tierTheme: {
    accent: string;
    gradient: string[];
    texture: any;
    backgroundGradient?: string[]; // Pour achievement tiers (Jade, Topaz, Obsidian)
  };
  isUnlocked: boolean;
  currentLevel: number;
}

export const GroupTierZoomModal: React.FC<GroupTierZoomModalProps> = ({ visible, onClose, tierConfig, tierTheme, isUnlocked, currentLevel }) => {
  const isObsidian = tierTheme.accent === '#8b5cf6';
  const isJade = tierTheme.accent === '#059669';
  const isTopaz = tierTheme.accent === '#f59e0b';

  // Pour les tiers avancés (Jade, Topaz, Obsidian), utiliser backgroundGradient s'il existe
  const gradientColors = tierTheme.backgroundGradient || tierTheme.gradient;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={tw`flex-1 bg-slate-900/95 items-center justify-center px-6`} onPress={onClose}>
        <View style={tw`w-full max-w-sm`}>
          <Pressable style={tw`bg-[#FAFAFA] rounded-3xl p-8 shadow-2xl`} onPress={(e) => e.stopPropagation()}>
            {/* Tier Icon */}
            <View style={tw`items-center -mt-20 mb-6`}>
              <LinearGradient
                colors={tierTheme.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  tw`rounded-full p-4`,
                  {
                    shadowColor: isObsidian ? '#8b5cf6' : '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: isObsidian ? 0.8 : 0.2,
                    shadowRadius: 16,
                  },
                ]}
              >
                <ImageBackground source={tierTheme.texture} resizeMode="cover" imageStyle={{ opacity: 0.2, borderRadius: 9999 }}>
                  {isObsidian && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        borderRadius: 9999,
                      }}
                    />
                  )}
                  <View style={tw`p-5`}>
                    <Image
                      source={tierConfig.icon}
                      style={{
                        width: SCREEN_WIDTH * 0.4,
                        height: SCREEN_WIDTH * 0.4,
                        opacity: isUnlocked ? 1 : 0.7,
                      }}
                      resizeMode="contain"
                    />
                  </View>
                </ImageBackground>
              </LinearGradient>
            </View>

            {/* Tier Name */}
            <Text style={tw`text-stone-900 text-3xl font-black text-center mb-3`}>{tierConfig.name}</Text>

            {/* Description */}
            <Text style={tw`text-stone-600 text-base text-center mb-6 leading-6`}>{tierConfig.description}</Text>

            {/* Pills */}
            <View style={tw`flex-row gap-2 justify-center mb-6`}>
              <View
                style={[
                  tw`rounded-full px-4 py-2`,
                  {
                    backgroundColor: isUnlocked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  },
                ]}
              >
                <Text
                  style={[
                    tw`text-sm font-semibold`,
                    {
                      color: isUnlocked ? '#10b981' : '#78716c',
                    },
                  ]}
                >
                  {isUnlocked ? `✓ Niveau ${tierConfig.minLevel}+` : `Niveau ${tierConfig.minLevel} requis`}
                </Text>
              </View>

              <View style={tw`bg-stone-100 rounded-full px-4 py-2`}>
                <Text style={tw`text-stone-700 text-sm font-semibold`}>Tier {tierConfig.tier || 1}</Text>
              </View>
            </View>

            {/* Close Hint */}
            <Text style={tw`text-stone-400 text-xs text-center`}>Toucher pour fermer</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};
