// src/screens/NotificationSettingsScreen.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, FadeIn } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Feather';
import tw from '../lib/tailwind';
import TimePicker from '../components/TimePicker';

interface NotificationOption {
  id: string;
  label: string;
  times: string[];
  isCustom?: boolean;
}

interface NavigationProp {
  goBack: () => void;
}

interface Props {
  navigation: NavigationProp;
}

const NotificationSettingsScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedCadence, setSelectedCadence] = useState<string>('twice');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [customTime, setCustomTime] = useState({ hour: 9, minute: 0 });
  const [expandedOption, setExpandedOption] = useState<string | null>(null);

  const notificationOptions: NotificationOption[] = [
    {
      id: 'once',
      label: 'Once a day',
      times: ['9:00 AM', '12:00 PM', '6:00 PM', '9:00 PM'],
    },
    {
      id: 'twice',
      label: 'Twice a day',
      times: ['9:00 AM & 6:00 PM', '8:00 AM & 8:00 PM', '10:00 AM & 7:00 PM'],
    },
    {
      id: 'thrice',
      label: 'Three times a day',
      times: ['8:00 AM, 2:00 PM & 8:00 PM', '9:00 AM, 1:00 PM & 7:00 PM'],
    },
    {
      id: 'custom',
      label: 'Custom time',
      times: [],
      isCustom: true,
    },
  ];

  const handleOptionSelect = (optionId: string) => {
    if (optionId === 'custom') {
      setShowTimePicker(true);
    } else {
      setExpandedOption(expandedOption === optionId ? null : optionId);
    }
    setSelectedCadence(optionId);
  };

  const handleTimeConfirm = (hour: number, minute: number) => {
    setCustomTime({ hour, minute });
    setShowTimePicker(false);
  };

  const formatCustomTime = () => {
    const period = customTime.hour >= 12 ? 'PM' : 'AM';
    const displayHour = customTime.hour > 12 ? customTime.hour - 12 : customTime.hour || 12;
    return `${displayHour}:${customTime.minute.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-50`}>
      {/* Header */}
      <View style={tw`flex-row items-center px-6 py-4 border-b border-slate-100`}>
        <Pressable onPress={() => navigation.goBack()} style={tw`p-2 -ml-2 rounded-full`}>
          <Icon name="chevron-left" size={24} color={tw.color('slate-600')} />
        </Pressable>
        <Text style={tw`text-xl font-semibold text-slate-800 ml-3`}>Notification Settings</Text>
      </View>

      <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
        {/* Info Section */}
        <View style={tw`mx-6 mt-6 p-4 bg-blue-50 rounded-2xl`}>
          <View style={tw`flex-row items-center mb-2`}>
            <Icon name="bell" size={20} color={tw.color('blue-600')} />
            <Text style={tw`text-base font-medium text-blue-900 ml-2`}>Daily Reminders</Text>
          </View>
          <Text style={tw`text-sm text-blue-700 leading-5`}>Choose when you'd like to receive gentle reminders to complete your habits</Text>
        </View>

        {/* Cadence Options */}
        <View style={tw`px-6 mt-8`}>
          <Text style={tw`text-lg font-semibold text-slate-800 mb-4`}>Notification Frequency</Text>

          {notificationOptions.map((option, index) => (
            <Animated.View key={option.id} entering={FadeIn.delay(100 * index)}>
              <Pressable onPress={() => handleOptionSelect(option.id)} style={tw`mb-3`}>
                <View style={[tw`p-4 rounded-2xl border-2`, selectedCadence === option.id ? tw`bg-teal-50 border-teal-300` : tw`bg-white border-slate-200`]}>
                  <View style={tw`flex-row items-center justify-between`}>
                    <View style={tw`flex-row items-center flex-1`}>
                      <View style={[tw`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center`, selectedCadence === option.id ? tw`bg-teal-500 border-teal-500` : tw`border-slate-300`]}>
                        {selectedCadence === option.id && <Icon name="check" size={12} color="white" />}
                      </View>
                      <Text style={[tw`text-base`, selectedCadence === option.id ? tw`font-semibold text-slate-800` : tw`text-slate-600`]}>{option.label}</Text>
                    </View>
                    {option.isCustom && selectedCadence === option.id && (
                      <View style={tw`flex-row items-center`}>
                        <Icon name="clock" size={16} color={tw.color('teal-600')} />
                        <Text style={tw`text-sm font-medium text-teal-600 ml-1`}>{formatCustomTime()}</Text>
                      </View>
                    )}
                  </View>

                  {/* Expanded Time Options */}
                  {!option.isCustom && expandedOption === option.id && option.times.length > 0 && (
                    <Animated.View entering={FadeIn} style={tw`mt-4 pt-4 border-t border-slate-100`}>
                      <Text style={tw`text-xs font-medium text-slate-500 mb-3 uppercase tracking-wider`}>Suggested Times</Text>
                      {option.times.map((time, timeIndex) => (
                        <Pressable key={timeIndex} style={tw`py-2.5 px-3 bg-slate-50 rounded-xl mb-2`}>
                          <Text style={tw`text-sm text-slate-700`}>{time}</Text>
                        </Pressable>
                      ))}
                    </Animated.View>
                  )}
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        {/* Save Button */}
        <Pressable style={tw`mx-6 mt-8 mb-6 py-4 bg-teal-500 rounded-2xl`} onPress={() => navigation.goBack()}>
          <Text style={tw`text-center text-white font-semibold text-base`}>Save Settings</Text>
        </Pressable>
      </ScrollView>

      {/* Time Picker Modal */}
      <Modal visible={showTimePicker} transparent animationType="slide" onRequestClose={() => setShowTimePicker(false)}>
        <TimePicker initialHour={customTime.hour} initialMinute={customTime.minute} onConfirm={handleTimeConfirm} onCancel={() => setShowTimePicker(false)} />
      </Modal>
    </SafeAreaView>
  );
};

export default NotificationSettingsScreen;
