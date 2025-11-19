// src/components/shared/PeriodSelector.tsx
// Sélecteur de période réutilisable pour les statistiques et le premium

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import tw from '@/lib/tailwind';

interface Period {
  key: string;
  label: string;
}

interface PeriodSelectorProps {
  /** Liste des périodes disponibles */
  periods: Period[];
  /** Période actuellement sélectionnée */
  selected: string;
  /** Callback lors de la sélection d'une période */
  onSelect: (period: string) => void;
  /** Style visuel du composant */
  variant?: 'default' | 'premium';
}

/**
 * Composant de sélection de période pour les écrans de statistiques
 *
 * @example
 * // Usage basique
 * <PeriodSelector
 *   periods={[
 *     { key: 'week', label: 'Week' },
 *     { key: 'month', label: 'Month' },
 *   ]}
 *   selected={selectedPeriod}
 *   onSelect={setSelectedPeriod}
 * />
 *
 * @example
 * // Usage avec variant premium
 * <PeriodSelector
 *   periods={[...]}
 *   selected={selected}
 *   onSelect={onSelect}
 *   variant="premium"
 * />
 */
const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  periods,
  selected,
  onSelect,
  variant = 'default'
}) => {
  const containerStyle = variant === 'premium'
    ? 'flex-row bg-sand rounded-3xl p-1.5 shadow-lg'
    : 'bg-slate-100 rounded-2xl p-1 flex-row';

  const selectedStyle = variant === 'premium'
    ? 'bg-sand-100'
    : 'bg-sand shadow-sm';

  const selectedTextColor = variant === 'premium'
    ? 'text-black'
    : 'text-slate-900';

  const unselectedTextColor = variant === 'premium'
    ? 'text-stone-300'
    : 'text-slate-500';

  return (
    <View style={tw`${containerStyle}`}>
      {periods.map((period) => (
        <Pressable
          key={period.key}
          onPress={() => onSelect(period.key)}
          style={tw`flex-1`}
        >
          <View
            style={tw`
              px-4 py-2.5 rounded-xl
              ${selected === period.key ? selectedStyle : ''}
            `}
          >
            <Text
              style={tw`
                text-center text-sm font-semibold
                ${selected === period.key ? selectedTextColor : unselectedTextColor}
              `}
            >
              {period.label}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
};

export default PeriodSelector;
