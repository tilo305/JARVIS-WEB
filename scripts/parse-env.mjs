/**
 * .env File Parser Utility
 * 
 * Parses .env files and returns structured key-value pairs.
 * Handles:
 * - Comments (# and //)
 * - Empty lines
 * - Quoted values (single, double, backticks)
 * - Multiline values
 * - Variable expansion (${VAR} or $VAR)
 * - Whitespace trimming
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { getProjectRoot } from './load-env-everywhere.mjs';

/**
 * Parse a .env file content string into key-value pairs
 * @param {string} content - Raw .env file content
 * @param {Object} existingEnv - Existing environment variables for expansion (default: process.env)
 * @returns {Object} Parsed environment variables
 */
export function parseEnvContent(content, existingEnv = process.env) {
  const result = {};
  const lines = content.split(/\r?\n/);
  let currentKey = null;
  let currentValue = [];
  let inQuotes = false;
  let quoteChar = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const originalLine = line;

    // Skip empty lines
    if (!line.trim()) {
      continue;
    }

    // Remove inline comments (but preserve quoted strings and URLs)
    // Only remove # or // that appear after whitespace or at start, not in URLs
    // First, protect quoted strings
    const quotedStrings = [];
    line = line.replace(/(["'`])(?:(?=(\\?))\2.)*?\1/g, (match) => {
      const placeholder = `__QUOTED_${quotedStrings.length}__`;
      quotedStrings.push(match);
      return placeholder;
    });
    
    // Remove comments (# or //) that are not part of URLs
    // Comments must be preceded by whitespace or start of line
    line = line.replace(/(^|\s+)(#|\/\/).*$/, '$1');
    
    // Restore quoted strings
    line = line.replace(/__QUOTED_(\d+)__/g, (_, idx) => quotedStrings[parseInt(idx)]);

    // Remove leading/trailing whitespace
    line = line.trim();

    // Skip lines that are only comments
    if (!line || line.startsWith('#') || line.startsWith('//')) {
      continue;
    }

    // Handle continuation (if previous line ended with \)
    if (currentKey && !inQuotes) {
      if (originalLine.trim().endsWith('\\')) {
        currentValue.push(originalLine.trim().slice(0, -1));
        continue;
      } else {
        // Finalize previous key-value
        const value = currentValue.join('\n').trim();
        result[currentKey] = expandVariables(value, existingEnv);
        currentKey = null;
        currentValue = [];
      }
    }

    // Parse KEY=VALUE
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (match) {
      const [, key, value] = match;
      
      // Check if value starts with a quote
      const trimmedValue = value.trim();
      if (trimmedValue.startsWith('"') || trimmedValue.startsWith("'") || trimmedValue.startsWith('`')) {
        quoteChar = trimmedValue[0];
        inQuotes = true;
        let quotedValue = trimmedValue.slice(1);
        
        // Check if quote is closed on same line
        if (quotedValue.endsWith(quoteChar) && !quotedValue.slice(0, -1).endsWith('\\')) {
          quotedValue = quotedValue.slice(0, -1);
          inQuotes = false;
          result[key] = expandVariables(unescapeQuotes(quotedValue, quoteChar), existingEnv);
          currentKey = null;
        } else {
          // Multiline quoted value
          currentKey = key;
          currentValue = [quotedValue];
        }
      } else {
        // Unquoted value
        if (trimmedValue.endsWith('\\')) {
          currentKey = key;
          currentValue = [trimmedValue.slice(0, -1)];
        } else {
          result[key] = expandVariables(trimmedValue, existingEnv);
        }
      }
    }
  }

  // Handle final key-value if still in progress
  if (currentKey) {
    const value = currentValue.join('\n').trim();
    result[currentKey] = expandVariables(value, existingEnv);
  }

  return result;
}

/**
 * Expand variables in a string (${VAR} or $VAR)
 * @param {string} value - String that may contain variable references
 * @param {Object} env - Environment variables to use for expansion
 * @returns {string} Expanded string
 */
function expandVariables(value, env) {
  return value.replace(/\$\{([^}]+)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g, (match, braced, unbraced) => {
    const varName = braced || unbraced;
    return env[varName] !== undefined ? env[varName] : match;
  });
}

/**
 * Unescape quotes and special characters in quoted strings
 * @param {string} value - Quoted string value
 * @param {string} quoteChar - The quote character used
 * @returns {string} Unescaped string
 */
function unescapeQuotes(value, quoteChar) {
  // Remove escaped quotes and newlines
  return value
    .replace(new RegExp(`\\\\${quoteChar}`, 'g'), quoteChar)
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\');
}

/**
 * Parse a .env file from disk
 * @param {string} filePath - Path to .env file
 * @param {Object} existingEnv - Existing environment variables for expansion
 * @returns {Object} Parsed environment variables
 * @throws {Error} If file doesn't exist or can't be read
 */
export function parseEnvFile(filePath, existingEnv = process.env) {
  if (!existsSync(filePath)) {
    throw new Error(`.env file not found: ${filePath}`);
  }

  try {
    const content = readFileSync(filePath, 'utf8');
    return parseEnvContent(content, existingEnv);
  } catch (error) {
    throw new Error(`Failed to read .env file: ${error.message}`);
  }
}

/**
 * Parse .env file from project root
 * @param {string} [root] - Project root directory (default: auto-detect)
 * @param {Object} existingEnv - Existing environment variables for expansion
 * @returns {Object} Parsed environment variables
 */
export function parseProjectEnv(root, existingEnv = process.env) {
  const projectRoot = root || getProjectRoot();
  const envPath = join(projectRoot, '.env');
  return parseEnvFile(envPath, existingEnv);
}

/**
 * Parse multiple .env files (e.g., .env, .env.local) and merge them
 * Later files override earlier ones
 * @param {string[]} filePaths - Array of .env file paths
 * @param {Object} existingEnv - Existing environment variables for expansion
 * @returns {Object} Merged parsed environment variables
 */
export function parseMultipleEnvFiles(filePaths, existingEnv = process.env) {
  const result = {};
  
  for (const filePath of filePaths) {
    if (existsSync(filePath)) {
      const parsed = parseEnvFile(filePath, existingEnv);
      Object.assign(result, parsed);
      // Update existingEnv for next file's variable expansion
      Object.assign(existingEnv, parsed);
    }
  }
  
  return result;
}

/**
 * CLI usage: node scripts/parse-env.mjs [file-path]
 */
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// Check if this module is being run directly
const currentFile = fileURLToPath(import.meta.url);
const mainFile = process.argv[1] ? resolve(process.argv[1]) : null;
const isMainModule = mainFile && (currentFile === mainFile || currentFile.replace(/\\/g, '/') === mainFile.replace(/\\/g, '/'));

if (isMainModule) {
  const filePath = process.argv[2];
  
  try {
    let parsed;
    if (filePath) {
      parsed = parseEnvFile(filePath);
    } else {
      parsed = parseProjectEnv();
    }
    
    console.log(JSON.stringify(parsed, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}
