// src/components/shared/EmptyState.tsx
// Composant d'état vide générique et réutilisable

import React from 'react';
import { View, Text, Pressable, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Users, LogIn, LucideIcon } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import tw from '@/lib/tailwind';

interface ActionButton {
  label: string;
  onPress: () => void;
  /** Style du bouton: primary (coloré), secondary (outline) */
  variant?: 'primary' | 'secondary';
  icon?: LucideIcon;
}

interface EmptyStateProps {
  /** Icône principale (emoji ou composant Lucide) */
  icon?: string | LucideIcon;
  /** Couleur de l'icône Lucide */
  iconColor?: string;
  /** Titre affiché */
  title: string;
  /** Description sous le titre */
  description: string;
  /** Boutons d'action */
  actions?: ActionButton[];
  /** Utiliser un gradient pour le bouton principal */
  useGradient?: boolean;
  /** Couleurs du gradient */
  gradientColors?: string[];
  /** Message d'info supplémentaire (ex: premium) */
  infoMessage?: string;
  /** Animation d'entrée */
  animated?: boolean;
}

/**
 * Composant d'état vide générique
 *
 * @example
 * // Usage simple avec emoji
 * <EmptyState
 *   icon="🌱"
 *   title="No habits yet"
 *   description="Start your journey to better habits."
 *   actions={[{ label: "Create Habit", onPress: onCreate }]}
 * />
 *
 * @example
 * // Usage avec icône Lucide et gradient
 * <EmptyState
 *   icon={Plus}
 *   iconColor="#9ca3af"
 *   title={t('calendar.emptyState.title')}
 *   description={t('calendar.emptyState.description')}
 *   actions={[{ label: t('calendar.emptyState.button'), onPress: onCreateHabit }]}
 *   useGradient
 *   animated
 * />
 *
 * @example
 * // Usage avec plusieurs boutons (groups)
 * <EmptyState
 *   icon={Users}
 *   iconColor="#A78BFA"
 *   title="Aucun groupe"
 *   description="Créez ou rejoignez un groupe"
 *   actions={[
 *     { label: "Créer", onPress: onCreate, icon: Plus },
 *     { label: "Rejoindre", onPress: onJoin, variant: "secondary", icon: LogIn }
 *   ]}
 *   infoMessage="💎 Passez Premium pour créer jusqu'à 5 groupes"
 * />
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  iconColor = '#9ca3af',
  title,
  description,
  actions = [],
  useGradient = false,
  gradientColors = ['#9CA3AF', '#6B7280'],
  infoMessage,
  animated = false
}) => {
  const Container = animated ? Animated.View : View;
  const containerProps = animated ? { entering: FadeIn } : {};

  const renderIcon = () => {
    if (!icon) return null;

    if (typeof icon === 'string') {
      // Emoji
      return <Text style={tw`text-6xl mb-4`}>{icon}</Text>;
    }

    // Lucide icon
    const IconComponent = icon;
    return (
      <View style={tw`w-20 h-20 bg-sand-100 rounded-full items-center justify-center mb-6`}>
        <IconComponent size={40} color={iconColor} strokeWidth={1.5} />
      </View>
    );
  };

  const renderButton = (action: ActionButton, index: number) => {
    const isSecondary = action.variant === 'secondary';
    const IconComponent = action.icon;

    if (isSecondary) {
      return (
        <TouchableOpacity
          key={index}
          onPress={action.onPress}
          style={tw`bg-white rounded-2xl px-6 py-4 flex-row items-center justify-center gap-2 border border-gray-200`}
          activeOpacity={0.8}
        >
          {IconComponent && <IconComponent size={20} color="#6B7280" />}
          <Text style={tw`text-base font-semibold text-gray-700`}>{action.label}</Text>
        </TouchableOpacity>
      );
    }

    // Primary button
    if (useGradient && index === 0) {
      return (
        <Pressable
          key={index}
          onPress={action.onPress}
          style={({ pressed }) => [tw`rounded-2xl`, pressed && tw`opacity-80`]}
        >
          <LinearGradient
            colors={gradientColors}
            style={tw`px-8 py-4 rounded-2xl flex-row items-center justify-center gap-2`}
          >
            {IconComponent && <IconComponent size={20} color="#FFFFFF" />}
            <Text style={tw`text-white font-bold text-base`}>{action.label}</Text>
          </LinearGradient>
        </Pressable>
      );
    }

    return (
      <TouchableOpacity
        key={index}
        onPress={action.onPress}
        style={tw`bg-[#A78BFA] rounded-2xl px-6 py-4 flex-row items-center justify-center gap-2 shadow-sm`}
        activeOpacity={0.8}
      >
        {IconComponent && <IconComponent size={20} color="#FFFFFF" />}
        <Text style={tw`text-base font-semibold text-white`}>{action.label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Container style={tw`flex-1 items-center justify-center px-8 py-12`} {...containerProps}>
      {renderIcon()}

      <Text style={tw`text-xl font-bold text-stone-800 mb-2 text-center`}>{title}</Text>
      <Text style={tw`text-base text-sand-500 text-center mb-8`}>{description}</Text>

      {actions.length > 0 && (
        <View style={tw`gap-3 w-full`}>
          {actions.map(renderButton)}
        </View>
      )}

      {infoMessage && (
        <View style={tw`mt-8 bg-[#FEF3C7] rounded-xl px-4 py-3`}>
          <Text style={tw`text-xs text-[#92400E] text-center`}>{infoMessage}</Text>
        </View>
      )}
    </Container>
  );
};

export default EmptyState;
