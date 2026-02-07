import { readFileSync, statSync } from 'fs';
import { glob } from 'glob';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse JavaScript/TypeScript files for VAD usage
function parseJSFile(content, filePath) {
  const stats = {
    hasVADImport: false,
    hasVADConfig: false,
    hasMicVAD: false,
    vadImports: [],
    vadConfigReferences: [],
    vadMethods: [],
    vadProperties: [],
    vadEvents: [],
    vadOptions: {},
    totalVADReferences: 0,
    vadFunctionCalls: [],
    vadClassUsage: []
  };

  // Check for VAD imports
  const importRegex = /import\s+.*?\b(vad|VAD|MicVAD)\b.*?from\s+['"]([^'"]+)['"]/gi;
  const importMatches = [...content.matchAll(importRegex)];
  if (importMatches.length > 0) {
    stats.hasVADImport = true;
    stats.vadImports = importMatches.map(m => ({
      import: m[0],
      source: m[2]
    }));
  }

  // Check for VAD_CONFIG
  if (/VAD_CONFIG|vad-config/i.test(content)) {
    stats.hasVADConfig = true;
    const configMatches = [...content.matchAll(/VAD_CONFIG\s*[\.\[]/g)];
    stats.vadConfigReferences = configMatches.map(m => {
      const line = content.substring(m.index, m.index + 100);
      return line.trim();
    });
  }

  // Check for MicVAD usage
  if (/MicVAD/i.test(content)) {
    stats.hasMicVAD = true;
    const micVADMatches = [...content.matchAll(/MicVAD\.(new|start|pause|destroy|stop)/gi)];
    stats.vadMethods = [...new Set(micVADMatches.map(m => m[1].toLowerCase()))];
  }

  // Extract VAD property access
  const vadPropertyRegex = /\.vad\s*[\.\[]/g;
  const vadPropertyMatches = [...content.matchAll(vadPropertyRegex)];
  stats.vadProperties = vadPropertyMatches.map(m => {
    const line = content.substring(Math.max(0, m.index - 20), m.index + 50);
    return line.trim();
  });

  // Extract VAD event handlers
  const vadEventRegex = /(onSpeechStart|onSpeechEnd|onVADMisfire|onVADStateChange)/gi;
  const vadEventMatches = [...content.matchAll(vadEventRegex)];
  stats.vadEvents = [...new Set(vadEventMatches.map(m => m[1]))];

  // Extract VAD options/configuration
  const vadOptionsRegex = /vadOptions\s*[:=]\s*\{[\s\S]*?\}/g;
  const vadOptionsMatches = [...content.matchAll(vadOptionsRegex)];
  if (vadOptionsMatches.length > 0) {
    vadOptionsMatches.forEach(match => {
      const optionsStr = match[0];
      // Extract key-value pairs
      const keyValueRegex = /(\w+)\s*:\s*([^,}\n]+)/g;
      const kvMatches = [...optionsStr.matchAll(keyValueRegex)];
      kvMatches.forEach(kv => {
        stats.vadOptions[kv[1]] = kv[2].trim();
      });
    });
  }

  // Count total VAD references (case-insensitive)
  const vadRefRegex = /\bvad\b/gi;
  stats.totalVADReferences = (content.match(vadRefRegex) || []).length;

  // Extract function calls involving VAD
  const vadFunctionRegex = /(\w+)\s*\([^)]*\bvad\b[^)]*\)/gi;
  const vadFunctionMatches = [...content.matchAll(vadFunctionRegex)];
  stats.vadFunctionCalls = vadFunctionMatches.map(m => m[1]);

  // Extract class usage
  if (/class\s+\w+.*\bvad\b/i.test(content) || /\bvad\b.*class/i.test(content)) {
    const classRegex = /class\s+(\w+)/g;
    const classMatches = [...content.matchAll(classRegex)];
    stats.vadClassUsage = classMatches.map(m => m[1]);
  }

  return stats;
}

// Parse Markdown/documentation files for VAD information
function parseDocFile(content) {
  const stats = {
    vadSections: [],
    vadConfigMentions: 0,
    vadCodeBlocks: 0,
    vadFeatures: [],
    vadParameters: []
  };

  // Extract VAD sections
  const sectionRegex = /^#{1,3}\s+.*[Vv]AD.*$/gm;
  const sections = [...content.matchAll(sectionRegex)];
  stats.vadSections = sections.map(s => s[0].trim());

  // Count VAD config mentions
  stats.vadConfigMentions = (content.match(/VAD_CONFIG|vad-config/gi) || []).length;

  // Count code blocks mentioning VAD
  const codeBlockRegex = /```[\s\S]*?\bvad\b[\s\S]*?```/gi;
  stats.vadCodeBlocks = (content.match(codeBlockRegex) || []).length;

  // Extract VAD features/parameters from documentation
  const featureRegex = /(redemptionMs|preSpeechPadMs|minSpeechMs|positiveSpeechThreshold|negativeSpeechThreshold|silenceAfterSpeechToStopMicMs|maxListeningMs)/gi;
  const features = [...content.matchAll(featureRegex)];
  stats.vadFeatures = [...new Set(features.map(f => f[1]))];

  // Extract parameter descriptions
  const paramRegex = /(\w+)\s*[:=]\s*([^\n]+)/g;
  const params = [...content.matchAll(paramRegex)];
  stats.vadParameters = params
    .filter(p => /vad|speech|silence|threshold/i.test(p[1] + p[2]))
    .map(p => ({ param: p[1], value: p[2].trim() }));

  return stats;
}

async function parseAllVadFiles() {
  // Find all files that mention VAD
  const allFiles = await glob('**/*', {
    ignore: ['node_modules/**', 'dist/**', 'coverage/**', 'dist-public/**', '.git/**'],
    cwd: __dirname
  });

  // Filter files that contain VAD references
  const vadFiles = [];
  for (const file of allFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      if (/\bvad\b/i.test(content)) {
        vadFiles.push(file);
      }
    } catch (error) {
      // Skip files we can't read
    }
  }

  console.log(`Found ${vadFiles.length} files with VAD references:\n`);

  const results = [];
  const fileTypes = {
    js: [],
    ts: [],
    md: [],
    json: [],
    html: [],
    other: []
  };

  for (const file of vadFiles) {
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
        parsed = { type: 'json', hasVAD: true };
        fileTypes.json.push(file);
      } else if (ext === 'html') {
        fileType = 'html';
        parsed = { type: 'html', hasVAD: true };
        fileTypes.html.push(file);
      } else {
        parsed = { type: ext, hasVAD: true };
        fileTypes.other.push(file);
      }

      results.push({
        file,
        valid: true,
        sizeKB: parseFloat(sizeKB),
        type: fileType,
        parsed
      });

      console.log(`✓ ${file}`);
      console.log(`  Size: ${sizeKB} KB`);
      console.log(`  Type: ${fileType.toUpperCase()}`);

      if (fileType === 'js' || fileType === 'ts') {
        if (parsed.hasVADImport) {
          console.log(`  VAD Imports: ${parsed.vadImports.length}`);
          parsed.vadImports.forEach(imp => {
            console.log(`    - from "${imp.source}"`);
          });
        }
        if (parsed.hasVADConfig) {
          console.log(`  VAD_CONFIG references: ${parsed.vadConfigReferences.length}`);
        }
        if (parsed.hasMicVAD) {
          console.log(`  MicVAD methods: ${parsed.vadMethods.join(', ')}`);
        }
        if (parsed.vadEvents.length > 0) {
          console.log(`  VAD Events: ${parsed.vadEvents.join(', ')}`);
        }
        if (Object.keys(parsed.vadOptions).length > 0) {
          console.log(`  VAD Options: ${Object.keys(parsed.vadOptions).join(', ')}`);
        }
        console.log(`  Total VAD references: ${parsed.totalVADReferences}`);
      } else if (fileType === 'md') {
        if (parsed.vadSections.length > 0) {
          console.log(`  VAD Sections: ${parsed.vadSections.length}`);
          parsed.vadSections.slice(0, 3).forEach(sec => {
            console.log(`    - ${sec}`);
          });
        }
        if (parsed.vadConfigMentions > 0) {
          console.log(`  VAD Config mentions: ${parsed.vadConfigMentions}`);
        }
        if (parsed.vadCodeBlocks > 0) {
          console.log(`  VAD Code blocks: ${parsed.vadCodeBlocks}`);
        }
        if (parsed.vadFeatures.length > 0) {
          console.log(`  VAD Features mentioned: ${parsed.vadFeatures.join(', ')}`);
        }
      }

      console.log('');
    } catch (error) {
      results.push({
        file,
        valid: false,
        error: error.message
      });
      console.log(`✗ ${file}`);
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

  // VAD-specific statistics
  const jsFiles = results.filter(r => (r.type === 'js' || r.type === 'ts') && r.valid);
  const totalVADRefs = jsFiles.reduce((sum, r) => sum + (r.parsed?.totalVADReferences || 0), 0);
  const filesWithImports = jsFiles.filter(r => r.parsed?.hasVADImport).length;
  const filesWithConfig = jsFiles.filter(r => r.parsed?.hasVADConfig).length;
  const filesWithMicVAD = jsFiles.filter(r => r.parsed?.hasMicVAD).length;

  console.log('\n=== VAD Statistics ===');
  console.log(`Total VAD references in code: ${totalVADRefs}`);
  console.log(`Files with VAD imports: ${filesWithImports}`);
  console.log(`Files with VAD_CONFIG: ${filesWithConfig}`);
  console.log(`Files with MicVAD usage: ${filesWithMicVAD}`);

  // Extract all unique VAD methods
  const allMethods = new Set();
  jsFiles.forEach(r => {
    if (r.parsed?.vadMethods) {
      r.parsed.vadMethods.forEach(m => allMethods.add(m));
    }
  });
  if (allMethods.size > 0) {
    console.log(`\nVAD Methods used: ${Array.from(allMethods).join(', ')}`);
  }

  // Extract all unique VAD events
  const allEvents = new Set();
  jsFiles.forEach(r => {
    if (r.parsed?.vadEvents) {
      r.parsed.vadEvents.forEach(e => allEvents.add(e));
    }
  });
  if (allEvents.size > 0) {
    console.log(`VAD Events used: ${Array.from(allEvents).join(', ')}`);
  }

  if (invalid > 0) {
    console.log('\nInvalid files:');
    results.filter(r => !r.valid).forEach(r => {
      console.log(`  - ${r.file}: ${r.error}`);
    });
  }

  // Key VAD files
  console.log('\n=== Key VAD Files ===');
  const keyFiles = results.filter(r => 
    r.valid && (
      r.file.includes('vad-config') ||
      r.file.includes('cartesia-audio-bridge') ||
      r.file.includes('vad-config.test')
    )
  );
  keyFiles.forEach(r => {
    console.log(`  - ${r.file} (${r.sizeKB} KB)`);
  });
}

parseAllVadFiles().catch(console.error);
