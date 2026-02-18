/**
 * Test script to verify .env file is loaded correctly by all components
 */
import { loadEnvEverywhere, getProjectRoot } from './load-env-everywhere.mjs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = getProjectRoot(__dirname);

console.log('🧪 Testing .env file loading...\n');
console.log('Project root:', rootDir);
console.log('');

// Test 1: Load .env using loadEnvEverywhere
console.log('Test 1: Loading .env using loadEnvEverywhere...');
loadEnvEverywhere(rootDir);

const requiredVars = [
  'CARTESIA_API_KEY',
  'VITE_CARTESIA_API_KEY',
  'CARTESIA_VOICE_ID',
  'VITE_CARTESIA_VOICE_ID'
];

let allPassed = true;

for (const varName of requiredVars) {
  const value = process.env[varName];
  if (value) {
    const preview = varName.includes('API_KEY') 
      ? `${value.substring(0, 15)}...` 
      : value;
    console.log(`  ✅ ${varName}: ${preview}`);
  } else {
    console.log(`  ❌ ${varName}: NOT FOUND`);
    allPassed = false;
  }
}

console.log('');

// Test 2: Verify Vite can load it
console.log('Test 2: Testing Vite config loading...');
try {
  const { loadEnv } = await import('vite');
  const env = loadEnv('development', rootDir, '');
  const viteApiKey = env.VITE_CARTESIA_API_KEY || env.CARTESIA_API_KEY;
  const viteVoiceId = env.VITE_CARTESIA_VOICE_ID || env.CARTESIA_VOICE_ID;
  
  if (viteApiKey) {
    console.log(`  ✅ Vite can read API_KEY: ${viteApiKey.substring(0, 15)}...`);
  } else {
    console.log(`  ❌ Vite cannot read API_KEY`);
    allPassed = false;
  }
  
  if (viteVoiceId) {
    console.log(`  ✅ Vite can read VOICE_ID: ${viteVoiceId}`);
  } else {
    console.log(`  ❌ Vite cannot read VOICE_ID`);
    allPassed = false;
  }
} catch (err) {
  console.log(`  ⚠️  Vite import failed (this is OK if vite is not installed): ${err.message}`);
}

console.log('');

// Test 3: Check .env file exists
console.log('Test 3: Checking .env file exists...');
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const envPath = join(rootDir, '.env');
if (existsSync(envPath)) {
  console.log(`  ✅ .env file exists at: ${envPath}`);
} else {
  console.log(`  ❌ .env file NOT FOUND at: ${envPath}`);
  allPassed = false;
}

console.log('');

// Summary
if (allPassed) {
  console.log('✅ All tests passed! .env file is loaded correctly.');
  process.exit(0);
} else {
  console.log('❌ Some tests failed. Please check your .env file.');
  process.exit(1);
}
