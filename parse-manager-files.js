#!/usr/bin/env node
/**
 * Manager Files Parser
 * Comprehensive parser for all manager-related files:
 * - Files with "manager" in their name
 * - Files containing Manager classes or manager-related code
 * - Manager documentation files
 * Extracts manager classes, methods, properties, and usage patterns
 */

import { readFileSync, statSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { fileURLToPath } from 'url';
import { dirname, join, relative } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse JavaScript/TypeScript files for Manager usage
function parseJSFile(content, filePath) {
  const stats = {
    hasManagerImport: false,
    hasManagerClass: false,
    hasManagerExport: false,
    managerImports: [],
    managerClasses: [],
    managerExports: [],
    managerMethods: [],
    managerProperties: [],
    managerInterfaces: [],
    managerTypes: [],
    managerInstances: [],
    managerFunctionCalls: [],
    totalManagerReferences: 0,
    managerPatterns: {
      wakeWordManager: false,
      openWakeWordManager: false,
      audioManager: false,
      streamManager: false,
      otherManagers: []
    }
  };

  // Check for Manager imports
  const importRegex = /import\s+.*?\b(\w*[Mm]anager\w*)\b.*?from\s+['"]([^'"]+)['"]/gi;
  const importMatches = [...content.matchAll(importRegex)];
  if (importMatches.length > 0) {
    stats.hasManagerImport = true;
    stats.managerImports = importMatches.map(m => ({
      import: m[0],
      managerName: m[1],
      source: m[2]
    }));
  }

  // Check for Manager class definitions
  const classRegex = /(?:export\s+)?(?:default\s+)?class\s+(\w*[Mm]anager\w*)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([^{]+))?/g;
  const classMatches = [...content.matchAll(classRegex)];
  if (classMatches.length > 0) {
    stats.hasManagerClass = true;
    stats.managerClasses = classMatches.map(m => ({
      name: m[1],
      extends: m[2] || null,
      implements: m[3] ? m[3].split(',').map(i => i.trim()) : [],
      fullMatch: m[0]
    }));
  }

  // Check for Manager exports
  const exportRegex = /export\s+(?:default\s+)?(?:class|const|let|var|function)\s+(\w*[Mm]anager\w*)/g;
  const exportMatches = [...content.matchAll(exportRegex)];
  if (exportMatches.length > 0) {
    stats.hasManagerExport = true;
    stats.managerExports = exportMatches.map(m => ({
      name: m[1],
      fullMatch: m[0]
    }));
  }

  // Extract Manager methods (methods in Manager classes)
  const methodRegex = /(?:public|private|protected|static)?\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*[:{]/g;
  const methodMatches = [...content.matchAll(methodRegex)];
  const managerClassContext = /class\s+\w*[Mm]anager\w*/;
  let inManagerClass = false;
  let currentManagerClass = null;
  
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (managerClassContext.test(line)) {
      inManagerClass = true;
      const classMatch = line.match(/class\s+(\w*[Mm]anager\w*)/);
      if (classMatch) {
        currentManagerClass = classMatch[1];
      }
    }
    if (inManagerClass && /^\s*}\s*$/.test(line)) {
      // End of class (simplified check)
      inManagerClass = false;
      currentManagerClass = null;
    }
    if (inManagerClass) {
      const methodMatch = line.match(/(?:public|private|protected|static)?\s*(?:async\s+)?(\w+)\s*\(/);
      if (methodMatch && !['constructor', 'get', 'set'].includes(methodMatch[1])) {
        stats.managerMethods.push({
          name: methodMatch[1],
          class: currentManagerClass,
          line: i + 1
        });
      }
    }
  }

  // Extract Manager properties
  const propertyRegex = /(?:public|private|protected|static|readonly)?\s*(?:this\.)?(\w*[Mm]anager\w*)\s*[:=]/g;
  const propertyMatches = [...content.matchAll(propertyRegex)];
  stats.managerProperties = propertyMatches.map(m => ({
    name: m[1],
    context: content.substring(Math.max(0, m.index - 30), m.index + 50).trim()
  }));

  // Extract Manager interfaces
  const interfaceRegex = /(?:export\s+)?(?:default\s+)?interface\s+(\w*[Mm]anager\w*)/g;
  const interfaceMatches = [...content.matchAll(interfaceRegex)];
  stats.managerInterfaces = interfaceMatches.map(m => ({
    name: m[1],
    fullMatch: m[0]
  }));

  // Extract Manager types
  const typeRegex = /(?:export\s+)?(?:default\s+)?type\s+(\w*[Mm]anager\w*)\s*=/g;
  const typeMatches = [...content.matchAll(typeRegex)];
  stats.managerTypes = typeMatches.map(m => ({
    name: m[1],
    fullMatch: m[0]
  }));

  // Extract Manager instances (new Manager())
  const instanceRegex = /new\s+(\w*[Mm]anager\w*)\s*\(/g;
  const instanceMatches = [...content.matchAll(instanceRegex)];
  stats.managerInstances = instanceMatches.map(m => ({
    className: m[1],
    context: content.substring(Math.max(0, m.index - 20), m.index + 50).trim()
  }));

  // Extract function calls on manager instances
  const functionCallRegex = /(\w*[Mm]anager\w*|manager)\.(\w+)\s*\(/g;
  const functionCallMatches = [...content.matchAll(functionCallRegex)];
  stats.managerFunctionCalls = functionCallMatches.map(m => ({
    instance: m[1],
    method: m[2]
  }));

  // Count total Manager references (case-insensitive)
  const managerRefRegex = /\b\w*[Mm]anager\w*\b/gi;
  stats.totalManagerReferences = (content.match(managerRefRegex) || []).length;

  // Detect specific manager patterns
  if (/WakeWordManager|wakeWordManager|wake-word-manager/i.test(content)) {
    stats.managerPatterns.wakeWordManager = true;
  }
  if (/OpenWakeWordManager|openWakeWordManager|openwakeword-manager/i.test(content)) {
    stats.managerPatterns.openWakeWordManager = true;
  }
  if (/AudioManager|audioManager|audio-manager/i.test(content)) {
    stats.managerPatterns.audioManager = true;
  }
  if (/StreamManager|streamManager|stream-manager/i.test(content)) {
    stats.managerPatterns.streamManager = true;
  }

  // Extract other manager names
  const otherManagerRegex = /(\w*[Mm]anager\w*)/g;
  const otherMatches = [...content.matchAll(otherManagerRegex)];
  const knownManagers = ['WakeWordManager', 'OpenWakeWordManager', 'AudioManager', 'StreamManager', 'Manager'];
  otherMatches.forEach(m => {
    const managerName = m[1];
    if (!knownManagers.includes(managerName) && !stats.managerPatterns.otherManagers.includes(managerName)) {
      stats.managerPatterns.otherManagers.push(managerName);
    }
  });

  return stats;
}

// Parse Markdown/documentation files for Manager information
function parseDocFile(content) {
  const stats = {
    managerSections: [],
    managerCodeBlocks: 0,
    managerMentions: 0,
    managerFiles: [],
    managerMethods: [],
    managerClasses: []
  };

  // Extract Manager sections
  const sectionRegex = /^#{1,3}\s+.*[Mm]anager.*$/gm;
  const sections = [...content.matchAll(sectionRegex)];
  stats.managerSections = sections.map(s => s[0].trim());

  // Count code blocks mentioning Manager
  const codeBlockRegex = /```[\s\S]*?\b\w*[Mm]anager\w*\b[\s\S]*?```/gi;
  stats.managerCodeBlocks = (content.match(codeBlockRegex) || []).length;

  // Count Manager mentions
  stats.managerMentions = (content.match(/\b\w*[Mm]anager\w*\b/gi) || []).length;

  // Extract manager file references
  const fileRegex = /([\w\-/]+manager[\w\-/]*\.(?:js|ts|mjs|cjs))/gi;
  const fileMatches = [...content.matchAll(fileRegex)];
  stats.managerFiles = [...new Set(fileMatches.map(m => m[1]))];

  // Extract manager method mentions
  const methodRegex = /(\w*[Mm]anager\w*)\.(\w+)\s*\(/g;
  const methodMatches = [...content.matchAll(methodRegex)];
  stats.managerMethods = [...new Set(methodMatches.map(m => `${m[1]}.${m[2]}`))];

  // Extract manager class mentions
  const classRegex = /class\s+(\w*[Mm]anager\w*)/g;
  const classMatches = [...content.matchAll(classRegex)];
  stats.managerClasses = [...new Set(classMatches.map(m => m[1]))];

  return stats;
}

async function parseAllManagerFiles() {
  console.log('🔍 Searching for manager files...\n');

  // Find all files that mention "manager" in name or content
  const allFiles = await glob('**/*', {
    ignore: ['node_modules/**', 'dist/**', 'coverage/**', 'dist-public/**', '.git/**', '**/parse-*.js', '**/parse-*.mjs'],
    cwd: __dirname
  });

  // Filter files that contain manager references or have manager in filename
  const managerFiles = [];
  for (const file of allFiles) {
    try {
      // Check if filename contains "manager"
      if (/\bmanager\b/i.test(file)) {
        managerFiles.push(file);
        continue;
      }
      
      // Check file content for manager references
      const content = readFileSync(file, 'utf-8');
      if (/\b\w*[Mm]anager\w*\b/.test(content)) {
        managerFiles.push(file);
      }
    } catch (error) {
      // Skip files we can't read (binary files, etc.)
    }
  }

  console.log(`Found ${managerFiles.length} files with manager references:\n`);

  const results = [];
  const fileTypes = {
    js: [],
    ts: [],
    md: [],
    json: [],
    html: [],
    other: []
  };

  for (const file of managerFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      const stats = statSync(file);
      const sizeKB = (stats.size / 1024).toFixed(2);
      // Get file extension, handling multiple dots (e.g., .test.js, .config.cjs)
      const parts = file.split('.');
      const ext = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'other';

      let parsed = {};
      let fileType = 'other';

      // Handle JavaScript variants: .js, .mjs, .cjs, .jsx
      if (ext === 'js' || ext === 'mjs' || ext === 'cjs' || ext === 'jsx') {
        fileType = 'js';
        parsed = parseJSFile(content, file);
        fileTypes.js.push(file);
      } else if (ext === 'ts' || ext === 'tsx') {
        // Handle TypeScript variants: .ts, .tsx
        fileType = 'ts';
        parsed = parseJSFile(content, file);
        fileTypes.ts.push(file);
      } else if (ext === 'md') {
        fileType = 'md';
        parsed = parseDocFile(content);
        fileTypes.md.push(file);
      } else if (ext === 'json') {
        fileType = 'json';
        parsed = { type: 'json', hasManager: true };
        fileTypes.json.push(file);
      } else if (ext === 'html') {
        fileType = 'html';
        parsed = { type: 'html', hasManager: true };
        fileTypes.html.push(file);
      } else {
        parsed = { type: ext, hasManager: true };
        fileTypes.other.push(file);
      }

      results.push({
        file: relative(__dirname, file),
        fullPath: file,
        valid: true,
        sizeKB: parseFloat(sizeKB),
        type: fileType,
        parsed
      });

      console.log(`✓ ${relative(__dirname, file)}`);
      console.log(`  Size: ${sizeKB} KB`);
      console.log(`  Type: ${fileType.toUpperCase()}`);

      if (fileType === 'js' || fileType === 'ts') {
        if (parsed.hasManagerClass) {
          console.log(`  Manager Classes: ${parsed.managerClasses.map(c => c.name).join(', ')}`);
        }
        if (parsed.hasManagerImport) {
          console.log(`  Manager Imports: ${parsed.managerImports.length}`);
          parsed.managerImports.forEach(imp => {
            console.log(`    - ${imp.managerName} from "${imp.source}"`);
          });
        }
        if (parsed.hasManagerExport) {
          console.log(`  Manager Exports: ${parsed.managerExports.map(e => e.name).join(', ')}`);
        }
        if (parsed.managerMethods.length > 0) {
          console.log(`  Manager Methods: ${parsed.managerMethods.length}`);
          const uniqueMethods = [...new Set(parsed.managerMethods.map(m => m.name))];
          console.log(`    - ${uniqueMethods.slice(0, 10).join(', ')}${uniqueMethods.length > 10 ? '...' : ''}`);
        }
        if (parsed.managerInstances.length > 0) {
          console.log(`  Manager Instances: ${parsed.managerInstances.length}`);
        }
        if (parsed.managerInterfaces.length > 0) {
          console.log(`  Manager Interfaces: ${parsed.managerInterfaces.map(i => i.name).join(', ')}`);
        }
        if (parsed.managerTypes.length > 0) {
          console.log(`  Manager Types: ${parsed.managerTypes.map(t => t.name).join(', ')}`);
        }
        const patterns = [];
        if (parsed.managerPatterns.wakeWordManager) patterns.push('WakeWordManager');
        if (parsed.managerPatterns.openWakeWordManager) patterns.push('OpenWakeWordManager');
        if (parsed.managerPatterns.audioManager) patterns.push('AudioManager');
        if (parsed.managerPatterns.streamManager) patterns.push('StreamManager');
        if (patterns.length > 0) {
          console.log(`  Manager Patterns: ${patterns.join(', ')}`);
        }
        console.log(`  Total Manager references: ${parsed.totalManagerReferences}`);
      } else if (fileType === 'md') {
        if (parsed.managerSections.length > 0) {
          console.log(`  Manager Sections: ${parsed.managerSections.length}`);
          parsed.managerSections.slice(0, 3).forEach(sec => {
            console.log(`    - ${sec}`);
          });
        }
        if (parsed.managerCodeBlocks > 0) {
          console.log(`  Manager Code blocks: ${parsed.managerCodeBlocks}`);
        }
        if (parsed.managerFiles.length > 0) {
          console.log(`  Manager Files mentioned: ${parsed.managerFiles.join(', ')}`);
        }
        if (parsed.managerClasses.length > 0) {
          console.log(`  Manager Classes mentioned: ${parsed.managerClasses.join(', ')}`);
        }
        console.log(`  Total Manager mentions: ${parsed.managerMentions}`);
      }

      console.log('');
    } catch (error) {
      results.push({
        file: relative(__dirname, file),
        fullPath: file,
        valid: false,
        error: error.message
      });
      console.log(`✗ ${relative(__dirname, file)}`);
      console.log(`  Error: ${error.message}\n`);
    }
  }

  // Summary
  console.log('\n=== Summary ===');
  const valid = results.filter(r => r.valid).length;
  const invalid = results.filter(r => !r.valid).length;
  const totalSize = results.reduce((sum, r) => sum + (r.sizeKB || 0), 0);

  console.log(`Total files: ${results.length}`);
  console.log(`Valid: ${valid}`);
  console.log(`Invalid: ${invalid}`);
  console.log(`Total size: ${totalSize.toFixed(2)} KB`);

  console.log('\n=== File Types ===');
  console.log(`JavaScript/ESM: ${fileTypes.js.length}`);
  console.log(`TypeScript: ${fileTypes.ts.length}`);
  console.log(`Markdown: ${fileTypes.md.length}`);
  console.log(`JSON: ${fileTypes.json.length}`);
  console.log(`HTML: ${fileTypes.html.length}`);
  console.log(`Other: ${fileTypes.other.length}`);

  // Manager-specific statistics
  const jsFiles = results.filter(r => (r.type === 'js' || r.type === 'ts') && r.valid);
  const totalManagerRefs = jsFiles.reduce((sum, r) => sum + (r.parsed?.totalManagerReferences || 0), 0);
  const filesWithClasses = jsFiles.filter(r => r.parsed?.hasManagerClass).length;
  const filesWithImports = jsFiles.filter(r => r.parsed?.hasManagerImport).length;
  const filesWithExports = jsFiles.filter(r => r.parsed?.hasManagerExport).length;
  const totalManagerClasses = jsFiles.reduce((sum, r) => sum + (r.parsed?.managerClasses?.length || 0), 0);
  const totalManagerMethods = jsFiles.reduce((sum, r) => sum + (r.parsed?.managerMethods?.length || 0), 0);

  console.log('\n=== Manager Statistics ===');
  console.log(`Total Manager references in code: ${totalManagerRefs}`);
  console.log(`Files with Manager classes: ${filesWithClasses}`);
  console.log(`Files with Manager imports: ${filesWithImports}`);
  console.log(`Files with Manager exports: ${filesWithExports}`);
  console.log(`Total Manager classes: ${totalManagerClasses}`);
  console.log(`Total Manager methods: ${totalManagerMethods}`);

  // Extract all unique Manager classes
  const allClasses = new Set();
  jsFiles.forEach(r => {
    if (r.parsed?.managerClasses) {
      r.parsed.managerClasses.forEach(c => allClasses.add(c.name));
    }
  });
  if (allClasses.size > 0) {
    console.log(`\nManager Classes found: ${Array.from(allClasses).join(', ')}`);
  }

  // Extract all unique Manager methods
  const allMethods = new Set();
  jsFiles.forEach(r => {
    if (r.parsed?.managerMethods) {
      r.parsed.managerMethods.forEach(m => allMethods.add(m.name));
    }
  });
  if (allMethods.size > 0) {
    console.log(`\nManager Methods found: ${Array.from(allMethods).slice(0, 20).join(', ')}${allMethods.size > 20 ? '...' : ''}`);
  }

  // Manager patterns
  const wakeWordManagerFiles = jsFiles.filter(r => r.parsed?.managerPatterns?.wakeWordManager).length;
  const openWakeWordManagerFiles = jsFiles.filter(r => r.parsed?.managerPatterns?.openWakeWordManager).length;
  const audioManagerFiles = jsFiles.filter(r => r.parsed?.managerPatterns?.audioManager).length;
  const streamManagerFiles = jsFiles.filter(r => r.parsed?.managerPatterns?.streamManager).length;

  console.log('\n=== Manager Patterns ===');
  console.log(`Files with WakeWordManager: ${wakeWordManagerFiles}`);
  console.log(`Files with OpenWakeWordManager: ${openWakeWordManagerFiles}`);
  console.log(`Files with AudioManager: ${audioManagerFiles}`);
  console.log(`Files with StreamManager: ${streamManagerFiles}`);

  if (invalid > 0) {
    console.log('\nInvalid files:');
    results.filter(r => !r.valid).forEach(r => {
      console.log(`  - ${r.file}: ${r.error}`);
    });
  }

  // Key Manager files
  console.log('\n=== Key Manager Files ===');
  const keyFiles = results.filter(r => 
    r.valid && (
      r.file.includes('manager') ||
      r.parsed?.hasManagerClass ||
      r.parsed?.hasManagerExport
    )
  );
  keyFiles.forEach(r => {
    const managerInfo = [];
    if (r.parsed?.managerClasses?.length > 0) {
      managerInfo.push(`Classes: ${r.parsed.managerClasses.map(c => c.name).join(', ')}`);
    }
    if (r.parsed?.hasManagerExport) {
      managerInfo.push(`Exports: ${r.parsed.managerExports.map(e => e.name).join(', ')}`);
    }
    console.log(`  - ${r.file} (${r.sizeKB} KB)${managerInfo.length > 0 ? ` - ${managerInfo.join(', ')}` : ''}`);
  });

  // Write results to JSON file
  const outputFile = join(__dirname, 'manager-parse-results.json');
  writeFileSync(outputFile, JSON.stringify({
    summary: {
      totalFiles: results.length,
      validFiles: valid,
      invalidFiles: invalid,
      totalSizeKB: totalSize.toFixed(2),
      fileTypes,
      statistics: {
        totalManagerReferences: totalManagerRefs,
        filesWithManagerClasses: filesWithClasses,
        filesWithManagerImports: filesWithImports,
        filesWithManagerExports: filesWithExports,
        totalManagerClasses,
        totalManagerMethods,
        managerPatterns: {
          wakeWordManagerFiles,
          openWakeWordManagerFiles,
          audioManagerFiles,
          streamManagerFiles
        }
      }
    },
    files: results
  }, null, 2), 'utf-8');

  console.log(`\n✓ Results saved to: ${outputFile}`);
}

parseAllManagerFiles().catch(console.error);
