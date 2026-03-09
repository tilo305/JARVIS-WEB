#!/usr/bin/env node
/**
 * Console Error Checker
 * 
 * Checks for potential console errors in main app files
 * 
 * Usage:
 *   node debug/tools/check-console-errors.js
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '../..');

function log(message, type = 'info') {
  const prefix = {
    info: '•',
    success: '✓',
    warning: '⚠',
    error: '✗',
  }[type] || '•';
  console.log(`${prefix} ${message}`);
}

function checkFile(filePath, description) {
  log(`\nChecking: ${description}`, 'info');
  log(`  Path: ${filePath}`, 'info');
  
  if (!existsSync(filePath)) {
    log(`  ✗ File not found`, 'error');
    return { errors: [], warnings: [] };
  }
  
  const content = readFileSync(filePath, 'utf8');
  const errors = [];
  const warnings = [];
  
  // Check for common error patterns
  const checks = [
    {
      pattern: /console\.error\([^)]*undefined/,
      message: 'Potential undefined reference in console.error',
      type: 'error'
    },
    {
      pattern: /\.length\s*=\s*0/,
      message: 'Array length manipulation (potential issue)',
      type: 'warning'
    },
    {
      pattern: /await\s+[^{]*\{[^}]*keywords[^}]*\}/,
      message: 'Async operation with keywords (check for race conditions)',
      type: 'warning'
    }
  ];
  
  const lines = content.split('\n');
  checks.forEach(check => {
    lines.forEach((line, index) => {
      if (check.pattern.test(line)) {
        const issue = {
          line: index + 1,
          code: line.trim(),
          message: check.message
        };
        if (check.type === 'error') {
          errors.push(issue);
        } else {
          warnings.push(issue);
        }
      }
    });
  });
  
  // Check for syntax issues
  try {
    // Basic syntax check - try to parse as JavaScript
    if (filePath.endsWith('.js')) {
      // Just check if file is readable, don't actually eval
      const hasSyntaxErrors = content.includes('undefined') && 
                              content.includes('validKeywords') && 
                              content.includes('length') &&
                              !content.includes('validKeywords.length');
      if (hasSyntaxErrors) {
        warnings.push({
          line: 0,
          code: 'N/A',
          message: 'Potential undefined access pattern detected'
        });
      }
    }
  } catch {
    // Ignore parse errors for now
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    log(`  ✓ No obvious errors found`, 'success');
  } else {
    if (errors.length > 0) {
      log(`  ✗ Found ${errors.length} potential errors:`, 'error');
      errors.forEach(err => {
        log(`    Line ${err.line}: ${err.message}`, 'error');
        log(`      ${err.code.substring(0, 80)}...`, 'error');
      });
    }
    if (warnings.length > 0) {
      log(`  ⚠ Found ${warnings.length} warnings:`, 'warning');
      warnings.forEach(warn => {
        log(`    Line ${warn.line}: ${warn.message}`, 'warning');
      });
    }
  }
  
  return { errors, warnings };
}

function main() {
  console.log('══════════════════════════════════════════════════════════════════════');
  console.log('  🔍 Console Error Checker');
  console.log('══════════════════════════════════════════════════════════════════════\n');
  
  const files = [
    { path: join(root, 'public/js/app.js'), desc: 'App (main)' },
    { path: join(root, 'public/js/cartesia-audio-bridge.js'), desc: 'Cartesia Audio Bridge' }
  ];
  
  let totalErrors = 0;
  let totalWarnings = 0;
  
  files.forEach(file => {
    const result = checkFile(file.path, file.desc);
    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;
  });
  
  log('\n══════════════════════════════════════════════════════════════════════', 'info');
  log('Summary', 'info');
  log('══════════════════════════════════════════════════════════════════════', 'info');
  log(`Total Errors: ${totalErrors}`, totalErrors > 0 ? 'error' : 'success');
  log(`Total Warnings: ${totalWarnings}`, totalWarnings > 0 ? 'warning' : 'success');
  
  if (totalErrors === 0 && totalWarnings === 0) {
    log('\n✓ No obvious console errors detected in code', 'success');
    log('  Check browser console (F12) for runtime errors', 'info');
  } else {
    log('\n⚠ Review the issues above', 'warning');
    log('  Also check browser console (F12) for runtime errors', 'info');
  }
  
  console.log('\n');
}

main();
