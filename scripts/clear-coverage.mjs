#!/usr/bin/env node
/**
 * Remove coverage directory so Jest can write fresh reports (avoids Windows lock/UNKNOWN errors).
 * Used by npm run test:coverage.
 */
import { rmSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = join(__dirname, '..');
const coverageDir = join(root, 'coverage');

try {
  rmSync(coverageDir, { recursive: true, force: true });
} catch {
  // Ignore if missing or locked
}
