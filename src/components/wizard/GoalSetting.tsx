import React from 'react';
import { View, Text, Switch, TextInput } from 'react-native';
import tw from '../../lib/tailwind';

interface GoalSettingProps {
  hasEndGoal: boolean;
  endGoalDays?: number;
  onChange: (hasEndGoal: boolean, days?: number) => void;
}

const GoalSetting: React.FC<GoalSettingProps> = ({ hasEndGoal, endGoalDays, onChange }) => {
  return (
    <View style={tw`px-6`}>
      <Text style={tw`text-2xl font-semibold text-slate-700 mb-2`}>Set Your Goal</Text>
      <Text style={tw`text-slate-600 mb-6`}>Do you have a specific end goal or timeframe in mind?</Text>

      <View style={tw`bg-white p-4 rounded-xl`}>
        <View style={tw`flex-row items-center justify-between mb-4`}>
          <Text style={tw`text-lg text-slate-700`}>Set an end goal</Text>
          <Switch value={hasEndGoal} onValueChange={(value) => onChange(value, endGoalDays)} trackColor={{ false: '#cbd5e1', true: '#5eead4' }} thumbColor={hasEndGoal ? '#14b8a6' : '#f4f4f5'} />
        </View>

        {hasEndGoal && (
          <View>
            <Text style={tw`text-slate-600 mb-2`}>Number of days:</Text>
            <TextInput
              style={tw`bg-slate-50 p-3 rounded-lg text-lg`}
              placeholder="e.g., 30, 60, 90"
              keyboardType="numeric"
              value={endGoalDays?.toString()}
              onChangeText={(text) => {
                const days = parseInt(text) || undefined;
                onChange(hasEndGoal, days);
              }}
            />
            <Text style={tw`text-sm text-slate-500 mt-2`}>Default is 61 days (time to form a habit)</Text>
          </View>
        )}
      </View>

      {!hasEndGoal && (
        <View style={tw`mt-4 p-4 bg-blue-50 rounded-xl`}>
          <Text style={tw`text-blue-900 font-medium mb-1`}>61-Day Challenge</Text>
          <Text style={tw`text-blue-700 text-sm`}>Research shows it takes an average of 66 days to form a new habit. We'll track your progress for 61 days to help you build lasting change.</Text>
        </View>
      )}
    </View>
  );
};

export default GoalSetting;
