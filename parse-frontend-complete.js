#!/usr/bin/env node
/**
 * Complete Frontend Parser
 * Parses all frontend files across the entire project:
 * - All .js, .mjs, .cjs, .ts, and .tsx files
 * - HTML files in public/
 * - CSS files in public/
 * - AudioWorklet processors
 * Creates a comprehensive analysis of the entire codebase
 */

import { readFileSync, statSync, readdirSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { fileURLToPath } from 'url';
import { dirname, join, relative } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = __dirname;
const PUBLIC_DIR = join(PROJECT_ROOT, 'public');

// HTML Parser
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

  // Extract DOCTYPE
  const doctypeMatch = content.match(/<!DOCTYPE\s+[^>]+>/i);
  if (doctypeMatch) {
    stats.doctype = doctypeMatch[0];
  }

  // Extract title
  const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    stats.title = titleMatch[1].trim();
  }

  // Extract lang attribute
  const langMatch = content.match(/<html[^>]*\s+lang=["']([^"']+)["']/i);
  if (langMatch) {
    stats.lang = langMatch[1];
  }

  // Count meta tags
  stats.metaTags = (content.match(/<meta[^>]*>/gi) || []).length;

  // Count link tags
  const linkMatches = content.match(/<link[^>]*>/gi) || [];
  stats.linkTags = linkMatches.length;
  stats.externalStylesheets = linkMatches.filter(link => 
    /rel=["']stylesheet["']/i.test(link) || /type=["']text\/css["']/i.test(link)
  ).length;
  stats.hasManifest = linkMatches.some(link => /rel=["']manifest["']/i.test(link));
  
  // Extract stylesheet sources
  linkMatches.forEach(link => {
    const hrefMatch = link.match(/href=["']([^"']+)["']/i);
    if (hrefMatch && (/rel=["']stylesheet["']/i.test(link) || /type=["']text\/css["']/i.test(link))) {
      stats.stylesheetSources.push(hrefMatch[1]);
    }
  });

  // Count script tags
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
  
  // Extract script sources
  scriptMatches.forEach(script => {
    const srcMatch = script.match(/src=["']([^"']+)["']/i);
    if (srcMatch) {
      stats.scriptSources.push(srcMatch[1]);
    }
  });

  // Count style tags
  const styleMatches = content.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
  stats.styleTags = styleMatches.length;
  stats.inlineStylesheets = styleMatches.length;

  // Count inline styles (style attribute)
  stats.inlineStyles = (content.match(/style=["'][^"']*["']/gi) || []).length;

  // Extract all HTML elements
  const elementRegex = /<(\w+)(?:\s|>)/gi;
  const elementMatches = [...content.matchAll(elementRegex)];
  elementMatches.forEach(match => {
    const tagName = match[1].toLowerCase();
    stats.elements[tagName] = (stats.elements[tagName] || 0) + 1;
    stats.totalElements++;
  });

  // Check for specific elements
  stats.hasForm = /<form[^>]*>/i.test(content);
  stats.hasInput = /<input[^>]*>/i.test(content);
  stats.hasButton = /<button[^>]*>/i.test(content);
  stats.hasImage = /<img[^>]*>/i.test(content);
  stats.hasVideo = /<video[^>]*>/i.test(content);
  stats.hasAudio = /<audio[^>]*>/i.test(content);
  stats.hasCanvas = /<canvas[^>]*>/i.test(content);
  stats.hasSVG = /<svg[^>]*>/i.test(content);

  // Extract IDs
  const idMatches = [...content.matchAll(/id=["']([^"']+)["']/gi)];
  stats.ids = [...new Set(idMatches.map(m => m[1]))];

  // Extract classes
  const classMatches = [...content.matchAll(/class=["']([^"']+)["']/gi)];
  const allClasses = classMatches.flatMap(m => m[1].split(/\s+/));
  stats.classes = [...new Set(allClasses)];

  // Check for WebSocket usage
  stats.hasWebSocket = /WebSocket|new\s+WebSocket|ws:\/\//i.test(content);

  // Check for WebRTC usage
  stats.hasWebRTC = /getUserMedia|RTCPeerConnection|MediaStream/i.test(content);

  // Check for Service Worker
  stats.hasServiceWorker = /serviceWorker|navigator\.serviceWorker/i.test(content);

  return stats;
}

// JavaScript Parser
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

  const lines = content.split('\n');

  // Extract functions
  const functionRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|(\w+))\s*=>|(\w+)\s*:\s*(?:async\s+)?(?:\([^)]*\)|(\w+))\s*=>)/g;
  let match;
  while ((match = functionRegex.exec(content)) !== null) {
    const name = match[1] || match[2] || match[4] || match[5];
    if (name) {
      stats.functions.push(name);
    }
  }

  // Extract classes
  const classRegex = /class\s+(\w+)(?:\s+extends\s+(\w+))?/g;
  while ((match = classRegex.exec(content)) !== null) {
    stats.classes.push({
      name: match[1],
      extends: match[2] || null
    });
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

  // Count async functions
  stats.asyncFunctions = (content.match(/\basync\s+function|\basync\s+\(/g) || []).length;

  // Count arrow functions
  stats.arrowFunctions = (content.match(/=>/g) || []).length;

  // Check for AudioWorklet
  stats.hasAudioWorklet = /AudioWorklet|registerProcessor|AudioWorkletNode/i.test(content);

  // Check for WebSocket
  stats.hasWebSocket = /WebSocket|new\s+WebSocket|ws:\/\//i.test(content);

  // Check for WebRTC
  stats.hasWebRTC = /getUserMedia|RTCPeerConnection|MediaStream/i.test(content);

  // Check for Fetch API
  stats.hasFetch = /\bfetch\s*\(/i.test(content);

  // Check for LocalStorage
  stats.hasLocalStorage = /localStorage/i.test(content);

  // Check for SessionStorage
  stats.hasSessionStorage = /sessionStorage/i.test(content);

  // Check for IndexedDB
  stats.hasIndexedDB = /indexedDB|IDB/i.test(content);

  // Check for Service Worker
  stats.hasServiceWorker = /serviceWorker|navigator\.serviceWorker/i.test(content);

  // Check for Web Audio API
  stats.hasWebAudio = /AudioContext|AudioBuffer|AudioNode|AudioWorklet/i.test(content);

  // Check for MediaStream
  stats.hasMediaStream = /MediaStream|getUserMedia|getDisplayMedia/i.test(content);

  // Count comments
  stats.comments.single = (content.match(/\/\/[^\n]*/g) || []).length;
  stats.comments.multi = (content.match(/\/\*[\s\S]*?\*\//g) || []).length;

  // Count try-catch blocks
  stats.tryCatchBlocks = (content.match(/\btry\s*\{/g) || []).length;

  // Extract event listeners
  const eventRegex = /\.(addEventListener|on\w+)\s*\(/g;
  while ((match = eventRegex.exec(content)) !== null) {
    stats.eventListeners.push(match[1]);
  }

  // Extract API calls (fetch, XMLHttpRequest, etc.)
  const apiRegex = /(?:fetch|XMLHttpRequest|axios|\.get|\.post|\.put|\.delete)\s*\(/gi;
  while ((match = apiRegex.exec(content)) !== null) {
    stats.apiCalls.push(match[1] || match[0]);
  }

  return stats;
}

// CSS Parser (simplified)
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

  // Remove comments
  content = content.replace(/\/\*[\s\S]*?\*\//g, '');

  // Extract CSS variables
  const varRegex = /--([^:]+):\s*([^;]+);/g;
  let match;
  while ((match = varRegex.exec(content)) !== null) {
    stats.variables.push({
      name: match[1].trim(),
      value: match[2].trim()
    });
  }

  // Extract selectors
  const selectorRegex = /([^{]+)\{/g;
  while ((match = selectorRegex.exec(content)) !== null) {
    const selector = match[1].trim();
    if (selector && !selector.startsWith('@')) {
      stats.selectors.push(selector);
      stats.rules++;
    }
  }

  // Extract properties
  const propertyRegex = /([\w-]+)\s*:\s*([^;]+);/g;
  while ((match = propertyRegex.exec(content)) !== null) {
    stats.properties.push(match[1].trim());
  }

  // Count media queries
  stats.mediaQueries = (content.match(/@media\s+/g) || []).length;

  // Count keyframes
  stats.keyframes = (content.match(/@keyframes\s+/g) || []).length;

  // Count imports
  stats.imports = (content.match(/@import\s+/g) || []).length;

  // Count font-faces
  stats.fontFaces = (content.match(/@font-face\s+/g) || []).length;

  return stats;
}

// Extract embedded CSS from HTML
function extractCSSFromHTML(html) {
  const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  if (!styleMatches) return null;
  
  return styleMatches.map(match => {
    const content = match.replace(/<\/?style[^>]*>/gi, '');
    return content;
  }).join('\n');
}

async function parseCompleteFrontend() {
  console.log('🔍 Parsing all JavaScript files across the entire project...\n');

  const results = {
    html: [],
    javascript: [],
    css: [],
    audioworklet: [],
    summary: {
      totalFiles: 0,
      totalSize: 0,
      htmlFiles: 0,
      jsFiles: 0,
      cssFiles: 0,
      audioworkletFiles: 0
    }
  };

  // Parse HTML files
  console.log('📄 Parsing HTML files...');
  const htmlFiles = await glob('**/*.html', {
    ignore: ['node_modules/**', 'dist/**', 'coverage/**', '**/dist-public/**'],
    cwd: PROJECT_ROOT
  });

  for (const file of htmlFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      const stats = statSync(file);
      const parsed = parseHTML(content);
      const embeddedCSS = extractCSSFromHTML(content);
      
      const result = {
        file: relative(PROJECT_ROOT, file),
        sizeKB: (stats.size / 1024).toFixed(2),
        ...parsed,
        embeddedCSS: embeddedCSS ? parseCSS(embeddedCSS) : null
      };

      results.html.push(result);
      results.summary.htmlFiles++;
      results.summary.totalFiles++;
      results.summary.totalSize += stats.size;

      console.log(`  ✓ ${result.file}`);
    } catch (error) {
      console.log(`  ✗ ${file}: ${error.message}`);
    }
  }

  // Helper function to detect AudioWorklet processor files
  // A processor file must have BOTH: a class extending AudioWorkletProcessor AND a registerProcessor call
  function isAudioWorkletProcessor(content, filePath) {
    // Check for class extending AudioWorkletProcessor
    const hasProcessorClass = /class\s+\w+\s+extends\s+AudioWorkletProcessor/i.test(content);
    // Check for registerProcessor call
    const hasRegisterCall = /registerProcessor\s*\(/i.test(content);
    
    // Both conditions must be true for it to be a processor file
    // Also check if it's in the audio directory with processor naming pattern
    const isProcessorPath = /[\/\\]audio[\/\\].*-processor\.(js|mjs|cjs)$/i.test(filePath);
    
    // Return true if both class and register call exist, OR if it's clearly a processor file by path
    return (hasProcessorClass && hasRegisterCall) || isProcessorPath;
  }

  // Parse JavaScript and TypeScript files - ALL JS/TS files in the project (.js, .mjs, .cjs, .ts, .tsx)
  console.log('\n📜 Parsing JavaScript and TypeScript files...');
  const jsFiles = await glob('**/*.{js,mjs,cjs,ts,tsx}', {
    ignore: ['node_modules/**', 'dist/**', 'coverage/**', '**/dist-public/**', 'public/dist-public/**'],
    cwd: PROJECT_ROOT
  });

  for (const file of jsFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      const stats = statSync(file);
      const parsed = parseJavaScript(content, file);
      
      const isAudioWorklet = isAudioWorkletProcessor(content, file);
      
      const result = {
        file: relative(PROJECT_ROOT, file),
        sizeKB: (stats.size / 1024).toFixed(2),
        ...parsed
      };

      if (isAudioWorklet) {
        results.audioworklet.push(result);
        results.summary.audioworkletFiles++;
      } else {
        results.javascript.push(result);
        results.summary.jsFiles++;
      }
      
      results.summary.totalFiles++;
      results.summary.totalSize += stats.size;

      const fileType = file.endsWith('.ts') || file.endsWith('.tsx') ? ' (TypeScript)' : '';
      console.log(`  ✓ ${result.file}${isAudioWorklet ? ' (AudioWorklet)' : fileType}`);
    } catch (error) {
      console.log(`  ✗ ${file}: ${error.message}`);
    }
  }

  // Parse CSS files - search all directories for CSS files
  console.log('\n🎨 Parsing CSS files...');
  const cssFiles = await glob('**/*.{css,scss,sass,less,styl}', {
    ignore: ['node_modules/**', 'dist/**', 'coverage/**', '**/dist-public/**', 'public/dist-public/**'],
    cwd: PROJECT_ROOT
  });

  for (const file of cssFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      const stats = statSync(file);
      const parsed = parseCSS(content);
      
      const result = {
        file: relative(PROJECT_ROOT, file),
        type: 'css',
        sizeKB: (stats.size / 1024).toFixed(2),
        ...parsed
      };

      results.css.push(result);
      results.summary.cssFiles++;
      results.summary.totalFiles++;
      results.summary.totalSize += stats.size;

      console.log(`  ✓ ${result.file}`);
    } catch (error) {
      console.log(`  ✗ ${file}: ${error.message}`);
    }
  }

  // Add embedded CSS from HTML files to CSS results
  for (const htmlFile of results.html) {
    if (htmlFile.embeddedCSS) {
      const cssData = htmlFile.embeddedCSS;
      if (cssData.rules > 0 || cssData.variables?.length > 0) {
        results.css.push({
          file: htmlFile.file,
          type: 'html-embedded',
          sizeKB: '0.00', // Embedded, no separate file size
          rules: cssData.rules || 0,
          selectors: cssData.selectors || [],
          variables: cssData.variables || [],
          mediaQueries: cssData.mediaQueries || 0
        });
        results.summary.cssFiles++;
        console.log(`  ✓ ${htmlFile.file} (embedded CSS)`);
      }
    }
  }

  // Calculate summary statistics
  results.summary.totalSizeKB = (results.summary.totalSize / 1024).toFixed(2);
  
  results.summary.htmlStats = {
    totalElements: results.html.reduce((sum, h) => sum + (h.totalElements || 0), 0),
    totalScripts: results.html.reduce((sum, h) => sum + (h.scriptTags || 0), 0),
    totalStyles: results.html.reduce((sum, h) => sum + (h.styleTags || 0), 0),
    uniqueIds: [...new Set(results.html.flatMap(h => h.ids || []))].length,
    uniqueClasses: [...new Set(results.html.flatMap(h => h.classes || []))].length
  };

  results.summary.jsStats = {
    totalLines: results.javascript.reduce((sum, j) => sum + (j.lines || 0), 0),
    totalFunctions: results.javascript.reduce((sum, j) => sum + (j.functions.length || 0), 0),
    totalClasses: results.javascript.reduce((sum, j) => sum + (j.classes.length || 0), 0),
    totalImports: results.javascript.reduce((sum, j) => sum + (j.imports.length || 0), 0),
    totalExports: results.javascript.reduce((sum, j) => sum + (j.exports.length || 0), 0),
    filesWithWebSocket: results.javascript.filter(j => j.hasWebSocket).length,
    filesWithWebRTC: results.javascript.filter(j => j.hasWebRTC).length,
    filesWithWebAudio: results.javascript.filter(j => j.hasWebAudio).length
  };

  // Calculate CSS stats including embedded CSS from HTML
  const embeddedCSSStats = results.html
    .filter(h => h.embeddedCSS)
    .reduce((acc, h) => {
      const css = h.embeddedCSS;
      return {
        totalRules: acc.totalRules + (css.rules || 0),
        totalSelectors: acc.totalSelectors + (css.selectors?.length || 0),
        totalVariables: acc.totalVariables + (css.variables?.length || 0),
        totalMediaQueries: acc.totalMediaQueries + (css.mediaQueries || 0)
      };
    }, { totalRules: 0, totalSelectors: 0, totalVariables: 0, totalMediaQueries: 0 });

  results.summary.cssStats = {
    totalRules: results.css.reduce((sum, c) => sum + (c.rules || 0), 0) + embeddedCSSStats.totalRules,
    totalSelectors: results.css.reduce((sum, c) => sum + (c.selectors.length || 0), 0) + embeddedCSSStats.totalSelectors,
    totalVariables: results.css.reduce((sum, c) => sum + (c.variables.length || 0), 0) + embeddedCSSStats.totalVariables,
    totalMediaQueries: results.css.reduce((sum, c) => sum + (c.mediaQueries || 0), 0) + embeddedCSSStats.totalMediaQueries,
    embeddedRules: embeddedCSSStats.totalRules,
    embeddedVariables: embeddedCSSStats.totalVariables,
    embeddedMediaQueries: embeddedCSSStats.totalMediaQueries
  };

  results.summary.audioworkletStats = {
    totalProcessors: results.audioworklet.length,
    processorNames: results.audioworklet.map(a => a.file)
  };

  // Write results to JSON
  const outputFile = join(PROJECT_ROOT, 'frontend-parse-results.json');
  writeFileSync(outputFile, JSON.stringify(results, null, 2), 'utf-8');

  // Print summary
  console.log('\n=== Frontend Parse Summary ===');
  console.log(`Total files: ${results.summary.totalFiles}`);
  console.log(`Total size: ${results.summary.totalSizeKB} KB`);
  console.log(`\nHTML files: ${results.summary.htmlFiles}`);
  console.log(`  Total elements: ${results.summary.htmlStats.totalElements}`);
  console.log(`  Total scripts: ${results.summary.htmlStats.totalScripts}`);
  console.log(`  Total styles: ${results.summary.htmlStats.totalStyles}`);
  console.log(`  Unique IDs: ${results.summary.htmlStats.uniqueIds}`);
  console.log(`  Unique classes: ${results.summary.htmlStats.uniqueClasses}`);
  console.log(`\nJavaScript/TypeScript files: ${results.summary.jsFiles}`);
  console.log(`  Total lines: ${results.summary.jsStats.totalLines.toLocaleString()}`);
  console.log(`  Total functions: ${results.summary.jsStats.totalFunctions}`);
  console.log(`  Total classes: ${results.summary.jsStats.totalClasses}`);
  console.log(`  Total imports: ${results.summary.jsStats.totalImports}`);
  console.log(`  Total exports: ${results.summary.jsStats.totalExports}`);
  console.log(`  Files with WebSocket: ${results.summary.jsStats.filesWithWebSocket}`);
  console.log(`  Files with WebRTC: ${results.summary.jsStats.filesWithWebRTC}`);
  console.log(`  Files with Web Audio: ${results.summary.jsStats.filesWithWebAudio}`);
  console.log(`\nCSS files: ${results.summary.cssFiles}`);
  console.log(`  Total rules: ${results.summary.cssStats.totalRules}`);
  console.log(`  Total selectors: ${results.summary.cssStats.totalSelectors}`);
  console.log(`  Total variables: ${results.summary.cssStats.totalVariables}`);
  console.log(`  Total media queries: ${results.summary.cssStats.totalMediaQueries}`);
  console.log(`\nAudioWorklet processors: ${results.summary.audioworkletStats.totalProcessors}`);
  results.summary.audioworkletStats.processorNames.forEach(name => {
    console.log(`  - ${name}`);
  });

  console.log(`\n✓ Results saved to: ${outputFile}`);
  
  return results;
}

parseCompleteFrontend().catch(console.error);
