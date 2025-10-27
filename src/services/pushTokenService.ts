// src/services/pushTokenService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import Constants from 'expo-constants';

export class PushTokenService {
  /**
   * Register device for push notifications and store token
   * Call this after user logs in
   */
  static async registerDevice(userId: string): Promise<boolean> {
    try {
      // 1. Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Push notification permissions denied');
        return false;
      }

      // 2. Get Expo Push Token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        console.error('❌ Project ID not found in app.json');
        return false;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      const token = tokenData.data;
      const platform = Platform.OS;

      console.log('📱 Device token:', token);

      // 3. Store token in database
      const { error } = await supabase.from('push_tokens').upsert(
        {
          user_id: userId,
          token: token,
          platform: platform,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,token',
        }
      );

      if (error) {
        console.error('❌ Error storing push token:', error);
        return false;
      }

      console.log('✅ Device registered for push notifications');
      return true;
    } catch (error) {
      console.error('❌ Error registering device:', error);
      return false;
    }
  }

  /**
   * Remove device token (call on logout)
   */
  static async unregisterDevice(userId: string): Promise<void> {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) return;

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      await supabase.from('push_tokens').delete().eq('user_id', userId).eq('token', tokenData.data);

      console.log('✅ Device unregistered');
    } catch (error) {
      console.error('❌ Error unregistering device:', error);
    }
  }

  /**
   * Check if device is registered
   */
  static async isDeviceRegistered(userId: string): Promise<boolean> {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) return false;

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      const { data, error } = await supabase.from('push_tokens').select('id').eq('user_id', userId).eq('token', tokenData.data).single();

      return !error && !!data;
    } catch (error) {
      return false;
    }
  }
}
