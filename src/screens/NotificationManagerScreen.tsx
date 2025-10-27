// src/screens/NotificationManagerScreen.tsx
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import NotificationManager from '@/components/notifications/NotificationManger';

/**
 * Screen wrapper for the NotificationManager component
 * This allows it to be used in the navigation stack
 */
const NotificationManagerScreen: React.FC = () => {
  const navigation = useNavigation();

  return <NotificationManager onClose={() => navigation.goBack()} />;
};

export default NotificationManagerScreen;
