#!/usr/bin/env node
/**
 * .env lives only at project root (server, Vite, and scripts load from there).
 * No copy to public/ or scripts/ — those dirs never need .env.
 * This script is a no-op; kept for compatibility with any docs that mention npm run sync-env.
 */
import { getProjectRoot } from './load-env-everywhere.mjs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
getProjectRoot(__dirname); // ensure module resolves
console.log(' .env is only at project root; no sync needed.');
