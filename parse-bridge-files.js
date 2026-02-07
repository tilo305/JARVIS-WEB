#!/usr/bin/env node
/**
 * Bridge Files Parser
 * Parses all bridge files in the JARVIS-WEB project:
 * - Audio bridge implementations (CartesiaAudioBridge, etc.)
 * - Bridge test files
 * - Bridge-related documentation
 * 
 * Creates a comprehensive analysis of all bridge implementations
 */

import { readFileSync, statSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse JavaScript/TypeScript bridge files
function parseBridgeFile(content, filePath) {
  const stats = {
    // File info
    lines: content.split('\n').length,
    characters: content.length,
    
    // Bridge identification
    bridgeType: null, // 'audio-bridge', 'test', 'other'
    bridgeName: null,
    bridgeClass: null,
    
    // Structure
    classes: [],
    functions: [],
    methods: [],
    properties: [],
    imports: [],
    exports: [],
    constants: [],
    variables: [],
    
    // Bridge features
    hasWebSocket: false,
    hasWebRTC: false,
    hasWebAudio: false,
    hasAudioWorklet: false,
    hasMediaStream: false,
    hasVAD: false,
    hasWakeWord: false,
    hasSTT: false,
    hasTTS: false,
    hasBargeIn: false,
    hasReconnection: false,
    hasErrorHandling: false,
    
    // Audio features
    audioFormats: [],
    sampleRates: [],
    audioProcessors: [],
    
    // WebSocket features
    wsEndpoints: [],
    wsMessageTypes: [],
    wsProtocols: [],
    
    // Callbacks and events
    callbacks: [],
    eventHandlers: [],
    
    // Configuration
    configOptions: [],
    apiKeys: [],
    endpoints: [],
    
    // Code quality metrics
    asyncFunctions: 0,
    arrowFunctions: 0,
    tryCatchBlocks: 0,
    comments: { single: 0, multi: 0, jsdoc: 0 },
    
    // Dependencies
    dependencies: [],
    externalImports: []
  };

  // Detect bridge type from filename and content
  const filename = filePath.toLowerCase();
  if (filename.includes('audio-bridge') || filename.includes('audiobridge')) {
    stats.bridgeType = 'audio-bridge';
    stats.bridgeName = 'Audio Bridge';
  } else if (filename.includes('test') && filename.includes('bridge')) {
    stats.bridgeType = 'test';
    stats.bridgeName = 'Bridge Test';
  } else {
    stats.bridgeType = 'other';
    stats.bridgeName = 'Bridge';
  }

  // Extract classes
  const classRegex = /(?:export\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?/g;
  let match;
  while ((match = classRegex.exec(content)) !== null) {
    const className = match[1];
    stats.classes.push({
      name: className,
      extends: match[2] || null
    });
    if (className.includes('Bridge') || className.includes('bridge')) {
      stats.bridgeClass = className;
    }
  }

  // Extract functions and methods
  const functionRegex = /(?:async\s+)?(?:function\s+(\w+)|(\w+)\s*[:=]\s*(?:async\s+)?\([^)]*\)\s*=>|(\w+)\s*\([^)]*\)\s*\{)/g;
  while ((match = functionRegex.exec(content)) !== null) {
    const funcName = match[1] || match[2] || match[3];
    if (funcName) {
      stats.functions.push(funcName);
      if (match[0].includes('async')) {
        stats.asyncFunctions++;
      }
      if (match[0].includes('=>')) {
        stats.arrowFunctions++;
      }
    }
  }

  // Extract methods (methods within classes)
  const methodRegex = /(?:^\s+|\s+)(\w+)\s*\([^)]*\)\s*\{/gm;
  while ((match = methodRegex.exec(content)) !== null) {
    const methodName = match[1];
    if (!['if', 'for', 'while', 'switch', 'catch', 'try'].includes(methodName)) {
      stats.methods.push(methodName);
    }
  }

  // Extract properties
  const propertyRegex = /(?:this\.|const\s+|let\s+|var\s+)(\w+)\s*[:=]/g;
  while ((match = propertyRegex.exec(content)) !== null) {
    stats.properties.push(match[1]);
  }

  // Extract imports
  const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    stats.imports.push(importPath);
    if (!importPath.startsWith('.')) {
      stats.externalImports.push(importPath);
    }
  }

  // Extract exports
  const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var|async\s+function)\s+(\w+)/g;
  while ((match = exportRegex.exec(content)) !== null) {
    stats.exports.push(match[1]);
  }

  // Extract constants
  const constantRegex = /const\s+([A-Z_][A-Z0-9_]*)\s*=\s*['"]?([^'";\n]+)['"]?/g;
  while ((match = constantRegex.exec(content)) !== null) {
    stats.constants.push({
      name: match[1],
      value: match[2].trim()
    });
  }

  // Check for WebSocket usage
  if (/WebSocket|websocket|ws\./i.test(content)) {
    stats.hasWebSocket = true;
    const wsRegex = /(wss?:\/\/[^\s'"]+)/gi;
    const wsMatches = [...content.matchAll(wsRegex)];
    stats.wsEndpoints = [...new Set(wsMatches.map(m => m[1]))];
  }

  // Check for WebRTC
  if (/getUserMedia|MediaStream|RTCPeerConnection/i.test(content)) {
    stats.hasWebRTC = true;
  }

  // Check for Web Audio API
  if (/AudioContext|AudioWorklet|AudioNode|AudioWorkletNode/i.test(content)) {
    stats.hasWebAudio = true;
  }

  // Check for AudioWorklet
  if (/AudioWorklet|audioWorklet|AudioWorkletNode|audio-worklet/i.test(content)) {
    stats.hasAudioWorklet = true;
    const processorRegex = /(?:audioWorklet\.addModule|AudioWorkletNode)\s*\([^)]*['"]([^'"]+processor[^'"]*)['"]/gi;
    const processorMatches = [...content.matchAll(processorRegex)];
    stats.audioProcessors = [...new Set(processorMatches.map(m => m[1]))];
  }

  // Check for MediaStream
  if (/MediaStream|getUserMedia|mediaStream/i.test(content)) {
    stats.hasMediaStream = true;
  }

  // Check for VAD (Voice Activity Detection)
  if (/\bVAD\b|MicVAD|voice.*activity|vad/i.test(content)) {
    stats.hasVAD = true;
  }

  // Check for Wake Word
  if (/wake.*word|wakeWord|WakeWord|openWakeWord/i.test(content)) {
    stats.hasWakeWord = true;
  }

  // Check for STT (Speech-to-Text)
  if (/\bSTT\b|speech.*text|sttWs|connectSTT/i.test(content)) {
    stats.hasSTT = true;
  }

  // Check for TTS (Text-to-Speech)
  if (/\bTTS\b|text.*speech|ttsWs|connectTTS|speakText/i.test(content)) {
    stats.hasTTS = true;
  }

  // Check for Barge-in
  if (/barge.*in|bargeIn|clearTTSBuffer/i.test(content)) {
    stats.hasBargeIn = true;
  }

  // Check for reconnection logic
  if (/reconnect|reconnection|connection.*health|health.*monitor/i.test(content)) {
    stats.hasReconnection = true;
  }

  // Check for error handling
  if (/try\s*\{|catch\s*\(|\.catch\(|onError/i.test(content)) {
    stats.hasErrorHandling = true;
    stats.tryCatchBlocks = (content.match(/try\s*\{/g) || []).length;
  }

  // Extract audio formats
  const audioFormatRegex = /(pcm_s16le|pcm|wav|mp3|ogg|opus|raw)/gi;
  const formatMatches = [...content.matchAll(audioFormatRegex)];
  stats.audioFormats = [...new Set(formatMatches.map(m => m[1]))];

  // Extract sample rates
  const sampleRateRegex = /sample[_\s]*rate[:\s]*['"]?(\d+)/gi;
  const sampleRateMatches = [...content.matchAll(sampleRateRegex)];
  stats.sampleRates = [...new Set(sampleRateMatches.map(m => m[1]))];

  // Extract WebSocket message types
  const messageTypeRegex = /(?:type|msg\.type|message\.type)\s*[=:]\s*['"]([^'"]+)['"]/gi;
  const messageMatches = [...content.matchAll(messageTypeRegex)];
  stats.wsMessageTypes = [...new Set(messageMatches.map(m => m[1]))];

  // Extract callbacks
  const callbackRegex = /(?:on|callback|handler)\s*(\w+)\s*[:=]\s*(?:\(|function|async)/gi;
  const callbackMatches = [...content.matchAll(callbackRegex)];
  stats.callbacks = [...new Set(callbackMatches.map(m => m[1]))];

  // Extract event handlers
  const eventRegex = /\.(onopen|onclose|onerror|onmessage|onSpeechStart|onSpeechEnd|onTranscript|onTTSChunk)\s*=/gi;
  const eventMatches = [...content.matchAll(eventRegex)];
  stats.eventHandlers = [...new Set(eventMatches.map(m => m[1]))];

  // Extract configuration options
  const configRegex = /(?:options|config|settings)\.(\w+)/g;
  const configMatches = [...content.matchAll(configRegex)];
  stats.configOptions = [...new Set(configMatches.map(m => m[1]))];

  // Extract API keys
  const apiKeyRegex = /(?:api[_\s]*key|API[_\s]*KEY|apiKey)\s*[:=]\s*['"]?([^'";\n]+)/gi;
  const apiKeyMatches = [...content.matchAll(apiKeyRegex)];
  stats.apiKeys = apiKeyMatches.map(m => m[1].trim()).filter(k => k && k !== 'null' && k !== 'undefined');

  // Extract endpoints
  const endpointRegex = /(?:endpoint|url|ENDPOINT|URL)\s*[:=]\s*['"]([^'"]+)['"]/gi;
  const endpointMatches = [...content.matchAll(endpointRegex)];
  stats.endpoints = [...new Set(endpointMatches.map(m => m[1]))];

  // Count comments
  stats.comments.single = (content.match(/\/\/[^\n]*/g) || []).length;
  stats.comments.multi = (content.match(/\/\*[\s\S]*?\*\//g) || []).length;
  stats.comments.jsdoc = (content.match(/\/\*\*[\s\S]*?\*\//g) || []).length;

  // Extract dependencies from imports
  stats.dependencies = stats.externalImports
    .filter(imp => !imp.startsWith('.'))
    .map(imp => {
      const parts = imp.split('/');
      return parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
    });

  return stats;
}

// Parse test files
function parseTestFile(content, filePath) {
  const stats = parseBridgeFile(content, filePath);
  
  // Additional test-specific parsing
  stats.testFramework = null;
  stats.testSuites = [];
  stats.testCases = [];
  
  // Detect test framework
  if (/jest|@jest|vitest|mocha|jasmine/i.test(content)) {
    if (/jest|@jest/i.test(content)) {
      stats.testFramework = 'jest';
    } else if (/vitest/i.test(content)) {
      stats.testFramework = 'vitest';
    } else if (/mocha/i.test(content)) {
      stats.testFramework = 'mocha';
    } else if (/jasmine/i.test(content)) {
      stats.testFramework = 'jasmine';
    }
  }
  
  // Extract test suites
  const describeRegex = /describe\s*\(['"]([^'"]+)['"]/g;
  let match;
  while ((match = describeRegex.exec(content)) !== null) {
    stats.testSuites.push(match[1]);
  }
  
  // Extract test cases
  const itRegex = /(?:it|test)\s*\(['"]([^'"]+)['"]/g;
  while ((match = itRegex.exec(content)) !== null) {
    stats.testCases.push(match[1]);
  }
  
  return stats;
}

// Parse documentation files
function parseDocFile(content) {
  return {
    lines: content.split('\n').length,
    characters: content.length,
    bridgeMentions: (content.match(/\bbridge\b/gi) || []).length,
    codeBlocks: (content.match(/```[\s\S]*?```/g) || []).length,
    sections: (content.match(/^#{1,3}\s+.+$/gm) || []).map(s => s.trim())
  };
}

async function parseAllBridgeFiles() {
  console.log('🌉 Finding bridge files...\n');

  // Known bridge files
  const knownFiles = [
    'public/js/cartesia-audio-bridge.js',
    'tests/unit/cartesia-audio-bridge.test.js'
  ];

  // Search for bridge files
  const allFiles = await glob('**/*', {
    ignore: ['node_modules/**', 'dist/**', 'coverage/**', 'dist-public/**', '.git/**'],
    cwd: __dirname
  });

  // Filter bridge files
  const bridgeFiles = new Set();
  
  // Add known files
  knownFiles.forEach(file => {
    const fullPath = join(__dirname, file);
    try {
      if (statSync(fullPath).isFile()) {
        bridgeFiles.add(file);
      }
    } catch (error) {
      // File doesn't exist, skip
    }
  });

  // Search for files with "bridge" in name or content
  for (const file of allFiles) {
    const filename = file.toLowerCase();
    if (filename.includes('bridge')) {
      bridgeFiles.add(file);
    } else {
      try {
        const content = readFileSync(join(__dirname, file), 'utf-8');
        if (/\bbridge\b/i.test(content) && (filename.endsWith('.js') || filename.endsWith('.ts') || filename.endsWith('.md'))) {
          bridgeFiles.add(file);
        }
      } catch (error) {
        // Skip files we can't read
      }
    }
  }

  const bridgeFilesArray = Array.from(bridgeFiles);
  console.log(`Found ${bridgeFilesArray.length} bridge files:\n`);

  const results = [];
  const fileTypes = {
    js: [],
    ts: [],
    md: [],
    other: []
  };

  for (const file of bridgeFilesArray) {
    try {
      const fullPath = join(__dirname, file);
      const content = readFileSync(fullPath, 'utf-8');
      const stats = statSync(fullPath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      
      // Get file extension
      const parts = file.split('.');
      const ext = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'other';

      let parsed = {};
      let fileType = 'other';

      if (ext === 'js' || ext === 'mjs' || ext === 'cjs' || ext === 'jsx') {
        fileType = 'js';
        if (file.includes('test')) {
          parsed = parseTestFile(content, file);
        } else {
          parsed = parseBridgeFile(content, file);
        }
        fileTypes.js.push(file);
      } else if (ext === 'ts' || ext === 'tsx') {
        fileType = 'ts';
        parsed = parseBridgeFile(content, file);
        fileTypes.ts.push(file);
      } else if (ext === 'md') {
        fileType = 'md';
        parsed = parseDocFile(content);
        fileTypes.md.push(file);
      } else {
        parsed = { type: ext };
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
        if (parsed.bridgeClass) {
          console.log(`  Bridge Class: ${parsed.bridgeClass}`);
        }
        if (parsed.classes.length > 0) {
          console.log(`  Classes: ${parsed.classes.map(c => c.name).join(', ')}`);
        }
        if (parsed.methods.length > 0) {
          console.log(`  Methods: ${parsed.methods.length} (${parsed.methods.slice(0, 5).join(', ')}${parsed.methods.length > 5 ? '...' : ''})`);
        }
        if (parsed.hasWebSocket) {
          console.log(`  WebSocket: ✓ (${parsed.wsEndpoints.length} endpoints)`);
        }
        if (parsed.hasAudioWorklet) {
          console.log(`  AudioWorklet: ✓ (${parsed.audioProcessors.length} processors)`);
        }
        if (parsed.hasSTT) {
          console.log(`  STT: ✓`);
        }
        if (parsed.hasTTS) {
          console.log(`  TTS: ✓`);
        }
        if (parsed.hasVAD) {
          console.log(`  VAD: ✓`);
        }
        if (parsed.hasWakeWord) {
          console.log(`  Wake Word: ✓`);
        }
        if (parsed.hasBargeIn) {
          console.log(`  Barge-in: ✓`);
        }
        if (parsed.hasReconnection) {
          console.log(`  Reconnection: ✓`);
        }
        if (parsed.dependencies.length > 0) {
          console.log(`  Dependencies: ${parsed.dependencies.slice(0, 5).join(', ')}${parsed.dependencies.length > 5 ? '...' : ''}`);
        }
        if (parsed.testFramework) {
          console.log(`  Test Framework: ${parsed.testFramework}`);
          console.log(`  Test Suites: ${parsed.testSuites.length}`);
          console.log(`  Test Cases: ${parsed.testCases.length}`);
        }
      } else if (fileType === 'md') {
        console.log(`  Bridge Mentions: ${parsed.bridgeMentions}`);
        console.log(`  Code Blocks: ${parsed.codeBlocks}`);
        if (parsed.sections.length > 0) {
          console.log(`  Sections: ${parsed.sections.length}`);
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
  console.log(`  Other: ${fileTypes.other.length}`);

  const totalSize = results.reduce((sum, r) => sum + (r.sizeKB || 0), 0);
  console.log(`\nTotal size: ${totalSize.toFixed(2)} KB`);

  // Feature summary
  const validResults = results.filter(r => r.valid && (r.type === 'js' || r.type === 'ts'));
  const features = {
    hasWebSocket: validResults.filter(r => r.parsed?.hasWebSocket).length,
    hasAudioWorklet: validResults.filter(r => r.parsed?.hasAudioWorklet).length,
    hasSTT: validResults.filter(r => r.parsed?.hasSTT).length,
    hasTTS: validResults.filter(r => r.parsed?.hasTTS).length,
    hasVAD: validResults.filter(r => r.parsed?.hasVAD).length,
    hasWakeWord: validResults.filter(r => r.parsed?.hasWakeWord).length,
    hasBargeIn: validResults.filter(r => r.parsed?.hasBargeIn).length,
    hasReconnection: validResults.filter(r => r.parsed?.hasReconnection).length
  };

  console.log(`\nFeatures:`);
  Object.entries(features).forEach(([feature, count]) => {
    if (count > 0) {
      console.log(`  ${feature}: ${count} file(s)`);
    }
  });

  // Save results to JSON file
  const outputFile = join(__dirname, 'bridge-parse-results.json');
  const outputData = {
    generated: new Date().toISOString(),
    totalFiles: results.length,
    validFiles: results.filter(r => r.valid).length,
    files: results.map(r => ({
      file: r.file,
      valid: r.valid,
      sizeKB: r.sizeKB || null,
      type: r.type || null,
      parsed: r.parsed || null,
      error: r.error || null
    })),
    summary: {
      byType: {
        js: fileTypes.js.length,
        ts: fileTypes.ts.length,
        md: fileTypes.md.length,
        other: fileTypes.other.length
      },
      totalSizeKB: totalSize.toFixed(2),
      features
    }
  };

  writeFileSync(outputFile, JSON.stringify(outputData, null, 2), 'utf-8');
  console.log(`\n✓ Results saved to: bridge-parse-results.json`);
  console.log(`\n✅ All bridge files have been parsed!`);
}

// Run the parser
parseAllBridgeFiles().catch(console.error);
