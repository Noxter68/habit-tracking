// components/groups/GroupInfoModal.tsx
import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X, Users, Zap, Calendar, Shield, Trophy, Share2, Crown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import tw from '@/lib/tailwind';

interface GroupInfoModalProps {
  visible: boolean;
  onClose: () => void;
  t: (key: string) => string;
}

export default function GroupInfoModal({ visible, onClose, t }: GroupInfoModalProps) {
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const sections = [
    {
      icon: Users,
      color: '#3B82F6',
      title: t('groups.info.completion.title'),
      description: t('groups.info.completion.description'),
    },
    {
      icon: Zap,
      color: '#F59E0B',
      title: t('groups.info.xp.title'),
      description: t('groups.info.xp.description'),
    },
    {
      icon: Calendar,
      color: '#8B5CF6',
      title: t('groups.info.streak.title'),
      description: t('groups.info.streak.description'),
    },
    {
      icon: Shield,
      color: '#10B981',
      title: t('groups.info.tolerance.title'),
      description: t('groups.info.tolerance.description'),
    },
    {
      icon: Trophy,
      color: '#EF4444',
      title: t('groups.info.weekly.title'),
      description: t('groups.info.weekly.description'),
    },
    {
      icon: Share2,
      color: '#06B6D4',
      title: t('groups.info.invite.title'),
      description: t('groups.info.invite.description'),
    },
    {
      icon: Crown,
      color: '#EC4899',
      title: t('groups.info.limits.title'),
      description: t('groups.info.limits.description'),
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={tw`flex-1 bg-black/50`}>
        <View
          style={[
            tw`flex-1 mt-20 rounded-t-3xl bg-[#FAFAFA]`,
            {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
            },
          ]}
        >
          {/* Header */}
          <View style={tw`px-6 pt-6 pb-4 border-b border-stone-200/50`}>
            <View style={tw`flex-row items-center justify-between`}>
              <Text style={tw`text-xl font-bold text-stone-800`}>{t('groups.info.header')}</Text>
              <TouchableOpacity onPress={handleClose} style={tw`w-10 h-10 items-center justify-center rounded-full bg-stone-100`}>
                <X size={20} color="#57534E" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-6 py-6`} showsVerticalScrollIndicator={false}>
            {/* Introduction */}
            <View
              style={[
                tw`rounded-2xl p-5 mb-6`,
                {
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  borderWidth: 1,
                  borderColor: 'rgba(59, 130, 246, 0.15)',
                },
              ]}
            >
              <Text style={tw`text-base text-stone-800 leading-relaxed`}>{t('groups.info.intro')}</Text>
            </View>

            {/* Sections */}
            {sections.map((section, index) => {
              const IconComponent = section.icon;
              return (
                <View key={index} style={tw`mb-6`}>
                  <View style={tw`flex-row items-center gap-3 mb-3`}>
                    <View style={[tw`w-10 h-10 rounded-xl items-center justify-center`, { backgroundColor: `${section.color}15` }]}>
                      <IconComponent size={20} color={section.color} strokeWidth={2} />
                    </View>
                    <Text style={tw`text-base font-bold text-stone-800 flex-1`}>{section.title}</Text>
                  </View>
                  <Text style={tw`text-sm text-stone-600 leading-relaxed pl-13`}>{section.description}</Text>
                </View>
              );
            })}

            {/* Bottom tip */}
            <View
              style={[
                tw`rounded-2xl p-5 mt-2`,
                {
                  backgroundColor: 'rgba(139, 92, 246, 0.08)',
                  borderWidth: 1,
                  borderColor: 'rgba(139, 92, 246, 0.15)',
                },
              ]}
            >
              <Text style={tw`text-sm text-stone-700 leading-relaxed text-center`}>{t('groups.info.tip')}</Text>
            </View>

            <View style={tw`h-8`} />
          </ScrollView>

          {/* Close Button */}
          <View style={tw`px-6 py-4 border-t border-stone-200/50`}>
            <TouchableOpacity
              onPress={handleClose}
              style={[
                tw`rounded-2xl px-6 py-4 items-center justify-center`,
                {
                  backgroundColor: '#3B82F6',
                  shadowColor: '#3B82F6',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text style={tw`text-base font-bold text-white`}>{t('groups.info.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
