/**
 * Validate CORS handler integration: cors-handler.js exists, exports required functions,
 * and app.js imports them. Per zEn DeBuGgEr.md.
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../..');

const REQUIRED_EXPORTS = ['detectCORSError', 'diagnoseCORS', 'testCORSPreflight', 'getCORSConfigurationGuide'];

const errors = [];

// 1. cors-handler.js exists
const corsPath = join(rootDir, 'public/js/cors-handler.js');
if (!existsSync(corsPath)) {
  errors.push('public/js/cors-handler.js: File not found');
} else {
  const corsContent = readFileSync(corsPath, 'utf8');
  for (const name of REQUIRED_EXPORTS) {
    const exportPattern = new RegExp(`export\\s+(?:async\\s+)?function\\s+${name}|export\\s+\\{[^}]*\\b${name}\\b`);
    if (!exportPattern.test(corsContent)) {
      errors.push(`cors-handler.js: Missing export "${name}"`);
    }
  }
}

// 2. app.js imports from cors-handler
const appPath = join(rootDir, 'public/js/app.js');
if (!existsSync(appPath)) {
  errors.push('public/js/app.js: File not found');
} else {
  const appContent = readFileSync(appPath, 'utf8');
  if (!appContent.includes("from './cors-handler.js'") && !appContent.includes('from "./cors-handler.js"')) {
    errors.push('app.js: Missing import from cors-handler.js');
  }
  for (const name of REQUIRED_EXPORTS) {
    if (!appContent.includes(name)) {
      errors.push(`app.js: cors-handler export "${name}" not used`);
    }
  }
}

if (errors.length > 0) {
  console.error('CORS handler validation FAILED:\n');
  errors.forEach((e) => console.error('  ❌', e));
  process.exit(1);
}

console.log('✓ CORS handler integration valid (cors-handler.js exports, app.js imports)');
process.exit(0);
