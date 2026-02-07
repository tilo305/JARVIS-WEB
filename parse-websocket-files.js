#!/usr/bin/env node
/**
 * WebSocket Files Parser
 * Parses all WebSocket-related files in the JARVIS-WEB project:
 * - JavaScript/TypeScript files with WebSocket usage
 * - Python WebSocket server files
 * - HTML debugging tools
 * - Documentation files
 * Creates a comprehensive analysis of all WebSocket implementations
 */

import { readFileSync, statSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Known WebSocket-related files (core + docs)
const KNOWN_WEBSOCKET_FILES = [
  // Core Implementation Files
  'src/stt-client.ts',
  'src/tts-client.ts',
  'public/js/cartesia-audio-bridge.js',
  // Debug and Testing
  'debug/tests/integration/cartesia-websocket-live.test.ts',
  // Documentation
  'wEbSoCkEt DoCs.md',
  // Additional
  'src/bidirectional-conversation.ts',
  'src/config.ts',
  'vite.config.js'
];

// Parse JavaScript/TypeScript files for WebSocket usage
function parseJSFile(content, filePath) {
  const stats = {
    hasWebSocket: false,
    hasWebSocketImport: false,
    websocketEndpoints: [],
    websocketProtocols: [],
    websocketMethods: [],
    websocketEvents: [],
    websocketReconnection: false,
    websocketErrorHandling: false,
    websocketTypes: [], // 'browser' or 'node'
    totalWebSocketReferences: 0,
    websocketClasses: [],
    websocketConfig: {}
  };

  // Check for WebSocket usage patterns
  const wsPatterns = [
    /new\s+WebSocket\s*\(/gi,
    /WebSocket\s*\(/gi,
    /ws:\/\//gi,
    /wss:\/\//gi,
    /from\s+['"]ws['"]/gi,
    /import\s+.*\bWebSocket\b/gi,
    /require\s*\(\s*['"]ws['"]/gi
  ];

  const hasWebSocket = wsPatterns.some(pattern => pattern.test(content));
  stats.hasWebSocket = hasWebSocket;

  if (!hasWebSocket) {
    return stats;
  }

  // Count total WebSocket references
  stats.totalWebSocketReferences = (content.match(/\bWebSocket\b/gi) || []).length;

  // Check for WebSocket imports
  const importRegex = /import\s+.*?\b(WebSocket|ws)\b.*?from\s+['"]([^'"]+)['"]/gi;
  const requireRegex = /require\s*\(\s*['"]ws['"]/gi;
  if (importRegex.test(content) || requireRegex.test(content)) {
    stats.hasWebSocketImport = true;
    if (/from\s+['"]ws['"]/gi.test(content) || requireRegex.test(content)) {
      stats.websocketTypes.push('node');
    }
    if (/new\s+WebSocket\s*\(/gi.test(content)) {
      stats.websocketTypes.push('browser');
    }
  } else if (/new\s+WebSocket\s*\(/gi.test(content)) {
    stats.websocketTypes.push('browser');
  }

  // Extract WebSocket endpoints
  const endpointRegex = /(wss?:\/\/[^\s"'`\)]+)/gi;
  const endpoints = [...content.matchAll(endpointRegex)];
  stats.websocketEndpoints = [...new Set(endpoints.map(m => m[1]))];

  // Extract WebSocket protocols (ws:// vs wss://)
  const protocols = new Set();
  endpoints.forEach(m => {
    if (m[1].startsWith('ws://')) protocols.add('ws');
    if (m[1].startsWith('wss://')) protocols.add('wss');
  });
  stats.websocketProtocols = Array.from(protocols);

  // Extract WebSocket methods
  const methodRegex = /\.(connect|disconnect|send|close|on|addEventListener|removeEventListener|readyState|OPEN|CONNECTING|CLOSING|CLOSED)\b/gi;
  const methods = [...content.matchAll(methodRegex)];
  stats.websocketMethods = [...new Set(methods.map(m => m[1].toLowerCase()))];

  // Extract WebSocket events
  const eventRegex = /\.(on|addEventListener)\s*\(\s*['"](open|close|error|message|connect|disconnect)['"]/gi;
  const events = [...content.matchAll(eventRegex)];
  stats.websocketEvents = [...new Set(events.map(m => m[2]))];

  // Check for reconnection logic
  stats.websocketReconnection = /reconnect|retry|attempt|backoff|exponential/i.test(content);

  // Check for error handling
  stats.websocketErrorHandling = /\.on\s*\(\s*['"]error['"]|addEventListener\s*\(\s*['"]error['"]|catch|try\s*\{[\s\S]*?WebSocket/i.test(content);

  // Extract WebSocket classes
  const classRegex = /class\s+(\w*WebSocket\w*|\w*WS\w*|\w*Client\w*)/gi;
  const classes = [...content.matchAll(classRegex)];
  stats.websocketClasses = [...new Set(classes.map(m => m[1]))];

  // Extract configuration
  const configPatterns = {
    port: /(?:port|PORT)\s*[:=]\s*(\d+)/gi,
    url: /(?:url|URL|endpoint|ENDPOINT)\s*[:=]\s*['"]([^'"]+)['"]/gi,
    reconnectDelay: /(?:reconnect|retry).*?delay\s*[:=]\s*(\d+)/gi,
    maxAttempts: /(?:max|maximum).*?(?:attempt|retry|reconnect)\s*[:=]\s*(\d+)/gi
  };

  for (const [key, pattern] of Object.entries(configPatterns)) {
    const matches = [...content.matchAll(pattern)];
    if (matches.length > 0) {
      stats.websocketConfig[key] = matches.map(m => m[1]);
    }
  }

  return stats;
}

// Parse Python files for WebSocket usage
function parsePythonFile(content, filePath) {
  const stats = {
    hasWebSocket: false,
    websocketLibrary: null,
    websocketEndpoints: [],
    websocketProtocols: [],
    websocketMethods: [],
    websocketEvents: [],
    totalWebSocketReferences: 0
  };

  // Check for WebSocket usage
  const wsPatterns = [
    /websocket|WebSocket|aiohttp.*websocket|websockets/i
  ];

  const hasWebSocket = wsPatterns.some(pattern => pattern.test(content));
  stats.hasWebSocket = hasWebSocket;

  if (!hasWebSocket) {
    return stats;
  }

  // Count total WebSocket references
  stats.totalWebSocketReferences = (content.match(/\bwebsocket\b/gi) || []).length;

  // Detect WebSocket library
  if (/from\s+aiohttp\s+import|import\s+aiohttp/i.test(content)) {
    stats.websocketLibrary = 'aiohttp';
  } else if (/import\s+websockets|from\s+websockets/i.test(content)) {
    stats.websocketLibrary = 'websockets';
  }

  // Extract endpoints/ports
  const portRegex = /(?:port|PORT)\s*[:=]\s*(\d+)/gi;
  const ports = [...content.matchAll(portRegex)];
  if (ports.length > 0) {
    stats.websocketConfig = { ports: ports.map(m => m[1]) };
  }

  // Extract WebSocket methods
  const methodRegex = /\.(send|receive|close|accept|prepare|ping|pong)\s*\(/gi;
  const methods = [...content.matchAll(methodRegex)];
  stats.websocketMethods = [...new Set(methods.map(m => m[1]))];

  return stats;
}

// Parse HTML files for WebSocket usage
function parseHTMLFile(content, filePath) {
  const stats = {
    hasWebSocket: false,
    websocketEndpoints: [],
    websocketScripts: [],
    totalWebSocketReferences: 0
  };

  // Check for WebSocket usage in script tags
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  const scripts = [...content.matchAll(scriptRegex)];
  
  let hasWebSocket = false;
  scripts.forEach(script => {
    if (/new\s+WebSocket|WebSocket\s*\(|ws:\/\/|wss:\/\//i.test(script[1])) {
      hasWebSocket = true;
      stats.websocketScripts.push(script[1].substring(0, 200)); // First 200 chars
    }
  });

  stats.hasWebSocket = hasWebSocket;

  if (hasWebSocket) {
    // Extract endpoints from all content
    const endpointRegex = /(wss?:\/\/[^\s"'`\)]+)/gi;
    const endpoints = [...content.matchAll(endpointRegex)];
    stats.websocketEndpoints = [...new Set(endpoints.map(m => m[1]))];
    stats.totalWebSocketReferences = (content.match(/\bWebSocket\b/gi) || []).length;
  }

  return stats;
}

// Parse Markdown/documentation files
function parseDocFile(content) {
  const stats = {
    hasWebSocket: false,
    websocketSections: [],
    websocketEndpoints: [],
    websocketCodeBlocks: 0,
    totalWebSocketReferences: 0
  };

  const hasWebSocket = /\bwebsocket\b/i.test(content);
  stats.hasWebSocket = hasWebSocket;

  if (!hasWebSocket) {
    return stats;
  }

  // Extract WebSocket sections
  const sectionRegex = /^#{1,3}\s+.*websocket.*$/gmi;
  const sections = [...content.matchAll(sectionRegex)];
  stats.websocketSections = sections.map(s => s[0].trim());

  // Extract endpoints
  const endpointRegex = /(wss?:\/\/[^\s"'`\)]+)/gi;
  const endpoints = [...content.matchAll(endpointRegex)];
  stats.websocketEndpoints = [...new Set(endpoints.map(m => m[1]))];

  // Count code blocks mentioning WebSocket
  const codeBlockRegex = /```[\s\S]*?\bwebsocket\b[\s\S]*?```/gi;
  stats.websocketCodeBlocks = (content.match(codeBlockRegex) || []).length;

  stats.totalWebSocketReferences = (content.match(/\bwebsocket\b/gi) || []).length;

  return stats;
}

async function parseAllWebSocketFiles() {
  console.log('🔍 Finding WebSocket-related files...\n');

  // Get all files
  const allFiles = await glob('**/*', {
    ignore: ['node_modules/**', 'dist/**', 'coverage/**', 'dist-public/**', '.git/**', '*.json'],
    cwd: __dirname
  });

  // Find files that mention WebSocket
  const websocketFiles = new Set();
  
  // Add known files
  KNOWN_WEBSOCKET_FILES.forEach(file => {
    const fullPath = join(__dirname, file);
    try {
      if (statSync(fullPath).isFile()) {
        websocketFiles.add(file);
      }
    } catch (error) {
      // File doesn't exist, skip
    }
  });

  // Search for files mentioning websocket
  for (const file of allFiles) {
    try {
      const content = readFileSync(join(__dirname, file), 'utf-8');
      if (/\bwebsocket\b/i.test(content) || 
          /new\s+WebSocket|WebSocket\s*\(|ws:\/\/|wss:\/\//i.test(content) ||
          /from\s+['"]ws['"]|require\s*\(\s*['"]ws['"]/i.test(content)) {
        websocketFiles.add(file);
      }
    } catch (error) {
      // Skip files we can't read
    }
  }

  const websocketFilesArray = Array.from(websocketFiles).sort();
  console.log(`Found ${websocketFilesArray.length} WebSocket-related files:\n`);

  const results = [];
  const fileTypes = {
    js: [],
    ts: [],
    py: [],
    html: [],
    md: [],
    other: []
  };

  for (const file of websocketFilesArray) {
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
        parsed = parseJSFile(content, file);
        fileTypes.js.push(file);
      } else if (ext === 'ts' || ext === 'tsx') {
        fileType = 'ts';
        parsed = parseJSFile(content, file);
        fileTypes.ts.push(file);
      } else if (ext === 'py') {
        fileType = 'py';
        parsed = parsePythonFile(content, file);
        fileTypes.py.push(file);
      } else if (ext === 'html') {
        fileType = 'html';
        parsed = parseHTMLFile(content, file);
        fileTypes.html.push(file);
      } else if (ext === 'md') {
        fileType = 'md';
        parsed = parseDocFile(content);
        fileTypes.md.push(file);
      } else {
        parsed = { type: ext, hasWebSocket: /\bwebsocket\b/i.test(content) };
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

      if (parsed.hasWebSocket) {
        console.log(`  WebSocket: ✓`);
        
        if (parsed.websocketEndpoints && parsed.websocketEndpoints.length > 0) {
          console.log(`  Endpoints: ${parsed.websocketEndpoints.length}`);
          parsed.websocketEndpoints.slice(0, 3).forEach(ep => {
            console.log(`    - ${ep}`);
          });
        }
        
        if (parsed.websocketTypes && parsed.websocketTypes.length > 0) {
          console.log(`  Types: ${parsed.websocketTypes.join(', ')}`);
        }
        
        if (parsed.websocketMethods && parsed.websocketMethods.length > 0) {
          console.log(`  Methods: ${parsed.websocketMethods.slice(0, 5).join(', ')}`);
        }
        
        if (parsed.websocketReconnection) {
          console.log(`  Reconnection: ✓`);
        }
        
        if (parsed.totalWebSocketReferences) {
          console.log(`  References: ${parsed.totalWebSocketReferences}`);
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
  console.log(`  Python: ${fileTypes.py.length}`);
  console.log(`  HTML: ${fileTypes.html.length}`);
  console.log(`  Markdown: ${fileTypes.md.length}`);
  console.log(`  Other: ${fileTypes.other.length}`);

  const filesWithWebSocket = results.filter(r => r.valid && r.parsed && r.parsed.hasWebSocket);
  console.log(`\nFiles with WebSocket: ${filesWithWebSocket.length}`);

  const totalSize = results.reduce((sum, r) => sum + (r.sizeKB || 0), 0);
  console.log(`\nTotal size: ${totalSize.toFixed(2)} KB`);

  // Collect all unique endpoints
  const allEndpoints = new Set();
  results.forEach(r => {
    if (r.parsed && r.parsed.websocketEndpoints) {
      r.parsed.websocketEndpoints.forEach(ep => allEndpoints.add(ep));
    }
  });
  console.log(`\nUnique WebSocket endpoints: ${allEndpoints.size}`);
  Array.from(allEndpoints).forEach(ep => {
    console.log(`  - ${ep}`);
  });

  // Save results to JSON file
  const outputFile = join(__dirname, 'websocket-parse-results.json');
  const outputData = results.map(r => ({
    file: r.file,
    valid: r.valid,
    sizeKB: r.sizeKB || null,
    type: r.type || null,
    parsed: r.parsed || null,
    error: r.error || null
  }));

  writeFileSync(outputFile, JSON.stringify(outputData, null, 2), 'utf-8');
  console.log(`\n✓ Results saved to: websocket-parse-results.json`);
  console.log(`\n✅ All WebSocket files have been parsed!`);
}

// Run the parser
parseAllWebSocketFiles().catch(console.error);
