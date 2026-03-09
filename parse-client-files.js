#!/usr/bin/env node
/**
 * Client Files Parser
 * Comprehensive parser for all client files in the project:
 * - WebSocket clients (STT, TTS, openWakeWord, etc.)
 * - Audio bridge clients
 * - API clients
 * - Test clients
 * 
 * Ensures all client files are properly parsed and documented
 */

import { readFileSync, statSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { fileURLToPath } from 'url';
import { dirname, join, relative } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = __dirname;

// Enhanced JavaScript/TypeScript parser for client files
function parseClientFile(content, filePath) {
  const stats = {
    // File info
    lines: content.split('\n').length,
    characters: content.length,
    
    // Client identification
    clientType: null, // 'stt', 'tts', 'websocket', 'audio-bridge', 'api', 'test', 'other'
    clientName: null,
    clientClass: null,
    
    // Structure
    functions: [],
    classes: [],
    imports: [],
    exports: [],
    variables: [],
    constants: [],
    
    // Features
    hasWebSocket: false,
    hasWebRTC: false,
    hasWebAudio: false,
    hasMediaStream: false,
    hasAudioWorklet: false,
    hasFetch: false,
    hasReconnection: false,
    hasErrorHandling: false,
    
    // Client-specific
    endpoints: [],
    protocols: [],
    messageTypes: [],
    callbacks: [],
    eventHandlers: [],
    
    // Code quality
    asyncFunctions: 0,
    arrowFunctions: 0,
    tryCatchBlocks: 0,
    comments: { single: 0, multi: 0 }
  };

  // Detect client type from filename and content
  const filename = filePath.toLowerCase();
  if (filename.includes('stt-client') || filename.includes('sttclient')) {
    stats.clientType = 'stt';
    stats.clientName = 'STT Client';
  } else if (filename.includes('tts-client') || filename.includes('ttsclient')) {
    stats.clientType = 'tts';
    stats.clientName = 'TTS Client';
  } else if (filename.includes('audio-bridge') || filename.includes('audiobridge')) {
    stats.clientType = 'audio-bridge';
    stats.clientName = 'Audio Bridge';
  } else if (filename.includes('websocket') && filename.includes('client')) {
    stats.clientType = 'websocket';
    stats.clientName = 'WebSocket Client';
  } else if (filename.includes('test') && filename.includes('client')) {
    stats.clientType = 'test';
    stats.clientName = 'Test Client';
  } else {
    stats.clientType = 'other';
    stats.clientName = 'Client';
  }

  // Extract classes
  const classRegex = /class\s+(\w+)(?:\s+extends\s+(\w+))?/g;
  let match;
  while ((match = classRegex.exec(content)) !== null) {
    const className = match[1];
    stats.classes.push({
      name: className,
      extends: match[2] || null
    });
    
    // Try to identify client class
    if (!stats.clientClass && (
      className.includes('Client') || 
      className.includes('Bridge') ||
      className.includes('Manager')
    )) {
      stats.clientClass = className;
    }
  }

  // Extract functions
  const functionRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|(\w+))\s*=>|(\w+)\s*:\s*(?:async\s+)?(?:\([^)]*\)|(\w+))\s*=>)/g;
  while ((match = functionRegex.exec(content)) !== null) {
    const name = match[1] || match[2] || match[4] || match[5];
    if (name) {
      stats.functions.push(name);
    }
  }

  // Extract imports
  const importRegex = /import\s+(?:(?:\{[^}]+\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]+\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?["']([^"']+)["']/g;
  while ((match = importRegex.exec(content)) !== null) {
    stats.imports.push(match[match.length - 1]);
  }

  // Extract exports
  const exportRegex = /export\s+(?:default\s+)?(?:function\s+(\w+)|class\s+(\w+)|const\s+(\w+)|let\s+(\w+)|var\s+(\w+)|(?:\{[^}]+\}))/g;
  while ((match = exportRegex.exec(content)) !== null) {
    const name = match[1] || match[2] || match[3] || match[4] || match[5];
    if (name) {
      stats.exports.push(name);
    }
  }

  // Extract WebSocket endpoints
  const wsEndpointRegex = /(wss?:\/\/[^\s"'`]+)/gi;
  const wsMatches = [...content.matchAll(wsEndpointRegex)];
  stats.endpoints = [...new Set(wsMatches.map(m => m[1]))];

  // Extract protocols (WebSocket, HTTP, etc.)
  if (/WebSocket|new\s+WebSocket|ws:\/\/|wss:\/\//i.test(content)) {
    stats.hasWebSocket = true;
    stats.protocols.push('WebSocket');
  }
  if (/http:\/\/|https:\/\//i.test(content)) {
    stats.protocols.push('HTTP');
  }

  // Extract message types (JSON, binary, text)
  if (/JSON\.parse|JSON\.stringify|application\/json/i.test(content)) {
    stats.messageTypes.push('JSON');
  }
  if (/ArrayBuffer|Int16Array|Uint8Array|binary/i.test(content)) {
    stats.messageTypes.push('Binary');
  }
  if (/\.send\(|\.emit\(/i.test(content)) {
    stats.messageTypes.push('Text');
  }

  // Extract callbacks
  const callbackRegex = /(?:on\w+|callback|cb)\s*[:=]\s*(?:async\s+)?(?:\([^)]*\)\s*=>|function)/gi;
  const callbackMatches = [...content.matchAll(callbackRegex)];
  stats.callbacks = [...new Set(callbackMatches.map(m => m[0].split(/[:=(]/)[0].trim()))];

  // Extract event handlers
  const eventRegex = /\.(addEventListener|on\w+)\s*\(/g;
  while ((match = eventRegex.exec(content)) !== null) {
    stats.eventHandlers.push(match[1]);
  }

  // Check for features
  stats.hasWebRTC = /getUserMedia|RTCPeerConnection|MediaStream/i.test(content);
  stats.hasWebAudio = /AudioContext|AudioBuffer|AudioNode|AudioWorklet/i.test(content);
  stats.hasMediaStream = /MediaStream|getUserMedia|getDisplayMedia/i.test(content);
  stats.hasAudioWorklet = /AudioWorklet|registerProcessor|AudioWorkletProcessor/i.test(content);
  stats.hasFetch = /\bfetch\s*\(/i.test(content);
  stats.hasReconnection = /reconnect|retry|backoff|attempt/i.test(content);
  stats.hasErrorHandling = /try\s*\{|catch\s*\(|\.catch\(|onerror|onError/i.test(content);

  // Count async functions
  stats.asyncFunctions = (content.match(/\basync\s+function|\basync\s+\(/g) || []).length;

  // Count arrow functions
  stats.arrowFunctions = (content.match(/=>/g) || []).length;

  // Count try-catch blocks
  stats.tryCatchBlocks = (content.match(/\btry\s*\{/g) || []).length;

  // Count comments
  stats.comments.single = (content.match(/\/\/[^\n]*/g) || []).length;
  stats.comments.multi = (content.match(/\/\*[\s\S]*?\*\//g) || []).length;

  // Extract constants
  const constantRegex = /(?:const|let|var)\s+([A-Z_][A-Z0-9_]*)\s*=\s*['"]?([^'";\n]+)['"]?/g;
  while ((match = constantRegex.exec(content)) !== null) {
    stats.constants.push({
      name: match[1],
      value: match[2].trim()
    });
  }

  return stats;
}

async function parseAllClientFiles() {
  console.log('🔍 Finding all client files...\n');

  // Find all files with "client" in the name
  const clientFiles = await glob('**/*client*', {
    ignore: ['node_modules/**', 'dist/**', 'coverage/**', '**/dist-public/**', 'public/dist-public/**', '.git/**'],
    cwd: PROJECT_ROOT
  });

  // Also find files that might be clients (audio-bridge, etc.)
  const bridgeFiles = await glob('**/*bridge*', {
    ignore: ['node_modules/**', 'dist/**', 'coverage/**', '**/dist-public/**', 'public/dist-public/**', '.git/**'],
    cwd: PROJECT_ROOT
  });

  // Combine and deduplicate, exclude this parser script
  const allClientFiles = [...new Set([...clientFiles, ...bridgeFiles])]
    .filter(file => !file.includes('parse-client-files.js'));

  console.log(`Found ${allClientFiles.length} potential client files:\n`);

  const results = [];
  const clientTypes = {
    stt: [],
    tts: [],
    'audio-bridge': [],
    websocket: [],
    test: [],
    other: []
  };

  for (const file of allClientFiles) {
    try {
      const fullPath = join(PROJECT_ROOT, file);
      const content = readFileSync(fullPath, 'utf-8');
      const stats = statSync(fullPath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      
      // Get file extension
      const parts = file.split('.');
      const ext = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'other';

      // Only parse JS/TS files
      if (ext !== 'js' && ext !== 'mjs' && ext !== 'cjs' && ext !== 'ts' && ext !== 'tsx') {
        continue;
      }

      const parsed = parseClientFile(content, file);
      
      const result = {
        file: relative(PROJECT_ROOT, file),
        sizeKB: parseFloat(sizeKB),
        type: ext,
        ...parsed
      };

      results.push(result);
      clientTypes[parsed.clientType || 'other'].push(file);

      console.log(`✓ ${file}`);
      console.log(`  Type: ${parsed.clientName} (${parsed.clientType})`);
      console.log(`  Size: ${sizeKB} KB`);
      console.log(`  Lines: ${parsed.lines}`);
      if (parsed.clientClass) {
        console.log(`  Class: ${parsed.clientClass}`);
      }
      if (parsed.endpoints.length > 0) {
        console.log(`  Endpoints: ${parsed.endpoints.join(', ')}`);
      }
      if (parsed.protocols.length > 0) {
        console.log(`  Protocols: ${parsed.protocols.join(', ')}`);
      }
      if (parsed.hasWebSocket) {
        console.log(`  WebSocket: ✓`);
      }
      if (parsed.hasReconnection) {
        console.log(`  Reconnection: ✓`);
      }
      if (parsed.hasErrorHandling) {
        console.log(`  Error Handling: ✓`);
      }
      console.log('');
    } catch (error) {
      console.log(`✗ ${file}`);
      console.log(`  Error: ${error.message}\n`);
      results.push({
        file: relative(PROJECT_ROOT, file),
        valid: false,
        error: error.message
      });
    }
  }

  // Summary
  console.log(`${'='.repeat(80)}`);
  console.log('CLIENT FILES PARSE SUMMARY');
  console.log(`${'='.repeat(80)}`);
  console.log(`Total client files found: ${results.length}`);
  console.log(`\nBy client type:`);
  console.log(`  STT Clients: ${clientTypes.stt.length}`);
  clientTypes.stt.forEach(f => console.log(`    - ${f}`));
  console.log(`  TTS Clients: ${clientTypes.tts.length}`);
  clientTypes.tts.forEach(f => console.log(`    - ${f}`));
  console.log(`  Audio Bridge: ${clientTypes['audio-bridge'].length}`);
  clientTypes['audio-bridge'].forEach(f => console.log(`    - ${f}`));
  console.log(`  WebSocket Clients: ${clientTypes.websocket.length}`);
  clientTypes.websocket.forEach(f => console.log(`    - ${f}`));
  console.log(`  Test Clients: ${clientTypes.test.length}`);
  clientTypes.test.forEach(f => console.log(`    - ${f}`));
  console.log(`  Other Clients: ${clientTypes.other.length}`);
  clientTypes.other.forEach(f => console.log(`    - ${f}`));

  const totalSize = results.reduce((sum, r) => sum + (r.sizeKB || 0), 0);
  const totalLines = results.reduce((sum, r) => sum + (r.lines || 0), 0);
  console.log(`\nTotal size: ${totalSize.toFixed(2)} KB`);
  console.log(`Total lines: ${totalLines.toLocaleString()}`);

  // Features summary
  const withWebSocket = results.filter(r => r.hasWebSocket).length;
  const withReconnection = results.filter(r => r.hasReconnection).length;
  const withErrorHandling = results.filter(r => r.hasErrorHandling).length;
  const withWebAudio = results.filter(r => r.hasWebAudio).length;
  
  console.log(`\nFeatures:`);
  console.log(`  Files with WebSocket: ${withWebSocket}`);
  console.log(`  Files with Reconnection: ${withReconnection}`);
  console.log(`  Files with Error Handling: ${withErrorHandling}`);
  console.log(`  Files with Web Audio: ${withWebAudio}`);

  // Save results to JSON file
  const outputFile = join(PROJECT_ROOT, 'client-parse-results.json');
  writeFileSync(outputFile, JSON.stringify({
    summary: {
      totalFiles: results.length,
      totalSizeKB: totalSize.toFixed(2),
      totalLines,
      byType: {
        stt: clientTypes.stt.length,
        tts: clientTypes.tts.length,
        'audio-bridge': clientTypes['audio-bridge'].length,
        websocket: clientTypes.websocket.length,
        test: clientTypes.test.length,
        other: clientTypes.other.length
      },
      features: {
        withWebSocket,
        withReconnection,
        withErrorHandling,
        withWebAudio
      }
    },
    files: results
  }, null, 2), 'utf-8');
  
  console.log(`\n✓ Results saved to: client-parse-results.json`);
  console.log(`\n✅ All client files have been parsed!`);
  
  return results;
}

// Run the parser
parseAllClientFiles().catch(console.error);
