// src/utils/pushTokenDiagnostic.ts
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';
import Logger from './logger';

export class PushTokenDiagnostic {
  /**
   * Lance un diagnostic complet du système de push tokens
   */
  static async runFullDiagnostic(userId: string): Promise<void> {
    console.log('\n' + '═'.repeat(80));
    console.log('🔍 PUSH TOKEN DIAGNOSTIC');
    console.log('═'.repeat(80));
    console.log(`User ID: ${userId}`);
    console.log('═'.repeat(80) + '\n');

    // 1. Vérifier les permissions
    await this.checkPermissions();

    // 2. Vérifier le project ID
    await this.checkProjectId();

    // 3. Vérifier si on peut générer un token
    await this.checkTokenGeneration();

    // 4. Vérifier la base de données
    await this.checkDatabaseTokens(userId);

    // 5. Essayer d'enregistrer le token
    await this.attemptTokenRegistration(userId);

    console.log('\n' + '═'.repeat(80));
    console.log('✅ DIAGNOSTIC COMPLETE');
    console.log('═'.repeat(80) + '\n');
  }

  private static async checkPermissions(): Promise<void> {
    console.log('━'.repeat(80));
    console.log('1️⃣ CHECKING PERMISSIONS');
    console.log('━'.repeat(80));

    try {
      const { status, canAskAgain, granted } = await Notifications.getPermissionsAsync();

      console.log(`   Status: ${status}`);
      console.log(`   Granted: ${granted}`);
      console.log(`   Can ask again: ${canAskAgain}`);

      if (status === 'granted') {
        console.log('   ✅ Permissions are granted');
      } else if (status === 'denied') {
        console.log('   ❌ Permissions are DENIED');
        console.log('   → User must enable notifications in iOS Settings');
      } else {
        console.log('   ⚠️  Permissions not determined yet');
        console.log('   → App should request permissions');
      }
    } catch (error: any) {
      console.error('   ❌ Error checking permissions:', error.message);
    }

    console.log('━'.repeat(80) + '\n');
  }

  private static async checkProjectId(): Promise<void> {
    console.log('━'.repeat(80));
    console.log('2️⃣ CHECKING PROJECT ID');
    console.log('━'.repeat(80));

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    if (projectId) {
      console.log(`   ✅ Project ID found: ${projectId}`);
    } else {
      console.log('   ❌ Project ID NOT FOUND');
      console.log('   → Check your app.json configuration');
      console.log('   → Must have: extra.eas.projectId');
    }

    console.log('━'.repeat(80) + '\n');
  }

  private static async checkTokenGeneration(): Promise<void> {
    console.log('━'.repeat(80));
    console.log('3️⃣ ATTEMPTING TOKEN GENERATION');
    console.log('━'.repeat(80));

    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        console.log('   ⏭️  Skipped (no project ID)');
        console.log('━'.repeat(80) + '\n');
        return;
      }

      const { status } = await Notifications.getPermissionsAsync();

      if (status !== 'granted') {
        console.log('   ⏭️  Skipped (permissions not granted)');
        console.log('━'.repeat(80) + '\n');
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      const token = tokenData.data;

      console.log(`   ✅ Token generated successfully`);
      console.log(`   Token: ${token}`);
      console.log(`   Length: ${token.length} characters`);
      console.log(`   Format: ${this.validateTokenFormat(token) ? 'Valid ✅' : 'Invalid ❌'}`);
    } catch (error: any) {
      console.error('   ❌ Error generating token:', error.message);
      console.error('   Stack:', error.stack);
    }

    console.log('━'.repeat(80) + '\n');
  }

  private static async checkDatabaseTokens(userId: string): Promise<void> {
    console.log('━'.repeat(80));
    console.log('4️⃣ CHECKING DATABASE');
    console.log('━'.repeat(80));

    try {
      const { data: tokens, error } = await supabase.from('push_tokens').select('*').eq('user_id', userId);

      if (error) {
        console.error(`   ❌ Database error: ${error.message}`);
        console.log('━'.repeat(80) + '\n');
        return;
      }

      console.log(`   Tokens in database: ${tokens?.length || 0}`);

      if (tokens && tokens.length > 0) {
        console.log('   ✅ Tokens found:\n');
        tokens.forEach((t, idx) => {
          console.log(`   ${idx + 1}. ${t.token}`);
          console.log(`      Platform: ${t.platform}`);
          console.log(`      Created: ${new Date(t.created_at).toLocaleString()}`);
          console.log(`      Updated: ${new Date(t.updated_at).toLocaleString()}`);
          console.log(`      Valid format: ${this.validateTokenFormat(t.token) ? '✅' : '❌'}`);
          console.log('');
        });
      } else {
        console.log('   ⚠️  NO TOKENS IN DATABASE');
        console.log('   → User needs to register device');
      }
    } catch (error: any) {
      console.error('   ❌ Error checking database:', error.message);
    }

    console.log('━'.repeat(80) + '\n');
  }

  private static async attemptTokenRegistration(userId: string): Promise<void> {
    console.log('━'.repeat(80));
    console.log('5️⃣ ATTEMPTING REGISTRATION');
    console.log('━'.repeat(80));

    try {
      // Vérifier les prérequis
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        console.log('   ⏭️  Cannot register: permissions not granted');
        console.log('━'.repeat(80) + '\n');
        return;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.log('   ⏭️  Cannot register: no project ID');
        console.log('━'.repeat(80) + '\n');
        return;
      }

      // Générer le token
      console.log('   📱 Generating token...');
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      const token = tokenData.data;
      const platform = 'ios'; // ou détecte avec Platform.OS

      console.log(`   ✅ Token: ${token}`);

      // Enregistrer dans la DB
      console.log('   💾 Saving to database...');
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
        console.error(`   ❌ Database error: ${error.message}`);
      } else {
        console.log('   ✅ Token saved successfully!');
      }
    } catch (error: any) {
      console.error('   ❌ Registration failed:', error.message);
    }

    console.log('━'.repeat(80) + '\n');
  }

  private static validateTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    return /^ExponentPushToken\[[a-zA-Z0-9_-]+\]$/.test(token);
  }

  /**
   * Version rapide pour afficher juste les infos essentielles
   */
  static async quickCheck(userId: string): Promise<void> {
    console.log('\n🔍 Quick Push Token Check');
    console.log('─'.repeat(50));

    const { status } = await Notifications.getPermissionsAsync();
    console.log(`📱 Permissions: ${status}`);

    const { data: tokens } = await supabase.from('push_tokens').select('token, platform').eq('user_id', userId);

    console.log(`💾 Tokens in DB: ${tokens?.length || 0}`);

    if (tokens && tokens.length > 0) {
      tokens.forEach((t, idx) => {
        console.log(`   ${idx + 1}. ${t.platform}: ${t.token.substring(0, 30)}...`);
      });
    }

    console.log('─'.repeat(50) + '\n');
  }
}

// Export une fonction simple à appeler
export const runPushTokenDiagnostic = (userId: string) => PushTokenDiagnostic.runFullDiagnostic(userId);

export const quickCheckPushToken = (userId: string) => PushTokenDiagnostic.quickCheck(userId);
