// scripts/check-env.js
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking .env configuration...\n');

// Check if .env exists
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.error('   Create a .env file in the root directory\n');
  process.exit(1);
}

// Read .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n').filter((line) => line.trim() && !line.startsWith('#'));

console.log('✅ .env file found\n');
console.log('📋 Environment variables:');
console.log('─'.repeat(50));

// Required variables
const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'EXPO_PUBLIC_REVENUECAT_API_KEY', 'DEBUG_MODE', 'ENVIRONMENT', 'API_URL'];

let hasErrors = false;

required.forEach((varName) => {
  const found = lines.find((line) => line.startsWith(`${varName}=`));

  if (!found) {
    console.log(`❌ ${varName}: MISSING`);
    hasErrors = true;
  } else {
    const value = found.split('=')[1];
    const preview = value.length > 20 ? value.substring(0, 20) + '...' : value;

    if (!value || value.trim() === '') {
      console.log(`⚠️  ${varName}: EMPTY`);
      hasErrors = true;
    } else {
      console.log(`✅ ${varName}: ${preview}`);
    }
  }
});

console.log('─'.repeat(50));

if (hasErrors) {
  console.error('\n❌ Some required variables are missing or empty!');
  console.log('\n💡 Fix your .env file and restart with: npx expo start -c\n');
  process.exit(1);
} else {
  console.log('\n✅ All required variables are present!\n');
  console.log('💡 If variables still not loading, run: npx expo start -c\n');
}
