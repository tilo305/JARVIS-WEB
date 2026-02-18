/**
 * Load .env from project root only (no public/ or scripts/ — those never need it).
 */
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Get project root (directory containing package.json).
 * @param {string} [fromDir] - Start directory (default: scripts folder dirname)
 * @returns {string} Absolute path to project root
 */
export function getProjectRoot(fromDir = __dirname) {
  let dir = fromDir;
  while (dir && dir !== join(dir, '..')) {
    if (existsSync(join(dir, 'package.json'))) return dir;
    dir = join(dir, '..');
  }
  return join(__dirname, '..');
}

/** Paths to try for .env (root only). */
export const ENV_SEARCH_PATHS = (root) => [join(root, '.env')];

/**
 * Load .env from project root only (.env then .env.local).
 * @param {string} [root] - Project root (default: getProjectRoot())
 */
export function loadEnvEverywhere(root = getProjectRoot()) {
  const paths = [join(root, '.env'), join(root, '.env.local')];
  for (const p of paths) {
    if (existsSync(p)) dotenv.config({ path: p });
  }
}

/**
 * Return the path to root .env if it exists (for debug tools that read from disk).
 * @param {string} [root] - Project root
 * @returns {string|null} Path to .env or null
 */
export function getFirstEnvPath(root = getProjectRoot()) {
  const p = join(root, '.env');
  return existsSync(p) ? p : null;
}
