// src/components/NotificationSetup.tsx
import React, { useState } from 'react';
import { View, Text, Switch, Pressable, Modal } from 'react-native';
import { Svg, Path, Circle, Rect, Line } from 'react-native-svg';

import TimePicker from '../TimePicker';
import tw from '@/lib/tailwind';

interface NotificationSetupProps {
  enabled: boolean;
  time?: string;
  onChange: (enabled: boolean, time?: string) => void;
}

// Custom SVG Icons
const SunriseIcon = () => (
  <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="4" stroke="#f59e0b" strokeWidth="2" fill="#fef3c7" />
    <Path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

const SunIcon = () => (
  <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="5" fill="#fde047" stroke="#facc15" strokeWidth="2" />
    <Path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const SunsetIcon = () => (
  <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
    <Path d="M12 16a4 4 0 100-8 4 4 0 000 8z" fill="#fb923c" stroke="#f97316" strokeWidth="1.5" />
    <Path d="M3 16h1M7 16h10M20 16h1M3 20h18" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M12 2v4M4.93 4.93l2.83 2.83M16.24 7.76l2.83-2.83" stroke="#fdba74" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

const MoonIcon = () => (
  <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
    <Path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="#e0e7ff" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="18" cy="5" r="1" fill="#fbbf24" />
    <Circle cx="20" cy="9" r="0.5" fill="#fbbf24" />
    <Circle cx="15" cy="7" r="0.5" fill="#fbbf24" />
  </Svg>
);

const ClockIcon = () => (
  <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke="#14b8a6" strokeWidth="2" fill="#f0fdfa" />
    <Path d="M12 6v6l4 2" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const NotificationSetup: React.FC<NotificationSetupProps> = ({ enabled, time, onChange }) => {
  const [selectedTime, setSelectedTime] = useState(time || '09:00');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isCustomTime, setIsCustomTime] = useState(false);

  const commonTimes = [
    { label: 'Morning', time: '07:00', icon: <SunriseIcon /> },
    { label: 'Noon', time: '12:00', icon: <SunIcon /> },
    { label: 'Evening', time: '18:00', icon: <SunsetIcon /> },
    { label: 'Night', time: '21:00', icon: <MoonIcon /> },
    { label: 'Custom', time: 'custom', icon: <ClockIcon /> },
  ];

  const handleTimeSelect = (timeOption: any) => {
    if (timeOption.time === 'custom') {
      setShowTimePicker(true);
      setIsCustomTime(true);
    } else {
      setSelectedTime(timeOption.time);
      setIsCustomTime(false);
      onChange(enabled, timeOption.time);
    }
  };

  const handleCustomTimeConfirm = (hour: number, minute: number) => {
    const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    setSelectedTime(formattedTime);
    setShowTimePicker(false);
    onChange(enabled, formattedTime);
  };

  const formatDisplayTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours > 12 ? hours - 12 : hours || 12;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <View style={tw`px-6`}>
      <Text style={tw`text-2xl font-semibold text-slate-700 mb-2`}>Stay on Track</Text>
      <Text style={tw`text-slate-600 mb-6`}>Would you like daily reminders to complete your habit?</Text>

      <View style={tw`bg-white p-4 rounded-2xl shadow-sm`}>
        <View style={tw`flex-row items-center justify-between mb-4`}>
          <Text style={tw`text-lg text-slate-700`}>Enable notifications</Text>
          <Switch value={enabled} onValueChange={(value) => onChange(value, selectedTime)} trackColor={{ false: '#cbd5e1', true: '#5eead4' }} thumbColor={enabled ? '#14b8a6' : '#f4f4f5'} />
        </View>

        {enabled && (
          <View>
            <Text style={tw`text-slate-600 mb-3`}>Reminder time:</Text>
            <View style={tw`gap-2`}>
              {commonTimes.map((timeOption) => {
                const isSelected = timeOption.time === 'custom' ? isCustomTime : selectedTime === timeOption.time && !isCustomTime;

                return (
                  <Pressable
                    key={timeOption.time}
                    onPress={() => handleTimeSelect(timeOption)}
                    style={({ pressed }) => [tw`flex-row items-center p-3 rounded-xl border`, isSelected ? tw`bg-teal-50 border-teal-400` : tw`bg-white border-slate-200`, pressed && tw`bg-slate-50`]}
                  >
                    <View style={tw`mr-3`}>{timeOption.icon}</View>
                    <View style={tw`flex-1`}>
                      <Text style={[tw`font-medium`, isSelected ? tw`text-slate-800` : tw`text-slate-700`]}>{timeOption.label}</Text>
                      <Text style={tw`text-slate-500 text-sm`}>
                        {timeOption.time === 'custom' && isCustomTime ? formatDisplayTime(selectedTime) : timeOption.time !== 'custom' ? formatDisplayTime(timeOption.time) : 'Set your preferred time'}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={tw`w-5 h-5 bg-teal-500 rounded-full items-center justify-center`}>
                        <Svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <Path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="3" strokeLinecap="round" />
                        </Svg>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>

      <View style={tw`mt-4 p-4 bg-amber-50 rounded-2xl`}>
        <View style={tw`flex-row items-start`}>
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={tw`mr-2 mt-0.5`}>
            <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" />
          </Svg>
          <View style={tw`flex-1`}>
            <Text style={tw`text-amber-900 font-medium mb-1`}>Pro Tip</Text>
            <Text style={tw`text-amber-700 text-sm`}>Set reminders at times when you're most likely to complete your habit successfully.</Text>
          </View>
        </View>
      </View>

      {/* Time Picker Modal */}
      <Modal visible={showTimePicker} transparent animationType="slide" onRequestClose={() => setShowTimePicker(false)}>
        <TimePicker
          initialHour={parseInt(selectedTime.split(':')[0])}
          initialMinute={parseInt(selectedTime.split(':')[1])}
          onConfirm={handleCustomTimeConfirm}
          onCancel={() => setShowTimePicker(false)}
        />
      </Modal>
    </View>
  );
};

export default NotificationSetup;
