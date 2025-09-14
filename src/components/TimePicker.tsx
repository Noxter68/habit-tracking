// src/components/TimePicker.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import tw from '../lib/tailwind';

interface TimePickerProps {
  initialHour?: number;
  initialMinute?: number;
  onConfirm: (hour: number, minute: number) => void;
  onCancel: () => void;
}

interface WheelPickerProps {
  data: number[];
  selectedValue: number;
  onValueChange: (value: number) => void;
  formatter?: (value: number) => string;
  scrollRef: React.RefObject<ScrollView>;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const TimePicker: React.FC<TimePickerProps> = ({ initialHour = 9, initialMinute = 0, onConfirm, onCancel }) => {
  const [selectedHour, setSelectedHour] = useState(initialHour);
  const [selectedMinute, setSelectedMinute] = useState(initialMinute);
  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const snapToItem = (scrollRef: React.RefObject<ScrollView>, index: number) => {
    scrollRef.current?.scrollTo({
      y: index * ITEM_HEIGHT,
      animated: true,
    });
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>, setValue: (value: number) => void, maxValue: number) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, maxValue - 1));
    setValue(clampedIndex);
  };

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour || 12;
    return `${displayHour} ${period}`;
  };

  const WheelPicker: React.FC<WheelPickerProps> = ({ data, selectedValue, onValueChange, formatter, scrollRef }) => (
    <View style={tw`flex-1`}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => handleScroll(e, onValueChange, data.length)}
        contentContainerStyle={{
          paddingVertical: ITEM_HEIGHT * 2,
        }}
      >
        {data.map((value) => {
          const isSelected = value === selectedValue;
          return (
            <Pressable
              key={value}
              onPress={() => {
                onValueChange(value);
                snapToItem(scrollRef, value);
              }}
              style={{
                height: ITEM_HEIGHT,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={[tw`text-lg`, isSelected ? tw`text-slate-800 font-semibold text-xl` : tw`text-slate-400`]}>{formatter ? formatter(value) : value.toString().padStart(2, '0')}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  useEffect(() => {
    // Initial scroll to selected values
    setTimeout(() => {
      snapToItem(hourScrollRef, selectedHour);
      snapToItem(minuteScrollRef, selectedMinute);
    }, 100);
  }, []);

  return (
    <View style={tw`flex-1 bg-black bg-opacity-50 justify-end`}>
      <Pressable style={tw`flex-1`} onPress={onCancel} />

      <View style={tw`bg-white rounded-t-3xl`}>
        {/* Header */}
        <View style={tw`flex-row items-center justify-between px-6 py-4 border-b border-slate-100`}>
          <Pressable onPress={onCancel} style={tw`p-2 -ml-2`}>
            <Icon name="x" size={24} color={tw.color('slate-600')} />
          </Pressable>
          <Text style={tw`text-lg font-semibold text-slate-800`}>Select Time</Text>
          <Pressable onPress={() => onConfirm(selectedHour, selectedMinute)} style={tw`py-2 px-4 bg-teal-500 rounded-full`}>
            <Text style={tw`text-white font-medium`}>Done</Text>
          </Pressable>
        </View>

        {/* Time Display */}
        <View style={tw`py-6 items-center bg-slate-50`}>
          <Text style={tw`text-3xl font-bold text-slate-800`}>
            {formatHour(selectedHour)}:{selectedMinute.toString().padStart(2, '0')}
          </Text>
        </View>

        {/* Picker Wheels */}
        <View style={{ flexDirection: 'row', height: PICKER_HEIGHT, paddingHorizontal: 24, paddingBottom: 32 }}>
          <WheelPicker data={hours} selectedValue={selectedHour} onValueChange={setSelectedHour} formatter={formatHour} scrollRef={hourScrollRef} />

          <View style={tw`px-4 justify-center`}>
            <Text style={tw`text-2xl font-bold text-slate-400`}>:</Text>
          </View>

          <WheelPicker data={minutes} selectedValue={selectedMinute} onValueChange={setSelectedMinute} scrollRef={minuteScrollRef} />
        </View>
      </View>
    </View>
  );
};

export default TimePicker;
