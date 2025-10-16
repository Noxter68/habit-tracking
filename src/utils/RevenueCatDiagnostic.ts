// src/utils/RevenueCatDiagnostic.ts
// Run this to diagnose your RevenueCat API key issue

import { Platform } from 'react-native';
import { REVENUECAT_IOS_API_KEY, REVENUECAT_ANDROID_API_KEY } from '@env';

export const diagnoseRevenueCatSetup = () => {
  console.log('\n========================================');
  console.log('🔍 REVENUECAT DIAGNOSTIC TOOL');
  console.log('========================================\n');

  // 1. Check platform
  console.log('1️⃣ PLATFORM CHECK');
  console.log('   Platform:', Platform.OS);
  console.log('   ✅ Platform detected\n');

  // 2. Check environment variables
  console.log('2️⃣ ENVIRONMENT VARIABLES CHECK');
  console.log('   REVENUECAT_IOS_API_KEY exists:', typeof REVENUECAT_IOS_API_KEY !== 'undefined');
  console.log('   REVENUECAT_ANDROID_API_KEY exists:', typeof REVENUECAT_ANDROID_API_KEY !== 'undefined');

  if (typeof REVENUECAT_IOS_API_KEY === 'undefined' && typeof REVENUECAT_ANDROID_API_KEY === 'undefined') {
    console.error('   ❌ NO API KEYS FOUND!');
    console.error('   → Check that you have @env import configured');
    console.error('   → Check babel.config.js has react-native-dotenv');
    console.error('   → Restart dev server with: npx expo start -c\n');
    return;
  }
  console.log('   ✅ At least one API key found\n');

  // 3. Check iOS key
  if (Platform.OS === 'ios') {
    console.log('3️⃣ iOS API KEY CHECK');

    if (!REVENUECAT_IOS_API_KEY) {
      console.error('   ❌ iOS API key is empty or undefined');
      console.error('   → Add REVENUECAT_IOS_API_KEY=appl_YOUR_KEY to .env file\n');
      return;
    }

    console.log('   Key exists: ✅');
    console.log('   Key length:', REVENUECAT_IOS_API_KEY.length);
    console.log('   Key preview:', REVENUECAT_IOS_API_KEY.substring(0, 15) + '...');
    console.log('   Starts with appl_:', REVENUECAT_IOS_API_KEY.startsWith('appl_'));

    if (!REVENUECAT_IOS_API_KEY.startsWith('appl_')) {
      console.error('\n   ❌ WRONG KEY FORMAT!');
      console.error('   → Your key should start with "appl_"');
      console.error('   → You might be using:');
      console.error('     - Test Store key (starts with "test_")');
      console.error('     - Web Billing key (starts with something else)');
      console.error('     - Secret key (starts with "sk_")');
      console.error('\n   ✅ SOLUTION:');
      console.error('   1. Go to RevenueCat Dashboard');
      console.error('   2. Project Settings → API Keys');
      console.error('   3. Find "Apple App Store" section');
      console.error('   4. Copy the PUBLIC key (starts with appl_)');
      console.error('   5. Paste in .env as REVENUECAT_IOS_API_KEY=appl_...\n');
      return;
    }

    if (REVENUECAT_IOS_API_KEY.length < 30) {
      console.warn('   ⚠️  Key seems too short, might be incomplete\n');
      return;
    }

    console.log('   ✅ iOS key format looks correct!\n');
  }

  // 4. Check Android key
  if (Platform.OS === 'android') {
    console.log('3️⃣ ANDROID API KEY CHECK');

    if (!REVENUECAT_ANDROID_API_KEY) {
      console.error('   ❌ Android API key is empty or undefined');
      console.error('   → Add REVENUECAT_ANDROID_API_KEY=goog_YOUR_KEY to .env file\n');
      return;
    }

    console.log('   Key exists: ✅');
    console.log('   Key length:', REVENUECAT_ANDROID_API_KEY.length);
    console.log('   Key preview:', REVENUECAT_ANDROID_API_KEY.substring(0, 15) + '...');
    console.log('   Starts with goog_:', REVENUECAT_ANDROID_API_KEY.startsWith('goog_'));

    if (!REVENUECAT_ANDROID_API_KEY.startsWith('goog_')) {
      console.error('\n   ❌ WRONG KEY FORMAT!');
      console.error('   → Your key should start with "goog_"');
      console.error('   → Go to RevenueCat Dashboard → API Keys');
      console.error('   → Find "Google Play Store" section');
      console.error('   → Copy the PUBLIC key (starts with goog_)\n');
      return;
    }

    if (REVENUECAT_ANDROID_API_KEY.length < 30) {
      console.warn('   ⚠️  Key seems too short, might be incomplete\n');
      return;
    }

    console.log('   ✅ Android key format looks correct!\n');
  }

  // 5. Final checks
  console.log('4️⃣ FINAL CHECKS');
  console.log('   ✅ All checks passed!');
  console.log('   ✅ You should be ready to use RevenueCat\n');

  console.log('📝 NEXT STEPS:');
  console.log('   1. Make sure you restarted dev server: npx expo start -c');
  console.log('   2. Check you have products configured in RevenueCat dashboard');
  console.log('   3. Test on a physical device (iOS) or internal test track (Android)');
  console.log('========================================\n');
};

// Call this in your App.tsx to diagnose
export default diagnoseRevenueCatSetup;
