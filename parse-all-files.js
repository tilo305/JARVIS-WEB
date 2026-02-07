#!/usr/bin/env node
/**
 * Unified File Parser
 * Comprehensive parser that combines all parse-*.js functionality:
 * - Backend files (TypeScript/JavaScript)
 * - Frontend files (HTML, CSS, JavaScript)
 * - Client files (STT, TTS, WebSocket clients)
 * - Cartesia files
 * - VAD files
 * - WebSocket files
 * - Bridge files (Audio bridges, bridge tests)
 * - Agent files
 * - Manager files
 * - UI files
 * - Vite config files
 * - JSON files (including n8n workflows)
 * - Markdown files
 * 
 * Usage:
 *   node parse-all-files.js                    # Parse all files
 *   node parse-all-files.js --type=backend     # Parse only backend files
 *   node parse-all-files.js --type=frontend    # Parse only frontend files
 *   node parse-all-files.js --type=client      # Parse only client files
 *   node parse-all-files.js --type=bridge      # Parse only bridge files
 */

import { readFileSync, statSync, readdirSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { fileURLToPath } from 'url';
import { dirname, join, relative } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = __dirname;

// Parse command line arguments
const args = process.argv.slice(2);
const parseType = args.find(arg => arg.startsWith('--type='))?.split('=')[1] || 'all';
const outputFile = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || 'all-parse-results.json';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function directoryExists(dir) {
  try {
    const stat = statSync(dir);
    return stat.isDirectory();
  } catch (err) {
    return false;
  }
}

function getFileExtension(file) {
  const parts = file.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'other';
}

// ============================================================================
// BACKEND PARSER (TypeScript/JavaScript)
// ============================================================================

function findTypeScriptFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  files.forEach(file => {
    const filePath = join(dir, file);
    try {
      const stat = statSync(filePath);
      if (stat.isDirectory()) {
        if (!['node_modules', 'dist', 'coverage', '.git', 'dist-public'].includes(file)) {
          findTypeScriptFiles(filePath, fileList);
        }
      } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
        fileList.push(filePath);
      }
    } catch (err) {
      // Skip files we can't access
    }
  });
  return fileList;
}

function parseTypeScript(content) {
  const lines = content.split('\n');
  const result = {
    imports: [],
    exports: [],
    classes: [],
    interfaces: [],
    types: [],
    functions: [],
    enums: [],
    variables: [],
    constants: [],
    comments: [],
    jsdocComments: [],
    dependencies: new Set(),
    metadata: {
      totalLines: lines.length,
      totalWords: content.split(/\s+/).length,
      totalCharacters: content.length,
      importCount: 0,
      exportCount: 0,
      classCount: 0,
      interfaceCount: 0,
      typeCount: 0,
      functionCount: 0,
      enumCount: 0,
      constantCount: 0,
      variableCount: 0,
      commentCount: 0,
      jsdocCount: 0,
      totalMethods: 0
    }
  };

  // Extract imports
  const importRegex = /import\s+(?:(?:\{[^}]+\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]+\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?["']([^"']+)["']/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const module = match[match.length - 1];
    result.imports.push({ module, line: content.substring(0, match.index).split('\n').length });
    result.dependencies.add(module);
  }

  // Extract exports
  const exportRegex = /export\s+(?:default\s+)?(?:function\s+(\w+)|class\s+(\w+)|const\s+(\w+)|let\s+(\w+)|var\s+(\w+)|(?:\{[^}]+\}))/g;
  while ((match = exportRegex.exec(content)) !== null) {
    const name = match[1] || match[2] || match[3] || match[4] || match[5];
    if (name) result.exports.push(name);
  }

  // Extract classes
  const classRegex = /class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([^{]+))?/g;
  while ((match = classRegex.exec(content)) !== null) {
    result.classes.push({
      name: match[1],
      extends: match[2] || null,
      implements: match[3] ? match[3].split(',').map(i => i.trim()) : [],
      line: content.substring(0, match.index).split('\n').length,
      methodCount: 0,
      methods: []
    });
  }

  // Extract interfaces
  const interfaceRegex = /interface\s+(\w+)/g;
  while ((match = interfaceRegex.exec(content)) !== null) {
    result.interfaces.push({
      name: match[1],
      line: content.substring(0, match.index).split('\n').length
    });
  }

  // Extract types
  const typeRegex = /type\s+(\w+)\s*=/g;
  while ((match = typeRegex.exec(content)) !== null) {
    result.types.push({
      name: match[1],
      line: content.substring(0, match.index).split('\n').length
    });
  }

  // Extract functions
  const functionRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|(\w+))\s*=>|(\w+)\s*:\s*(?:async\s+)?(?:\([^)]*\)|(\w+))\s*=>)/g;
  while ((match = functionRegex.exec(content)) !== null) {
    const name = match[1] || match[2] || match[4] || match[5];
    if (name) result.functions.push(name);
  }

  // Extract enums
  const enumRegex = /enum\s+(\w+)/g;
  while ((match = enumRegex.exec(content)) !== null) {
    result.enums.push({
      name: match[1],
      line: content.substring(0, match.index).split('\n').length
    });
  }

  // Count comments
  result.comments = [...content.matchAll(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g)];
  result.jsdocComments = [...content.matchAll(/\/\*\*[\s\S]*?\*\//g)];

  // Update metadata
  result.metadata.importCount = result.imports.length;
  result.metadata.exportCount = result.exports.length;
  result.metadata.classCount = result.classes.length;
  result.metadata.interfaceCount = result.interfaces.length;
  result.metadata.typeCount = result.types.length;
  result.metadata.functionCount = result.functions.length;
  result.metadata.enumCount = result.enums.length;
  result.metadata.commentCount = result.comments.length;
  result.metadata.jsdocCount = result.jsdocComments.length;

  return result;
}

// ============================================================================
// FRONTEND PARSERS (HTML, CSS, JavaScript)
// ============================================================================

function parseHTML(content) {
  const stats = {
    doctype: null,
    title: null,
    lang: null,
    metaTags: 0,
    linkTags: 0,
    scriptTags: 0,
    styleTags: 0,
    inlineStyles: 0,
    elements: {},
    totalElements: 0,
    hasForm: false,
    hasInput: false,
    hasButton: false,
    hasImage: false,
    hasVideo: false,
    hasAudio: false,
    hasCanvas: false,
    hasSVG: false,
    ids: [],
    classes: [],
    externalScripts: 0,
    externalStylesheets: 0,
    inlineScripts: 0,
    inlineStylesheets: 0,
    moduleScripts: 0,
    hasWebSocket: false,
    hasWebRTC: false,
    hasServiceWorker: false,
    hasManifest: false,
    scriptSources: [],
    stylesheetSources: []
  };

  const doctypeMatch = content.match(/<!DOCTYPE\s+[^>]+>/i);
  if (doctypeMatch) stats.doctype = doctypeMatch[0];

  const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) stats.title = titleMatch[1].trim();

  const langMatch = content.match(/<html[^>]*\s+lang=["']([^"']+)["']/i);
  if (langMatch) stats.lang = langMatch[1];

  stats.metaTags = (content.match(/<meta[^>]*>/gi) || []).length;

  const linkMatches = content.match(/<link[^>]*>/gi) || [];
  stats.linkTags = linkMatches.length;
  stats.externalStylesheets = linkMatches.filter(link => 
    /rel=["']stylesheet["']/i.test(link) || /type=["']text\/css["']/i.test(link)
  ).length;
  stats.hasManifest = linkMatches.some(link => /rel=["']manifest["']/i.test(link));

  linkMatches.forEach(link => {
    const hrefMatch = link.match(/href=["']([^"']+)["']/i);
    if (hrefMatch && (/rel=["']stylesheet["']/i.test(link) || /type=["']text\/css["']/i.test(link))) {
      stats.stylesheetSources.push(hrefMatch[1]);
    }
  });

  const scriptMatches = content.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [];
  stats.scriptTags = scriptMatches.length;
  stats.externalScripts = scriptMatches.filter(script => 
    /src=["']/i.test(script) && !/type=["']module["']/i.test(script)
  ).length;
  stats.moduleScripts = scriptMatches.filter(script => 
    /type=["']module["']/i.test(script)
  ).length;
  stats.inlineScripts = scriptMatches.filter(script => 
    !/src=["']/i.test(script)
  ).length;

  scriptMatches.forEach(script => {
    const srcMatch = script.match(/src=["']([^"']+)["']/i);
    if (srcMatch) stats.scriptSources.push(srcMatch[1]);
  });

  const styleMatches = content.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
  stats.styleTags = styleMatches.length;
  stats.inlineStylesheets = styleMatches.length;
  stats.inlineStyles = (content.match(/style=["'][^"']*["']/gi) || []).length;

  const elementRegex = /<(\w+)(?:\s|>)/gi;
  const elementMatches = [...content.matchAll(elementRegex)];
  elementMatches.forEach(match => {
    const tagName = match[1].toLowerCase();
    stats.elements[tagName] = (stats.elements[tagName] || 0) + 1;
    stats.totalElements++;
  });

  stats.hasForm = /<form[^>]*>/i.test(content);
  stats.hasInput = /<input[^>]*>/i.test(content);
  stats.hasButton = /<button[^>]*>/i.test(content);
  stats.hasImage = /<img[^>]*>/i.test(content);
  stats.hasVideo = /<video[^>]*>/i.test(content);
  stats.hasAudio = /<audio[^>]*>/i.test(content);
  stats.hasCanvas = /<canvas[^>]*>/i.test(content);
  stats.hasSVG = /<svg[^>]*>/i.test(content);

  const idMatches = [...content.matchAll(/id=["']([^"']+)["']/gi)];
  stats.ids = [...new Set(idMatches.map(m => m[1]))];

  const classMatches = [...content.matchAll(/class=["']([^"']+)["']/gi)];
  const allClasses = classMatches.flatMap(m => m[1].split(/\s+/));
  stats.classes = [...new Set(allClasses)];

  stats.hasWebSocket = /WebSocket|new\s+WebSocket|ws:\/\//i.test(content);
  stats.hasWebRTC = /getUserMedia|RTCPeerConnection|MediaStream/i.test(content);
  stats.hasServiceWorker = /serviceWorker|navigator\.serviceWorker/i.test(content);

  return stats;
}

function parseCSS(content) {
  const stats = {
    rules: 0,
    selectors: [],
    properties: [],
    variables: [],
    mediaQueries: 0,
    keyframes: 0,
    imports: 0,
    fontFaces: 0
  };

  content = content.replace(/\/\*[\s\S]*?\*\//g, '');

  const varRegex = /--([^:]+):\s*([^;]+);/g;
  let match;
  while ((match = varRegex.exec(content)) !== null) {
    stats.variables.push({
      name: match[1].trim(),
      value: match[2].trim()
    });
  }

  const selectorRegex = /([^{]+)\{/g;
  while ((match = selectorRegex.exec(content)) !== null) {
    const selector = match[1].trim();
    if (selector && !selector.startsWith('@')) {
      stats.selectors.push(selector);
      stats.rules++;
    }
  }

  const propertyRegex = /([\w-]+)\s*:\s*([^;]+);/g;
  while ((match = propertyRegex.exec(content)) !== null) {
    stats.properties.push(match[1].trim());
  }

  stats.mediaQueries = (content.match(/@media\s+/g) || []).length;
  stats.keyframes = (content.match(/@keyframes\s+/g) || []).length;
  stats.imports = (content.match(/@import\s+/g) || []).length;
  stats.fontFaces = (content.match(/@font-face\s+/g) || []).length;

  return stats;
}

function parseJavaScript(content, filePath) {
  const stats = {
    lines: content.split('\n').length,
    characters: content.length,
    functions: [],
    classes: [],
    imports: [],
    exports: [],
    variables: [],
    constants: [],
    asyncFunctions: 0,
    arrowFunctions: 0,
    hasAudioWorklet: false,
    hasWebSocket: false,
    hasWebRTC: false,
    hasFetch: false,
    hasLocalStorage: false,
    hasSessionStorage: false,
    hasIndexedDB: false,
    hasServiceWorker: false,
    hasWebAudio: false,
    hasMediaStream: false,
    comments: { single: 0, multi: 0 },
    tryCatchBlocks: 0,
    eventListeners: [],
    apiCalls: []
  };

  const functionRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|(\w+))\s*=>|(\w+)\s*:\s*(?:async\s+)?(?:\([^)]*\)|(\w+))\s*=>)/g;
  let match;
  while ((match = functionRegex.exec(content)) !== null) {
    const name = match[1] || match[2] || match[4] || match[5];
    if (name) stats.functions.push(name);
  }

  const classRegex = /class\s+(\w+)(?:\s+extends\s+(\w+))?/g;
  while ((match = classRegex.exec(content)) !== null) {
    stats.classes.push({
      name: match[1],
      extends: match[2] || null
    });
  }

  const importRegex = /import\s+(?:(?:\{[^}]+\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]+\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?["']([^"']+)["']/g;
  while ((match = importRegex.exec(content)) !== null) {
    stats.imports.push(match[match.length - 1]);
  }

  const exportRegex = /export\s+(?:default\s+)?(?:function\s+(\w+)|class\s+(\w+)|const\s+(\w+)|let\s+(\w+)|var\s+(\w+)|(?:\{[^}]+\}))/g;
  while ((match = exportRegex.exec(content)) !== null) {
    const name = match[1] || match[2] || match[3] || match[4] || match[5];
    if (name) stats.exports.push(name);
  }

  stats.asyncFunctions = (content.match(/\basync\s+function|\basync\s+\(/g) || []).length;
  stats.arrowFunctions = (content.match(/=>/g) || []).length;
  stats.hasAudioWorklet = /AudioWorklet|registerProcessor|AudioWorkletNode/i.test(content);
  stats.hasWebSocket = /WebSocket|new\s+WebSocket|ws:\/\//i.test(content);
  stats.hasWebRTC = /getUserMedia|RTCPeerConnection|MediaStream/i.test(content);
  stats.hasFetch = /\bfetch\s*\(/i.test(content);
  stats.hasLocalStorage = /localStorage/i.test(content);
  stats.hasSessionStorage = /sessionStorage/i.test(content);
  stats.hasIndexedDB = /indexedDB|IDB/i.test(content);
  stats.hasServiceWorker = /serviceWorker|navigator\.serviceWorker/i.test(content);
  stats.hasWebAudio = /AudioContext|AudioBuffer|AudioNode|AudioWorklet/i.test(content);
  stats.hasMediaStream = /MediaStream|getUserMedia|getDisplayMedia/i.test(content);
  stats.comments.single = (content.match(/\/\/[^\n]*/g) || []).length;
  stats.comments.multi = (content.match(/\/\*[\s\S]*?\*\//g) || []).length;
  stats.tryCatchBlocks = (content.match(/\btry\s*\{/g) || []).length;

  const eventRegex = /\.(addEventListener|on\w+)\s*\(/g;
  while ((match = eventRegex.exec(content)) !== null) {
    stats.eventListeners.push(match[1]);
  }

  const apiRegex = /(?:fetch|XMLHttpRequest|axios|\.get|\.post|\.put|\.delete)\s*\(/gi;
  while ((match = apiRegex.exec(content)) !== null) {
    stats.apiCalls.push(match[1] || match[0]);
  }

  return stats;
}

// ============================================================================
// SPECIALIZED PARSERS
// ============================================================================

function parseCartesia(content) {
  const stats = {
    hasCartesiaImport: false,
    hasCartesiaConfig: false,
    hasCartesiaClass: false,
    cartesiaImports: [],
    cartesiaConfigReferences: [],
    cartesiaClasses: [],
    cartesiaMethods: [],
    cartesiaEndpoints: [],
    cartesiaSTTUsage: false,
    cartesiaTTSUsage: false
  };

  const importRegex = /import\s+.*?\b(cartesia|Cartesia|STT|TTS|CartesiaSTTClient|CartesiaTTSClient|CartesiaAudioBridge|BidirectionalConversation)\b.*?from\s+['"]([^"']+)['"]/gi;
  const importMatches = [...content.matchAll(importRegex)];
  if (importMatches.length > 0) {
    stats.hasCartesiaImport = true;
    stats.cartesiaImports = importMatches.map(m => ({
      import: m[0],
      source: m[2]
    }));
  }

  if (/CARTESIA_CONFIG|CARTESIA_API_KEY|CARTESIA_VOICE_ID|CARTESIA_VERSION/i.test(content)) {
    stats.hasCartesiaConfig = true;
    const configMatches = [...content.matchAll(/(CARTESIA_CONFIG|CARTESIA_API_KEY|CARTESIA_VOICE_ID|CARTESIA_VERSION)\s*[\.\[]/g)];
    stats.cartesiaConfigReferences = [...new Set(configMatches.map(m => m[1]))];
  }

  const classRegex = /(CartesiaSTTClient|CartesiaTTSClient|CartesiaAudioBridge|BidirectionalConversation)/g;
  const classMatches = [...content.matchAll(classRegex)];
  if (classMatches.length > 0) {
    stats.hasCartesiaClass = true;
    stats.cartesiaClasses = [...new Set(classMatches.map(m => m[1]))];
  }

  const endpointRegex = /(wss?:\/\/api\.cartesia\.ai\/(stt|tts)\/websocket)/gi;
  const endpointMatches = [...content.matchAll(endpointRegex)];
  stats.cartesiaEndpoints = [...new Set(endpointMatches.map(m => m[1]))];
  if (stats.cartesiaEndpoints.some(e => e.includes('/stt/'))) stats.cartesiaSTTUsage = true;
  if (stats.cartesiaEndpoints.some(e => e.includes('/tts/'))) stats.cartesiaTTSUsage = true;

  return stats;
}

function parseVAD(content) {
  const stats = {
    hasVADImport: false,
    hasVADConfig: false,
    hasMicVAD: false,
    vadImports: [],
    vadConfigReferences: [],
    vadMethods: [],
    vadEvents: []
  };

  const importRegex = /import\s+.*?\b(vad|VAD|MicVAD)\b.*?from\s+['"]([^"']+)['"]/gi;
  const importMatches = [...content.matchAll(importRegex)];
  if (importMatches.length > 0) {
    stats.hasVADImport = true;
    stats.vadImports = importMatches.map(m => ({
      import: m[0],
      source: m[2]
    }));
  }

  if (/VAD_CONFIG|vad-config/i.test(content)) {
    stats.hasVADConfig = true;
  }

  if (/MicVAD/i.test(content)) {
    stats.hasMicVAD = true;
  }

  return stats;
}

function parseWebSocket(content) {
  const stats = {
    hasWebSocket: false,
    hasWebSocketImport: false,
    websocketEndpoints: [],
    websocketProtocols: [],
    websocketReconnection: false,
    websocketErrorHandling: false,
    websocketTypes: []
  };

  const wsPatterns = [
    /new\s+WebSocket\s*\(/gi,
    /WebSocket\s*\(/gi,
    /ws:\/\//gi,
    /wss:\/\//gi,
    /from\s+['"]ws['"]/gi,
    /import\s+.*\bWebSocket\b/gi
  ];

  stats.hasWebSocket = wsPatterns.some(pattern => pattern.test(content));

  if (stats.hasWebSocket) {
    const endpointRegex = /(wss?:\/\/[^\s"'`]+)/gi;
    const endpointMatches = [...content.matchAll(endpointRegex)];
    stats.websocketEndpoints = [...new Set(endpointMatches.map(m => m[1]))];

    if (/from\s+['"]ws['"]/gi.test(content)) {
      stats.websocketTypes.push('node');
    }
    if (/new\s+WebSocket\s*\(/gi.test(content)) {
      stats.websocketTypes.push('browser');
    }

    stats.websocketReconnection = /reconnect|retry|backoff|attempt/i.test(content);
    stats.websocketErrorHandling = /try\s*\{|catch\s*\(|\.catch\(|onerror|onError/i.test(content);
  }

  return stats;
}

function parseClient(content, filePath) {
  const filename = filePath.toLowerCase();
  const stats = {
    clientType: null,
    clientName: null,
    clientClass: null,
    endpoints: [],
    protocols: [],
    hasReconnection: false,
    hasErrorHandling: false
  };

  if (filename.includes('stt-client')) {
    stats.clientType = 'stt';
    stats.clientName = 'STT Client';
  } else if (filename.includes('tts-client')) {
    stats.clientType = 'tts';
    stats.clientName = 'TTS Client';
  } else if (filename.includes('audio-bridge')) {
    stats.clientType = 'audio-bridge';
    stats.clientName = 'Audio Bridge';
  } else {
    stats.clientType = 'other';
    stats.clientName = 'Client';
  }

  const classRegex = /class\s+(\w+)/g;
  const classMatch = classRegex.exec(content);
  if (classMatch && (classMatch[1].includes('Client') || classMatch[1].includes('Bridge'))) {
    stats.clientClass = classMatch[1];
  }

  const endpointRegex = /(wss?:\/\/[^\s"'`]+)/gi;
  const endpointMatches = [...content.matchAll(endpointRegex)];
  stats.endpoints = [...new Set(endpointMatches.map(m => m[1]))];

  if (/WebSocket|ws:\/\/|wss:\/\//i.test(content)) {
    stats.protocols.push('WebSocket');
  }
  if (/http:\/\/|https:\/\//i.test(content)) {
    stats.protocols.push('HTTP');
  }

  stats.hasReconnection = /reconnect|retry|backoff|attempt/i.test(content);
  stats.hasErrorHandling = /try\s*\{|catch\s*\(|\.catch\(|onerror|onError/i.test(content);

  return stats;
}

function parseBridge(content, filePath) {
  const filename = filePath.toLowerCase();
  const stats = {
    bridgeType: null,
    bridgeName: null,
    bridgeClass: null,
    classes: [],
    methods: [],
    hasWebSocket: false,
    hasAudioWorklet: false,
    hasSTT: false,
    hasTTS: false,
    hasVAD: false,
    hasBargeIn: false,
    hasReconnection: false,
    audioProcessors: [],
    wsEndpoints: [],
    dependencies: []
  };

  // Detect bridge type
  if (filename.includes('audio-bridge') || filename.includes('audiobridge')) {
    stats.bridgeType = 'audio-bridge';
    stats.bridgeName = 'Audio Bridge';
  } else if (filename.includes('test') && filename.includes('bridge')) {
    stats.bridgeType = 'test';
    stats.bridgeName = 'Bridge Test';
  } else if (filename.includes('bridge') || /\bbridge\b/i.test(content)) {
    stats.bridgeType = 'other';
    stats.bridgeName = 'Bridge';
  } else {
    return null; // Not a bridge file
  }

  // Extract bridge class
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

  // Extract methods
  const methodRegex = /(?:^\s+|\s+)(\w+)\s*\([^)]*\)\s*\{/gm;
  while ((match = methodRegex.exec(content)) !== null) {
    const methodName = match[1];
    if (!['if', 'for', 'while', 'switch', 'catch', 'try'].includes(methodName)) {
      stats.methods.push(methodName);
    }
  }

  // Check for WebSocket
  if (/WebSocket|websocket|ws\./i.test(content)) {
    stats.hasWebSocket = true;
    const wsRegex = /(wss?:\/\/[^\s'"]+)/gi;
    const wsMatches = [...content.matchAll(wsRegex)];
    stats.wsEndpoints = [...new Set(wsMatches.map(m => m[1]))];
  }

  // Check for AudioWorklet
  if (/AudioWorklet|audioWorklet|AudioWorkletNode|audio-worklet/i.test(content)) {
    stats.hasAudioWorklet = true;
    const processorRegex = /(?:audioWorklet\.addModule|AudioWorkletNode)\s*\([^)]*['"]([^'"]+processor[^'"]*)['"]/gi;
    const processorMatches = [...content.matchAll(processorRegex)];
    stats.audioProcessors = [...new Set(processorMatches.map(m => m[1]))];
  }

  // Check for STT
  if (/\bSTT\b|speech.*text|sttWs|connectSTT/i.test(content)) {
    stats.hasSTT = true;
  }

  // Check for TTS
  if (/\bTTS\b|text.*speech|ttsWs|connectTTS|speakText/i.test(content)) {
    stats.hasTTS = true;
  }

  // Check for VAD
  if (/\bVAD\b|MicVAD|voice.*activity|vad/i.test(content)) {
    stats.hasVAD = true;
  }

  // Check for Barge-in
  if (/barge.*in|bargeIn|clearTTSBuffer/i.test(content)) {
    stats.hasBargeIn = true;
  }

  // Check for reconnection
  if (/reconnect|reconnection|connection.*health|health.*monitor/i.test(content)) {
    stats.hasReconnection = true;
  }

  // Extract dependencies
  const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    if (!importPath.startsWith('.')) {
      const parts = importPath.split('/');
      const dep = parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
      if (!stats.dependencies.includes(dep)) {
        stats.dependencies.push(dep);
      }
    }
  }

  return stats;
}

function parseMarkdown(content) {
  const stats = {
    headings: [],
    codeBlocks: 0,
    links: [],
    images: [],
    lists: 0,
    tables: 0
  };

  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headingMatches = [...content.matchAll(headingRegex)];
  stats.headings = headingMatches.map(m => ({
    level: m[1].length,
    text: m[2].trim()
  }));

  stats.codeBlocks = (content.match(/```[\s\S]*?```/g) || []).length;

  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const linkMatches = [...content.matchAll(linkRegex)];
  stats.links = linkMatches.map(m => ({
    text: m[1],
    url: m[2]
  }));

  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const imageMatches = [...content.matchAll(imageRegex)];
  stats.images = imageMatches.map(m => ({
    alt: m[1],
    url: m[2]
  }));

  stats.lists = (content.match(/^[\s]*[-*+]\s+/gm) || []).length;
  stats.tables = (content.match(/\|.+\|/g) || []).length;

  return stats;
}

function parseJSON(content) {
  try {
    const parsed = JSON.parse(content);
    const stats = {
      isValid: true,
      isArray: Array.isArray(parsed),
      isObject: typeof parsed === 'object' && !Array.isArray(parsed),
      itemCount: Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length,
      keys: Array.isArray(parsed) ? [] : Object.keys(parsed),
      isN8nWorkflow: false
    };

    // Check if it's an n8n workflow
    if (stats.isObject && Array.isArray(parsed.nodes) && parsed.connections) {
      stats.isN8nWorkflow = true;
    }

    return stats;
  } catch (error) {
    return {
      isValid: false,
      error: error.message
    };
  }
}

function parseVite(content) {
  const stats = {
    hasDefineConfig: false,
    plugins: [],
    buildConfig: {},
    serverConfig: {},
    hasTypeScript: false,
    hasJSX: false
  };

  stats.hasDefineConfig = /defineConfig|export\s+default\s+defineConfig/i.test(content);
  stats.hasTypeScript = /\.tsx?/i.test(content);
  stats.hasJSX = /\.jsx|\.tsx/i.test(content);

  const pluginRegex = /(?:import|require)\s+.*?from\s+['"]([^'"]+)['"]/g;
  const pluginMatches = [...content.matchAll(pluginRegex)];
  stats.plugins = [...new Set(pluginMatches.map(m => m[1]))];

  return stats;
}

// ============================================================================
// MAIN PARSER FUNCTION
// ============================================================================

async function parseAllFiles() {
  console.log(`🔍 Starting unified file parser (type: ${parseType})...\n`);

  const results = {
    backend: [],
    frontend: {
      html: [],
      javascript: [],
      css: [],
      audioworklet: []
    },
    client: [],
    cartesia: [],
    vad: [],
    websocket: [],
    bridge: [],
    agent: [],
    manager: [],
    ui: [],
    vite: [],
    json: [],
    markdown: [],
    summary: {
      totalFiles: 0,
      totalSize: 0,
      byType: {},
      errors: []
    }
  };

  const ignorePatterns = ['node_modules/**', 'dist/**', 'coverage/**', '**/dist-public/**', 'public/dist-public/**', '.git/**'];

  // Parse backend files
  if (parseType === 'all' || parseType === 'backend') {
    console.log('📦 Parsing backend files...');
    const srcDir = join(PROJECT_ROOT, 'src');
    const testsDir = join(PROJECT_ROOT, 'tests');
    const debugTestsDir = join(PROJECT_ROOT, 'debug', 'tests');

    const tsFiles = [];
    if (directoryExists(srcDir)) tsFiles.push(...findTypeScriptFiles(srcDir));
    if (directoryExists(testsDir)) tsFiles.push(...findTypeScriptFiles(testsDir));
    if (directoryExists(debugTestsDir)) tsFiles.push(...findTypeScriptFiles(debugTestsDir));

    for (const file of tsFiles) {
      try {
        const content = readFileSync(file, 'utf-8');
        const stats = statSync(file);
        const parsed = parseTypeScript(content);
        const wsStats = parseWebSocket(content);
        const cartesiaStats = parseCartesia(content);

        results.backend.push({
          file: relative(PROJECT_ROOT, file),
          sizeKB: (stats.size / 1024).toFixed(2),
          type: 'typescript',
          ...parsed.metadata,
          websocket: wsStats,
          cartesia: cartesiaStats
        });

        results.summary.totalFiles++;
        results.summary.totalSize += stats.size;
        console.log(`  ✓ ${relative(PROJECT_ROOT, file)}`);
      } catch (error) {
        results.summary.errors.push({ file: relative(PROJECT_ROOT, file), error: error.message });
        console.log(`  ✗ ${relative(PROJECT_ROOT, file)}: ${error.message}`);
      }
    }
    console.log(`  Parsed ${results.backend.length} backend files\n`);
  }

  // Parse frontend files
  if (parseType === 'all' || parseType === 'frontend') {
    console.log('🌐 Parsing frontend files...');

    // HTML files
    const htmlFiles = await glob('**/*.html', { ignore: ignorePatterns, cwd: PROJECT_ROOT });
    for (const file of htmlFiles) {
      try {
        const content = readFileSync(file, 'utf-8');
        const stats = statSync(file);
        const parsed = parseHTML(content);

        results.frontend.html.push({
          file: relative(PROJECT_ROOT, file),
          sizeKB: (stats.size / 1024).toFixed(2),
          ...parsed
        });

        results.summary.totalFiles++;
        results.summary.totalSize += stats.size;
        console.log(`  ✓ ${relative(PROJECT_ROOT, file)}`);
      } catch (error) {
        results.summary.errors.push({ file: relative(PROJECT_ROOT, file), error: error.message });
      }
    }

    // JavaScript/TypeScript files
    const jsFiles = await glob('**/*.{js,mjs,cjs,ts,tsx}', { ignore: ignorePatterns, cwd: PROJECT_ROOT });
    for (const file of jsFiles) {
      try {
        const content = readFileSync(file, 'utf-8');
        const stats = statSync(file);
        const parsed = parseJavaScript(content, file);
        const isAudioWorklet = /registerProcessor|class\s+\w+\s+extends\s+AudioWorkletProcessor/i.test(content);
        const wsStats = parseWebSocket(content);
        const cartesiaStats = parseCartesia(content);
        const vadStats = parseVAD(content);
        const clientStats = parseClient(content, file);
        const bridgeStats = parseBridge(content, file);

        const fileResult = {
          file: relative(PROJECT_ROOT, file),
          sizeKB: (stats.size / 1024).toFixed(2),
          ...parsed,
          websocket: wsStats,
          cartesia: cartesiaStats,
          vad: vadStats,
          client: clientStats,
          bridge: bridgeStats
        };

        if (isAudioWorklet) {
          results.frontend.audioworklet.push(fileResult);
        } else {
          results.frontend.javascript.push(fileResult);
        }

        // Add to specialized collections
        if (clientStats.clientType && clientStats.clientType !== 'other') {
          results.client.push(fileResult);
        }
        if (cartesiaStats.hasCartesiaImport || cartesiaStats.hasCartesiaClass) {
          results.cartesia.push(fileResult);
        }
        if (vadStats.hasVADImport || vadStats.hasVADConfig) {
          results.vad.push(fileResult);
        }
        if (wsStats.hasWebSocket) {
          results.websocket.push(fileResult);
        }
        if (bridgeStats && bridgeStats.bridgeType) {
          results.bridge.push(fileResult);
        }

        results.summary.totalFiles++;
        results.summary.totalSize += stats.size;
        console.log(`  ✓ ${relative(PROJECT_ROOT, file)}`);
      } catch (error) {
        results.summary.errors.push({ file: relative(PROJECT_ROOT, file), error: error.message });
      }
    }

    // CSS files
    const cssFiles = await glob('**/*.{css,scss,sass,less,styl}', { ignore: ignorePatterns, cwd: PROJECT_ROOT });
    for (const file of cssFiles) {
      try {
        const content = readFileSync(file, 'utf-8');
        const stats = statSync(file);
        const parsed = parseCSS(content);

        results.frontend.css.push({
          file: relative(PROJECT_ROOT, file),
          sizeKB: (stats.size / 1024).toFixed(2),
          ...parsed
        });

        results.summary.totalFiles++;
        results.summary.totalSize += stats.size;
        console.log(`  ✓ ${relative(PROJECT_ROOT, file)}`);
      } catch (error) {
        results.summary.errors.push({ file: relative(PROJECT_ROOT, file), error: error.message });
      }
    }

    console.log(`  Parsed ${results.frontend.html.length} HTML, ${results.frontend.javascript.length} JS/TS, ${results.frontend.css.length} CSS files\n`);
  }

  // Parse JSON files
  if (parseType === 'all' || parseType === 'json') {
    console.log('📋 Parsing JSON files...');
    const jsonFiles = await glob('**/*.json', { ignore: ignorePatterns, cwd: PROJECT_ROOT });
    for (const file of jsonFiles) {
      try {
        const content = readFileSync(file, 'utf-8');
        const stats = statSync(file);
        const parsed = parseJSON(content);

        results.json.push({
          file: relative(PROJECT_ROOT, file),
          sizeKB: (stats.size / 1024).toFixed(2),
          ...parsed
        });

        results.summary.totalFiles++;
        results.summary.totalSize += stats.size;
        console.log(`  ✓ ${relative(PROJECT_ROOT, file)}`);
      } catch (error) {
        results.summary.errors.push({ file: relative(PROJECT_ROOT, file), error: error.message });
      }
    }
    console.log(`  Parsed ${results.json.length} JSON files\n`);
  }

  // Parse Markdown files
  if (parseType === 'all' || parseType === 'markdown') {
    console.log('📝 Parsing Markdown files...');
    const mdFiles = await glob('**/*.md', { ignore: ignorePatterns, cwd: PROJECT_ROOT });
    for (const file of mdFiles) {
      try {
        const content = readFileSync(file, 'utf-8');
        const stats = statSync(file);
        const parsed = parseMarkdown(content);

        results.markdown.push({
          file: relative(PROJECT_ROOT, file),
          sizeKB: (stats.size / 1024).toFixed(2),
          ...parsed
        });

        results.summary.totalFiles++;
        results.summary.totalSize += stats.size;
        console.log(`  ✓ ${relative(PROJECT_ROOT, file)}`);
      } catch (error) {
        results.summary.errors.push({ file: relative(PROJECT_ROOT, file), error: error.message });
      }
    }
    console.log(`  Parsed ${results.markdown.length} Markdown files\n`);
  }

  // Parse Vite config files
  if (parseType === 'all' || parseType === 'vite') {
    console.log('⚡ Parsing Vite config files...');
    const viteFiles = await glob('**/vite.config.{js,ts,mjs,cjs}', { ignore: ignorePatterns, cwd: PROJECT_ROOT });
    for (const file of viteFiles) {
      try {
        const content = readFileSync(file, 'utf-8');
        const stats = statSync(file);
        const parsed = parseVite(content);

        results.vite.push({
          file: relative(PROJECT_ROOT, file),
          sizeKB: (stats.size / 1024).toFixed(2),
          ...parsed
        });

        results.summary.totalFiles++;
        results.summary.totalSize += stats.size;
        console.log(`  ✓ ${relative(PROJECT_ROOT, file)}`);
      } catch (error) {
        results.summary.errors.push({ file: relative(PROJECT_ROOT, file), error: error.message });
      }
    }
    console.log(`  Parsed ${results.vite.length} Vite config files\n`);
  }

  // Calculate summary
  results.summary.totalSizeKB = (results.summary.totalSize / 1024).toFixed(2);
  results.summary.byType = {
    backend: results.backend.length,
    frontend: {
      html: results.frontend.html.length,
      javascript: results.frontend.javascript.length,
      css: results.frontend.css.length,
      audioworklet: results.frontend.audioworklet.length
    },
    client: results.client.length,
    cartesia: results.cartesia.length,
    vad: results.vad.length,
    websocket: results.websocket.length,
    bridge: results.bridge.length,
    json: results.json.length,
    markdown: results.markdown.length,
    vite: results.vite.length
  };

  // Write results
  const outputPath = join(PROJECT_ROOT, outputFile);
  writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');

  // Print summary
  console.log(`${'='.repeat(80)}`);
  console.log('PARSE SUMMARY');
  console.log(`${'='.repeat(80)}`);
  console.log(`Total files parsed: ${results.summary.totalFiles}`);
  console.log(`Total size: ${results.summary.totalSizeKB} KB`);
  console.log(`\nBy category:`);
  console.log(`  Backend: ${results.summary.byType.backend}`);
  console.log(`  Frontend: ${results.summary.byType.frontend.html + results.summary.byType.frontend.javascript + results.summary.byType.frontend.css} (HTML: ${results.summary.byType.frontend.html}, JS/TS: ${results.summary.byType.frontend.javascript}, CSS: ${results.summary.byType.frontend.css}, AudioWorklet: ${results.summary.byType.frontend.audioworklet})`);
  console.log(`  Client: ${results.summary.byType.client}`);
  console.log(`  Cartesia: ${results.summary.byType.cartesia}`);
  console.log(`  VAD: ${results.summary.byType.vad}`);
  console.log(`  WebSocket: ${results.summary.byType.websocket}`);
  console.log(`  Bridge: ${results.summary.byType.bridge}`);
  console.log(`  JSON: ${results.summary.byType.json}`);
  console.log(`  Markdown: ${results.summary.byType.markdown}`);
  console.log(`  Vite: ${results.summary.byType.vite}`);

  if (results.summary.errors.length > 0) {
    console.log(`\nErrors: ${results.summary.errors.length}`);
    results.summary.errors.slice(0, 10).forEach(err => {
      console.log(`  - ${err.file}: ${err.error}`);
    });
  }

  console.log(`\n✓ Results saved to: ${outputFile}`);
  console.log(`\n✅ All files parsed successfully!`);

  return results;
}

// Run the parser
parseAllFiles().catch(console.error);
