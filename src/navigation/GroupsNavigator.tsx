// navigation/GroupsNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GroupsListScreen from '@/screens/GroupsListScreen';
import GroupDashboardScreen from '@/screens/GroupDashboardScreen';
import CreateGroupHabitScreen from '@/screens/CreateGroupHabitScreen';
import GroupSettingsScreen from '@/screens/GroupSettingsScreen';

export type GroupsStackParamList = {
  GroupsList: undefined;
  GroupDashboard: { groupId: string };
  CreateGroupHabit: { groupId: string };
  GroupSettings: { groupId: string };
};

const Stack = createNativeStackNavigator<GroupsStackParamList>();

export function GroupsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="GroupsList" component={GroupsListScreen} />
      <Stack.Screen name="GroupDashboard" component={GroupDashboardScreen} />
      <Stack.Screen
        name="CreateGroupHabit"
        component={CreateGroupHabitScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="GroupSettings"
        component={GroupSettingsScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
}
