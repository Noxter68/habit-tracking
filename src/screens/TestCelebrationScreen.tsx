// src/screens/TestCelebrationScreen.tsx
// Screen de test pour déclencher les modals manuellement

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useGroupCelebration } from '@/context/GroupCelebrationContext';
import { GroupTierUpModal } from '@/components/groups/GroupTierUpModal';
import { GroupLevelUpModal } from '@/components/groups/GroupLevelUpModal';
import tw from '@/lib/tailwind';

export default function TestCelebrationScreen() {
  const { triggerTierUp, triggerLevelUp } = useGroupCelebration();

  return (
    <View style={tw`flex-1 bg-[#FAFAFA] items-center justify-center gap-4`}>
      <Text style={tw`text-2xl font-black text-stone-800 mb-6`}>Test Celebration Modals</Text>

      {/* Level Up Tests */}
      <View style={tw`gap-3`}>
        <Text style={tw`text-lg font-bold text-stone-700 mb-2`}>Level Up (Simple)</Text>

        <TouchableOpacity onPress={() => triggerLevelUp(5, 4)} style={tw`bg-blue-500 px-6 py-3 rounded-xl`}>
          <Text style={tw`text-white font-bold`}>Level 4 → 5 (Crystal)</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => triggerLevelUp(15, 14)} style={tw`bg-red-500 px-6 py-3 rounded-xl`}>
          <Text style={tw`text-white font-bold`}>Level 14 → 15 (Ruby)</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => triggerLevelUp(35, 34)} style={tw`bg-emerald-500 px-6 py-3 rounded-xl`}>
          <Text style={tw`text-white font-bold`}>Level 34 → 35 (Jade)</Text>
        </TouchableOpacity>
      </View>

      {/* Tier Up Tests */}
      <View style={tw`gap-3 mt-6`}>
        <Text style={tw`text-lg font-bold text-stone-700 mb-2`}>Tier Up (Épique)</Text>

        <TouchableOpacity onPress={() => triggerTierUp(10, 9)} style={tw`bg-purple-600 px-6 py-3 rounded-xl`}>
          <Text style={tw`text-white font-bold`}>Crystal → Ruby (Tier 1→2)</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => triggerTierUp(20, 19)} style={tw`bg-violet-600 px-6 py-3 rounded-xl`}>
          <Text style={tw`text-white font-bold`}>Ruby → Amethyst (Tier 2→3)</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => triggerTierUp(30, 29)} style={tw`bg-emerald-600 px-6 py-3 rounded-xl`}>
          <Text style={tw`text-white font-bold`}>Amethyst → Jade (Tier 3→4)</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => triggerTierUp(40, 39)} style={tw`bg-amber-600 px-6 py-3 rounded-xl`}>
          <Text style={tw`text-white font-bold`}>Jade → Topaz (Tier 4→5)</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => triggerTierUp(50, 49)} style={tw`bg-slate-900 px-6 py-3 rounded-xl`}>
          <Text style={tw`text-white font-bold`}>Topaz → Obsidian (Tier 5→6)</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <GroupTierUpModal />
      <GroupLevelUpModal />
    </View>
  );
}
