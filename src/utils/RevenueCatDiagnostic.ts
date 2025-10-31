// src/utils/RevenueCatDiagnostic.ts
// Run this to diagnose your RevenueCat API key issue

import { Platform } from 'react-native';
import { REVENUECAT_IOS_API_KEY, REVENUECAT_ANDROID_API_KEY } from '@env';
import Logger from './logger';

export const diagnoseRevenueCatSetup = () => {
  Logger.debug('\n========================================');
  Logger.debug('🔍 REVENUECAT DIAGNOSTIC TOOL');
  Logger.debug('========================================\n');

  // 1. Check platform
  Logger.debug('1️⃣ PLATFORM CHECK');
  Logger.debug('   Platform:', Platform.OS);
  Logger.debug('   ✅ Platform detected\n');

  // 2. Check environment variables
  Logger.debug('2️⃣ ENVIRONMENT VARIABLES CHECK');
  Logger.debug('   REVENUECAT_IOS_API_KEY exists:', typeof REVENUECAT_IOS_API_KEY !== 'undefined');
  Logger.debug('   REVENUECAT_ANDROID_API_KEY exists:', typeof REVENUECAT_ANDROID_API_KEY !== 'undefined');

  if (typeof REVENUECAT_IOS_API_KEY === 'undefined' && typeof REVENUECAT_ANDROID_API_KEY === 'undefined') {
    Logger.error('   ❌ NO API KEYS FOUND!');
    Logger.error('   → Check that you have @env import configured');
    Logger.error('   → Check babel.config.js has react-native-dotenv');
    Logger.error('   → Restart dev server with: npx expo start -c\n');
    return;
  }
  Logger.debug('   ✅ At least one API key found\n');

  // 3. Check iOS key
  if (Platform.OS === 'ios') {
    Logger.debug('3️⃣ iOS API KEY CHECK');

    if (!REVENUECAT_IOS_API_KEY) {
      Logger.error('   ❌ iOS API key is empty or undefined');
      Logger.error('   → Add REVENUECAT_IOS_API_KEY=appl_YOUR_KEY to .env file\n');
      return;
    }

    Logger.debug('   Key exists: ✅');
    Logger.debug('   Key length:', REVENUECAT_IOS_API_KEY.length);
    Logger.debug('   Key preview:', REVENUECAT_IOS_API_KEY.substring(0, 15) + '...');
    Logger.debug('   Starts with appl_:', REVENUECAT_IOS_API_KEY.startsWith('appl_'));

    if (!REVENUECAT_IOS_API_KEY.startsWith('appl_')) {
      Logger.error('\n   ❌ WRONG KEY FORMAT!');
      Logger.error('   → Your key should start with "appl_"');
      Logger.error('   → You might be using:');
      Logger.error('     - Test Store key (starts with "test_")');
      Logger.error('     - Web Billing key (starts with something else)');
      Logger.error('     - Secret key (starts with "sk_")');
      Logger.error('\n   ✅ SOLUTION:');
      Logger.error('   1. Go to RevenueCat Dashboard');
      Logger.error('   2. Project Settings → API Keys');
      Logger.error('   3. Find "Apple App Store" section');
      Logger.error('   4. Copy the PUBLIC key (starts with appl_)');
      Logger.error('   5. Paste in .env as REVENUECAT_IOS_API_KEY=appl_...\n');
      return;
    }

    if (REVENUECAT_IOS_API_KEY.length < 30) {
      Logger.warn('   ⚠️  Key seems too short, might be incomplete\n');
      return;
    }

    Logger.debug('   ✅ iOS key format looks correct!\n');
  }

  // 4. Check Android key
  if (Platform.OS === 'android') {
    Logger.debug('3️⃣ ANDROID API KEY CHECK');

    if (!REVENUECAT_ANDROID_API_KEY) {
      Logger.error('   ❌ Android API key is empty or undefined');
      Logger.error('   → Add REVENUECAT_ANDROID_API_KEY=goog_YOUR_KEY to .env file\n');
      return;
    }

    Logger.debug('   Key exists: ✅');
    Logger.debug('   Key length:', REVENUECAT_ANDROID_API_KEY.length);
    Logger.debug('   Key preview:', REVENUECAT_ANDROID_API_KEY.substring(0, 15) + '...');
    Logger.debug('   Starts with goog_:', REVENUECAT_ANDROID_API_KEY.startsWith('goog_'));

    if (!REVENUECAT_ANDROID_API_KEY.startsWith('goog_')) {
      Logger.error('\n   ❌ WRONG KEY FORMAT!');
      Logger.error('   → Your key should start with "goog_"');
      Logger.error('   → Go to RevenueCat Dashboard → API Keys');
      Logger.error('   → Find "Google Play Store" section');
      Logger.error('   → Copy the PUBLIC key (starts with goog_)\n');
      return;
    }

    if (REVENUECAT_ANDROID_API_KEY.length < 30) {
      Logger.warn('   ⚠️  Key seems too short, might be incomplete\n');
      return;
    }

    Logger.debug('   ✅ Android key format looks correct!\n');
  }

  // 5. Final checks
  Logger.debug('4️⃣ FINAL CHECKS');
  Logger.debug('   ✅ All checks passed!');
  Logger.debug('   ✅ You should be ready to use RevenueCat\n');

  Logger.debug('📝 NEXT STEPS:');
  Logger.debug('   1. Make sure you restarted dev server: npx expo start -c');
  Logger.debug('   2. Check you have products configured in RevenueCat dashboard');
  Logger.debug('   3. Test on a physical device (iOS) or internal test track (Android)');
  Logger.debug('========================================\n');
};

// Call this in your App.tsx to diagnose
export default diagnoseRevenueCatSetup;
