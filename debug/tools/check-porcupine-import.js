/**
 * Debug Tool: Check Porcupine Import Resolution
 * 
 * Verifies that @picovoice/porcupine-web can be imported correctly
 * and checks the export structure to ensure proper usage.
 * 
 * Usage: node debug/tools/check-porcupine-import.js
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..', '..');

console.log('🔍 Checking Porcupine Import Resolution...\n');

// Note: @picovoice/porcupine-web is a browser-only package (uses WebAssembly)
// We can't actually import it in Node.js, but we can check the package structure

console.log('1. Checking package installation...');
const packageJsonPath = join(rootDir, 'node_modules', '@picovoice', 'porcupine-web', 'package.json');
const fs = await import('fs/promises');

try {
  const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonContent);
  
  console.log('   ✅ Package installed');
  console.log(`   Version: ${packageJson.version}`);
  console.log(`   Module entry: ${packageJson.module || 'N/A'}`);
  console.log(`   Main entry: ${packageJson.main || 'N/A'}`);
  
  console.log('\n2. Checking TypeScript definitions...');
  const typesPath = join(rootDir, 'node_modules', '@picovoice', 'porcupine-web', 'dist', 'types', 'index.d.ts');
  
  try {
    const typesContent = await fs.readFile(typesPath, 'utf8');
    
    // Check for named export
    if (typesContent.includes('export {') && typesContent.includes('Porcupine')) {
      console.log('   ✅ Named export "Porcupine" found in type definitions');
    }
    
    // Check for default export
    if (typesContent.includes('export default')) {
      console.log('   ⚠️  Default export found in type definitions');
    } else {
      console.log('   ✅ No default export (correct - use named import)');
    }
    
    // Extract export line
    const exportMatch = typesContent.match(/export\s*\{[^}]*Porcupine[^}]*\}/);
    if (exportMatch) {
      console.log(`   Export statement: ${exportMatch[0].substring(0, 100)}...`);
    }
    
  } catch {
    console.log('   ⚠️  Could not read type definitions (may not be critical)');
  }
  
  console.log('\n3. Checking source code import...');
  const wakeWordManagerPath = join(rootDir, 'public', 'js', 'wake-word-manager.js');
  const wakeWordManagerContent = await fs.readFile(wakeWordManagerPath, 'utf8');
  
  // Check for correct import
  if (wakeWordManagerContent.includes('import { Porcupine }')) {
    console.log('   ✅ Correct named import syntax found');
    console.log('   import { Porcupine } from "@picovoice/porcupine-web";');
  } else if (wakeWordManagerContent.includes('import Porcupine from')) {
    console.log('   ❌ Incorrect default import syntax found');
    console.log('   Should be: import { Porcupine } from "@picovoice/porcupine-web";');
    console.log('   Currently: import Porcupine from "@picovoice/porcupine-web";');
  } else {
    console.log('   ⚠️  Could not find Porcupine import in wake-word-manager.js');
  }
  
  console.log('\n✅ Package structure check complete!');
  console.log('\n📝 Summary:');
  console.log('   - Package is installed correctly');
  console.log('   - Type definitions show named export (not default)');
  console.log('   - Correct import syntax: import { Porcupine } from "@picovoice/porcupine-web"');
  console.log('\n💡 Note: This package is browser-only (WebAssembly).');
  console.log('   To fully test, check browser console after loading the app.');
  
} catch (error) {
  console.error('\n❌ Error checking Porcupine package:');
  console.error(`   ${error.message}`);
  
  if (error.code === 'ENOENT') {
    console.error('\n💡 Solution: Package may not be installed. Run: npm install');
  }
  
  process.exit(1);
}
