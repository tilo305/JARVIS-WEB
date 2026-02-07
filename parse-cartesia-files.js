import { readFileSync, statSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { fileURLToPath } from 'url';
import { dirname, join, relative } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse JavaScript/TypeScript files for Cartesia usage
function parseJSFile(content, filePath) {
  const stats = {
    hasCartesiaImport: false,
    hasCartesiaConfig: false,
    hasCartesiaClass: false,
    cartesiaImports: [],
    cartesiaConfigReferences: [],
    cartesiaClasses: [],
    cartesiaMethods: [],
    cartesiaProperties: [],
    cartesiaConstants: [],
    cartesiaEndpoints: [],
    totalCartesiaReferences: 0,
    cartesiaFunctionCalls: [],
    cartesiaWebSocketUsage: false,
    cartesiaSTTUsage: false,
    cartesiaTTSUsage: false
  };

  // Check for Cartesia imports
  const importRegex = /import\s+.*?\b(cartesia|Cartesia|STT|TTS|CartesiaSTTClient|CartesiaTTSClient|CartesiaAudioBridge|BidirectionalConversation)\b.*?from\s+['"]([^'"]+)['"]/gi;
  const importMatches = [...content.matchAll(importRegex)];
  if (importMatches.length > 0) {
    stats.hasCartesiaImport = true;
    stats.cartesiaImports = importMatches.map(m => ({
      import: m[0],
      source: m[2]
    }));
  }

  // Check for CARTESIA_CONFIG or cartesia config
  if (/CARTESIA_CONFIG|CARTESIA_API_KEY|CARTESIA_VOICE_ID|CARTESIA_VERSION/i.test(content)) {
    stats.hasCartesiaConfig = true;
    const configMatches = [...content.matchAll(/(CARTESIA_CONFIG|CARTESIA_API_KEY|CARTESIA_VOICE_ID|CARTESIA_VERSION)\s*[\.\[]/g)];
    stats.cartesiaConfigReferences = [...new Set(configMatches.map(m => m[1]))];
  }

  // Check for Cartesia classes
  const classRegex = /(CartesiaSTTClient|CartesiaTTSClient|CartesiaAudioBridge|BidirectionalConversation)/g;
  const classMatches = [...content.matchAll(classRegex)];
  if (classMatches.length > 0) {
    stats.hasCartesiaClass = true;
    stats.cartesiaClasses = [...new Set(classMatches.map(m => m[1]))];
  }

  // Extract Cartesia methods
  const methodRegex = /\.(connect|disconnect|sendAudio|sendText|speakText|startSTT|stopSTT|connectSTT|connectTTS|onTranscript|onAudio|onError|finalize|done|streamTextChunks|cancelTTS|initWakeWord)\s*\(/gi;
  const methodMatches = [...content.matchAll(methodRegex)];
  stats.cartesiaMethods = [...new Set(methodMatches.map(m => m[1]))];

  // Extract Cartesia properties
  const propertyRegex = /(apiKey|voiceId|sttWs|ttsWs|model|encoding|sampleRate|language|contextId|isContinue)\s*[:=]/gi;
  const propertyMatches = [...content.matchAll(propertyRegex)];
  stats.cartesiaProperties = [...new Set(propertyMatches.map(m => m[1]))];

  // Extract Cartesia constants
  const constantRegex = /(CARTESIA_VERSION|STT_ENDPOINT|TTS_ENDPOINT|CARTESIA_API_KEY|CARTESIA_VOICE_ID)\s*[:=]\s*['"]([^'"]+)['"]/gi;
  const constantMatches = [...content.matchAll(constantRegex)];
  stats.cartesiaConstants = constantMatches.map(m => ({
    name: m[1],
    value: m[2]
  }));

  // Extract Cartesia endpoints
  const endpointRegex = /(wss?:\/\/api\.cartesia\.ai\/(stt|tts)\/websocket)/gi;
  const endpointMatches = [...content.matchAll(endpointRegex)];
  stats.cartesiaEndpoints = [...new Set(endpointMatches.map(m => m[1]))];
  if (stats.cartesiaEndpoints.length > 0) {
    stats.cartesiaWebSocketUsage = true;
    if (stats.cartesiaEndpoints.some(e => e.includes('/stt/'))) {
      stats.cartesiaSTTUsage = true;
    }
    if (stats.cartesiaEndpoints.some(e => e.includes('/tts/'))) {
      stats.cartesiaTTSUsage = true;
    }
  }

  // Count total Cartesia references (case-insensitive)
  const cartesiaRefRegex = /\bcartesia\b/gi;
  stats.totalCartesiaReferences = (content.match(cartesiaRefRegex) || []).length;

  // Extract function calls involving Cartesia
  const functionRegex = /(\w+)\s*\([^)]*\b(cartesia|Cartesia|STT|TTS)\b[^)]*\)/gi;
  const functionMatches = [...content.matchAll(functionRegex)];
  stats.cartesiaFunctionCalls = [...new Set(functionMatches.map(m => m[1]))];

  return stats;
}

// Parse Markdown/documentation files for Cartesia information
function parseDocFile(content) {
  const stats = {
    cartesiaSections: [],
    cartesiaConfigMentions: 0,
    cartesiaCodeBlocks: 0,
    cartesiaFeatures: [],
    cartesiaParameters: []
  };

  // Extract Cartesia sections
  const sectionRegex = /^#{1,3}\s+.*[Cc]artesia.*$/gm;
  const sections = [...content.matchAll(sectionRegex)];
  stats.cartesiaSections = sections.map(s => s[0].trim());

  // Count Cartesia config mentions
  stats.cartesiaConfigMentions = (content.match(/CARTESIA_CONFIG|CARTESIA_API_KEY|CARTESIA_VOICE_ID|CARTESIA_VERSION/gi) || []).length;

  // Count code blocks mentioning Cartesia
  const codeBlockRegex = /```[\s\S]*?\b(cartesia|Cartesia|STT|TTS)\b[\s\S]*?```/gi;
  stats.cartesiaCodeBlocks = (content.match(codeBlockRegex) || []).length;

  // Extract Cartesia features/parameters from documentation
  const featureRegex = /(WebSocket|STT|TTS|model|Endpoint|api_key|encoding|sample_rate|language|voice_id|context_id|continue|ink-whisper|sonic-3|sonic-turbo|pcm_s16le)/gi;
  const features = [...content.matchAll(featureRegex)];
  stats.cartesiaFeatures = [...new Set(features.map(f => f[1]))];

  // Extract parameter descriptions
  const paramRegex = /(\w+)\s*[:=]\s*([^\n]+)/g;
  const params = [...content.matchAll(paramRegex)];
  stats.cartesiaParameters = params
    .filter(p => /cartesia|stt|tts|websocket|api_key|voice|model|encoding|sample_rate|context/i.test(p[1] + p[2]))
    .map(p => ({ param: p[1], value: p[2].trim() }));

  return stats;
}

async function parseAllCartesiaFiles() {
  console.log('🔍 Finding Cartesia-related files...\n');

  // Define known Cartesia files from CARTESIA-FILES-PARSE.md
  const knownFiles = [
    'public/js/cartesia-audio-bridge.js',
    'src/stt-client.ts',
    'src/tts-client.ts',
    'src/bidirectional-conversation.ts',
    'src/config.ts',
    'cArTeSiA dOcS.md',
    'cArTeSiA wEbSoCkEt.md',
    'tests/unit/cartesia-audio-bridge.test.js',
    'debug/tests/integration/cartesia-websocket-live.test.ts'
  ];

  // Also search for files that mention cartesia
  const allFiles = await glob('**/*', {
    ignore: ['node_modules/**', 'dist/**', 'coverage/**', 'dist-public/**', '.git/**'],
    cwd: __dirname
  });

  // Filter files that contain Cartesia references or are known Cartesia files
  const cartesiaFiles = new Set();
  
  // Add known files
  knownFiles.forEach(file => {
    const fullPath = join(__dirname, file);
    try {
      if (statSync(fullPath).isFile()) {
        cartesiaFiles.add(file);
      }
    } catch (error) {
      // File doesn't exist, skip
    }
  });

  // Search for files mentioning cartesia
  for (const file of allFiles) {
    try {
      const content = readFileSync(join(__dirname, file), 'utf-8');
      if (/\bcartesia\b/i.test(content) || /\bCartesia\b/.test(content)) {
        cartesiaFiles.add(file);
      }
    } catch (error) {
      // Skip files we can't read
    }
  }

  const cartesiaFilesArray = Array.from(cartesiaFiles);
  console.log(`Found ${cartesiaFilesArray.length} Cartesia-related files:\n`);

  const results = [];
  const fileTypes = {
    js: [],
    ts: [],
    md: [],
    json: [],
    html: [],
    other: []
  };

  for (const file of cartesiaFilesArray) {
    try {
      const fullPath = join(__dirname, file);
      const content = readFileSync(fullPath, 'utf-8');
      const stats = statSync(fullPath);
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
        parsed = { type: 'json', hasCartesia: true };
        fileTypes.json.push(file);
      } else if (ext === 'html') {
        fileType = 'html';
        parsed = { type: 'html', hasCartesia: true };
        fileTypes.html.push(file);
      } else {
        parsed = { type: ext, hasCartesia: true };
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
        if (parsed.hasCartesiaImport) {
          console.log(`  Cartesia Imports: ${parsed.cartesiaImports.length}`);
          parsed.cartesiaImports.forEach(imp => {
            console.log(`    - from "${imp.source}"`);
          });
        }
        if (parsed.hasCartesiaConfig) {
          console.log(`  Cartesia Config references: ${parsed.cartesiaConfigReferences.join(', ')}`);
        }
        if (parsed.hasCartesiaClass) {
          console.log(`  Cartesia Classes: ${parsed.cartesiaClasses.join(', ')}`);
        }
        if (parsed.cartesiaEndpoints.length > 0) {
          console.log(`  Cartesia Endpoints: ${parsed.cartesiaEndpoints.join(', ')}`);
        }
        if (parsed.cartesiaConstants.length > 0) {
          console.log(`  Cartesia Constants: ${parsed.cartesiaConstants.length}`);
          parsed.cartesiaConstants.forEach(c => {
            console.log(`    - ${c.name} = ${c.value}`);
          });
        }
        console.log(`  Total Cartesia references: ${parsed.totalCartesiaReferences}`);
        if (parsed.cartesiaSTTUsage) {
          console.log(`  STT Usage: ✓`);
        }
        if (parsed.cartesiaTTSUsage) {
          console.log(`  TTS Usage: ✓`);
        }
      } else if (fileType === 'md') {
        if (parsed.cartesiaSections.length > 0) {
          console.log(`  Cartesia Sections: ${parsed.cartesiaSections.length}`);
          parsed.cartesiaSections.slice(0, 3).forEach(sec => {
            console.log(`    - ${sec}`);
          });
        }
        if (parsed.cartesiaConfigMentions > 0) {
          console.log(`  Cartesia Config mentions: ${parsed.cartesiaConfigMentions}`);
        }
        if (parsed.cartesiaCodeBlocks > 0) {
          console.log(`  Cartesia Code blocks: ${parsed.cartesiaCodeBlocks}`);
        }
        if (parsed.cartesiaFeatures.length > 0) {
          console.log(`  Cartesia Features: ${parsed.cartesiaFeatures.length} unique`);
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
  console.log(`${'='.repeat(80)}`);
  console.log('SUMMARY');
  console.log(`${'='.repeat(80)}`);
  console.log(`Total files: ${results.length}`);
  console.log(`Valid files: ${results.filter(r => r.valid).length}`);
  console.log(`Invalid files: ${results.filter(r => !r.valid).length}`);
  console.log(`\nBy type:`);
  console.log(`  JavaScript: ${fileTypes.js.length}`);
  console.log(`  TypeScript: ${fileTypes.ts.length}`);
  console.log(`  Markdown: ${fileTypes.md.length}`);
  console.log(`  JSON: ${fileTypes.json.length}`);
  console.log(`  HTML: ${fileTypes.html.length}`);
  console.log(`  Other: ${fileTypes.other.length}`);

  const totalSize = results.reduce((sum, r) => sum + (r.sizeKB || 0), 0);
  console.log(`\nTotal size: ${totalSize.toFixed(2)} KB`);

  // Save results to JSON file
  const outputFile = join(__dirname, 'cartesia-parse-results.json');
  const outputData = results.map(r => ({
    file: r.file,
    valid: r.valid,
    sizeKB: r.sizeKB || null,
    type: r.type || null,
    parsed: r.parsed || null,
    error: r.error || null
  }));

  writeFileSync(outputFile, JSON.stringify(outputData, null, 2), 'utf-8');
  console.log(`\n✓ Results saved to: cartesia-parse-results.json`);
  console.log(`\n✅ All Cartesia files have been parsed!`);
}

// Run the parser
parseAllCartesiaFiles().catch(console.error);
