#!/usr/bin/env node
/**
 * UI Files Parser
 * Comprehensive parser for all UI-related files:
 * - HTML files (main and debug pages)
 * - Embedded CSS (from <style> tags)
 * - JavaScript UI files (app.js, components, etc.)
 * - UI components, styles, interactions, and structure
 */

import { readFileSync, statSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { fileURLToPath } from 'url';
import { dirname, join, relative } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = __dirname;
const PUBLIC_DIR = join(PROJECT_ROOT, 'public');

// Enhanced HTML Parser for UI Analysis
function parseHTMLForUI(content, filePath) {
  const stats = {
    // Basic info
    doctype: null,
    title: null,
    lang: null,
    
    // Structure
    metaTags: [],
    linkTags: [],
    scriptTags: [],
    styleTags: [],
    
    // UI Elements
    elements: {},
    totalElements: 0,
    interactiveElements: {
      buttons: [],
      inputs: [],
      forms: [],
      links: [],
      selectElements: [],
      textareas: []
    },
    
    // Styling
    ids: [],
    classes: [],
    inlineStyles: 0,
    cssVariables: [],
    
    // UI Components
    components: {
      hasHeader: false,
      hasNav: false,
      hasMain: false,
      hasFooter: false,
      hasSidebar: false,
      hasModal: false,
      hasDropdown: false,
      hasTooltip: false,
      hasToast: false,
      hasChat: false,
      hasInput: false,
      hasMic: false,
      hasAttachment: false
    },
    
    // Embedded resources
    embeddedCSS: null,
    embeddedScripts: [],
    externalScripts: [],
    externalStylesheets: [],
    
    // Features
    features: {
      hasWebSocket: false,
      hasWebRTC: false,
      hasServiceWorker: false,
      hasManifest: false,
      hasAudio: false,
      hasVideo: false,
      hasCanvas: false,
      hasSVG: false,
      hasWebAudio: false,
      hasMediaStream: false
    },
    
    // Accessibility
    accessibility: {
      hasAriaLabels: 0,
      hasAriaRoles: 0,
      hasAltText: 0,
      hasHeadings: 0,
      hasLandmarks: 0
    }
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

  // Extract meta tags with details
  const metaMatches = [...content.matchAll(/<meta[^>]*>/gi)];
  stats.metaTags = metaMatches.map(match => {
    const meta = match[0];
    const nameMatch = meta.match(/name=["']([^"']+)["']/i);
    const propertyMatch = meta.match(/property=["']([^"']+)["']/i);
    const contentMatch = meta.match(/content=["']([^"']+)["']/i);
    return {
      name: nameMatch?.[1] || propertyMatch?.[1] || null,
      content: contentMatch?.[1] || null,
      raw: meta
    };
  });

  // Extract link tags
  const linkMatches = [...content.matchAll(/<link[^>]*>/gi)];
  stats.linkTags = linkMatches.map(match => {
    const link = match[0];
    const relMatch = link.match(/rel=["']([^"']+)["']/i);
    const hrefMatch = link.match(/href=["']([^"']+)["']/i);
    return {
      rel: relMatch?.[1] || null,
      href: hrefMatch?.[1] || null,
      raw: link
    };
  });
  
  stats.externalStylesheets = stats.linkTags.filter(link => 
    link.rel === 'stylesheet' || link.rel === 'preload'
  );

  // Extract script tags
  const scriptMatches = [...content.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
  stats.scriptTags = scriptMatches.map(match => {
    const script = match[0];
    const srcMatch = script.match(/src=["']([^"']+)["']/i);
    const typeMatch = script.match(/type=["']([^"']+)["']/i);
    const isModule = /type=["']module["']/i.test(script);
    const isInline = !srcMatch;
    const content = isInline ? match[1] : null;
    
    if (isInline && content) {
      stats.embeddedScripts.push({
        type: typeMatch?.[1] || 'text/javascript',
        content: content.trim().substring(0, 200) + (content.length > 200 ? '...' : ''),
        length: content.length
      });
    } else if (srcMatch) {
      stats.externalScripts.push({
        src: srcMatch[1],
        type: typeMatch?.[1] || (isModule ? 'module' : 'text/javascript'),
        isModule
      });
    }
    
    return {
      src: srcMatch?.[1] || null,
      type: typeMatch?.[1] || (isModule ? 'module' : 'text/javascript'),
      isModule,
      isInline
    };
  });

  // Extract style tags and CSS
  const styleMatches = [...content.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
  stats.styleTags = styleMatches.map(match => {
    const style = match[0];
    const typeMatch = style.match(/type=["']([^"']+)["']/i);
    const content = match[1];
    return {
      type: typeMatch?.[1] || 'text/css',
      content: content,
      length: content.length
    };
  });
  
  // Combine all embedded CSS
  if (stats.styleTags.length > 0) {
    stats.embeddedCSS = stats.styleTags.map(s => s.content).join('\n');
  }

  // Count inline styles
  stats.inlineStyles = (content.match(/style=["'][^"']*["']/gi) || []).length;

  // Extract all HTML elements
  const elementRegex = /<(\w+)(?:\s[^>]*)?>/gi;
  const elementMatches = [...content.matchAll(elementRegex)];
  elementMatches.forEach(match => {
    const tagName = match[1].toLowerCase();
    stats.elements[tagName] = (stats.elements[tagName] || 0) + 1;
    stats.totalElements++;
  });

  // Extract interactive elements with details
  const buttonMatches = [...content.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/gi)];
  stats.interactiveElements.buttons = buttonMatches.map(match => {
    const button = match[0];
    const idMatch = button.match(/id=["']([^"']+)["']/i);
    const classMatch = button.match(/class=["']([^"']+)["']/i);
    const typeMatch = button.match(/type=["']([^"']+)["']/i);
    const ariaLabelMatch = button.match(/aria-label=["']([^"']+)["']/i);
    return {
      id: idMatch?.[1] || null,
      classes: classMatch?.[1]?.split(/\s+/) || [],
      type: typeMatch?.[1] || 'button',
      ariaLabel: ariaLabelMatch?.[1] || null,
      text: match[1].trim().substring(0, 50)
    };
  });

  const inputMatches = [...content.matchAll(/<input[^>]*>/gi)];
  stats.interactiveElements.inputs = inputMatches.map(match => {
    const input = match[0];
    const idMatch = input.match(/id=["']([^"']+)["']/i);
    const classMatch = input.match(/class=["']([^"']+)["']/i);
    const typeMatch = input.match(/type=["']([^"']+)["']/i);
    const nameMatch = input.match(/name=["']([^"']+)["']/i);
    const placeholderMatch = input.match(/placeholder=["']([^"']+)["']/i);
    return {
      id: idMatch?.[1] || null,
      classes: classMatch?.[1]?.split(/\s+/) || [],
      type: typeMatch?.[1] || 'text',
      name: nameMatch?.[1] || null,
      placeholder: placeholderMatch?.[1] || null
    };
  });

  const textareaMatches = [...content.matchAll(/<textarea[^>]*>([\s\S]*?)<\/textarea>/gi)];
  stats.interactiveElements.textareas = textareaMatches.map(match => {
    const textarea = match[0];
    const idMatch = textarea.match(/id=["']([^"']+)["']/i);
    const classMatch = textarea.match(/class=["']([^"']+)["']/i);
    const nameMatch = textarea.match(/name=["']([^"']+)["']/i);
    const placeholderMatch = textarea.match(/placeholder=["']([^"']+)["']/i);
    return {
      id: idMatch?.[1] || null,
      classes: classMatch?.[1]?.split(/\s+/) || [],
      name: nameMatch?.[1] || null,
      placeholder: placeholderMatch?.[1] || null
    };
  });

  const formMatches = [...content.matchAll(/<form[^>]*>([\s\S]*?)<\/form>/gi)];
  stats.interactiveElements.forms = formMatches.map(match => {
    const form = match[0];
    const idMatch = form.match(/id=["']([^"']+)["']/i);
    const classMatch = form.match(/class=["']([^"']+)["']/i);
    const actionMatch = form.match(/action=["']([^"']+)["']/i);
    const methodMatch = form.match(/method=["']([^"']+)["']/i);
    return {
      id: idMatch?.[1] || null,
      classes: classMatch?.[1]?.split(/\s+/) || [],
      action: actionMatch?.[1] || null,
      method: methodMatch?.[1] || 'get'
    };
  });

  // Extract IDs
  const idMatches = [...content.matchAll(/id=["']([^"']+)["']/gi)];
  stats.ids = [...new Set(idMatches.map(m => m[1]))];

  // Extract classes
  const classMatches = [...content.matchAll(/class=["']([^"']+)["']/gi)];
  const allClasses = classMatches.flatMap(m => m[1].split(/\s+/));
  stats.classes = [...new Set(allClasses)];

  // Extract CSS variables from embedded CSS
  if (stats.embeddedCSS) {
    const varRegex = /--([^:]+):\s*([^;]+);/g;
    let match;
    while ((match = varRegex.exec(stats.embeddedCSS)) !== null) {
      stats.cssVariables.push({
        name: match[1].trim(),
        value: match[2].trim()
      });
    }
  }

  // Detect UI components
  stats.components.hasHeader = /<header[^>]*>/i.test(content) || stats.ids.some(id => /header/i.test(id));
  stats.components.hasNav = /<nav[^>]*>/i.test(content) || stats.ids.some(id => /nav/i.test(id));
  stats.components.hasMain = /<main[^>]*>/i.test(content) || stats.ids.some(id => /main/i.test(id));
  stats.components.hasFooter = /<footer[^>]*>/i.test(content) || stats.ids.some(id => /footer/i.test(id));
  stats.components.hasSidebar = stats.ids.some(id => /sidebar/i.test(id)) || stats.classes.some(cls => /sidebar/i.test(cls));
  stats.components.hasModal = stats.ids.some(id => /modal/i.test(id)) || stats.classes.some(cls => /modal/i.test(cls));
  stats.components.hasDropdown = stats.ids.some(id => /dropdown/i.test(id)) || stats.classes.some(cls => /dropdown/i.test(cls));
  stats.components.hasTooltip = stats.ids.some(id => /tooltip/i.test(id)) || stats.classes.some(cls => /tooltip/i.test(cls));
  stats.components.hasToast = stats.ids.some(id => /toast/i.test(id)) || stats.classes.some(cls => /toast/i.test(cls));
  stats.components.hasChat = stats.ids.some(id => /chat/i.test(id)) || stats.classes.some(cls => /chat/i.test(cls));
  stats.components.hasInput = stats.interactiveElements.inputs.length > 0 || stats.interactiveElements.textareas.length > 0;
  stats.components.hasMic = stats.ids.some(id => /mic|microphone/i.test(id)) || stats.classes.some(cls => /mic|microphone/i.test(cls));
  stats.components.hasAttachment = stats.ids.some(id => /attach|attachment|paperclip/i.test(id)) || stats.classes.some(cls => /attach|attachment|paperclip/i.test(cls));

  // Check for features
  stats.features.hasWebSocket = /WebSocket|new\s+WebSocket|ws:\/\//i.test(content);
  stats.features.hasWebRTC = /getUserMedia|RTCPeerConnection|MediaStream/i.test(content);
  stats.features.hasServiceWorker = /serviceWorker|navigator\.serviceWorker/i.test(content);
  stats.features.hasManifest = stats.linkTags.some(link => link.rel === 'manifest');
  stats.features.hasAudio = /<audio[^>]*>/i.test(content) || stats.elements.audio > 0;
  stats.features.hasVideo = /<video[^>]*>/i.test(content) || stats.elements.video > 0;
  stats.features.hasCanvas = /<canvas[^>]*>/i.test(content) || stats.elements.canvas > 0;
  stats.features.hasSVG = /<svg[^>]*>/i.test(content) || stats.elements.svg > 0;
  stats.features.hasWebAudio = /AudioContext|AudioBuffer|AudioNode|AudioWorklet/i.test(content);
  stats.features.hasMediaStream = /MediaStream|getUserMedia|getDisplayMedia/i.test(content);

  // Accessibility checks
  stats.accessibility.hasAriaLabels = (content.match(/aria-label=["'][^"']+["']/gi) || []).length;
  stats.accessibility.hasAriaRoles = (content.match(/role=["'][^"']+["']/gi) || []).length;
  stats.accessibility.hasAltText = (content.match(/alt=["'][^"']+["']/gi) || []).length;
  stats.accessibility.hasHeadings = (stats.elements.h1 || 0) + (stats.elements.h2 || 0) + (stats.elements.h3 || 0) + (stats.elements.h4 || 0) + (stats.elements.h5 || 0) + (stats.elements.h6 || 0);
  stats.accessibility.hasLandmarks = (stats.elements.header || 0) + (stats.elements.nav || 0) + (stats.elements.main || 0) + (stats.elements.footer || 0) + (stats.elements.aside || 0);

  return stats;
}

// Enhanced CSS Parser
function parseCSSForUI(content) {
  const stats = {
    rules: 0,
    selectors: [],
    properties: [],
    uniqueProperties: [],
    variables: [],
    mediaQueries: [],
    keyframes: [],
    imports: [],
    fontFaces: [],
    animations: [],
    transitions: [],
    flexbox: 0,
    grid: 0,
    customProperties: 0
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
    stats.customProperties++;
  }

  // Extract selectors and rules
  const selectorRegex = /([^{]+)\{([^}]+)\}/g;
  while ((match = selectorRegex.exec(content)) !== null) {
    const selector = match[1].trim();
    const declarations = match[2];
    
    if (selector && !selector.startsWith('@')) {
      stats.selectors.push(selector);
      stats.rules++;
      
      // Extract properties from this rule
      const propertyRegex = /([\w-]+)\s*:\s*([^;]+);/g;
      let propMatch;
      while ((propMatch = propertyRegex.exec(declarations)) !== null) {
        const prop = propMatch[1].trim();
        const value = propMatch[2].trim();
        stats.properties.push(prop);
        if (!stats.uniqueProperties.includes(prop)) {
          stats.uniqueProperties.push(prop);
        }
        
        // Detect specific features
        if (/flex|flexbox/i.test(value)) stats.flexbox++;
        if (/grid/i.test(value)) stats.grid++;
        if (/animation:/i.test(prop) || /animation-name/i.test(prop)) {
          stats.animations.push({ selector, property: prop, value });
        }
        if (/transition:/i.test(prop) || /transition-property/i.test(prop)) {
          stats.transitions.push({ selector, property: prop, value });
        }
      }
    }
  }

  // Extract media queries
  const mediaRegex = /@media\s+([^{]+)\{([\s\S]*?)\}/g;
  while ((match = mediaRegex.exec(content)) !== null) {
    stats.mediaQueries.push({
      query: match[1].trim(),
      rules: (match[2].match(/\{[^}]+\}/g) || []).length
    });
  }

  // Extract keyframes
  const keyframeRegex = /@keyframes\s+(\w+)\s*\{([\s\S]*?)\}/g;
  while ((match = keyframeRegex.exec(content)) !== null) {
    stats.keyframes.push({
      name: match[1],
      steps: (match[2].match(/\d+%|from|to/g) || []).length
    });
  }

  // Extract imports
  const importRegex = /@import\s+["']([^"']+)["']/g;
  while ((match = importRegex.exec(content)) !== null) {
    stats.imports.push(match[1]);
  }

  // Extract font-faces
  const fontFaceRegex = /@font-face\s*\{([^}]+)\}/g;
  while ((match = fontFaceRegex.exec(content)) !== null) {
    const fontFamilyMatch = match[1].match(/font-family:\s*["']?([^"';]+)["']?/i);
    stats.fontFaces.push({
      family: fontFamilyMatch?.[1]?.trim() || 'unknown'
    });
  }

  return stats;
}

// Enhanced JavaScript Parser for UI
function parseJavaScriptForUI(content, filePath) {
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
    
    // UI-specific
    domManipulations: [],
    eventListeners: [],
    uiComponents: [],
    uiState: [],
    
    // Features
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
    apiCalls: []
  };

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

  // Extract DOM manipulations
  const domRegex = /(?:document|window)\.(?:getElementById|getElementsByClassName|getElementsByTagName|querySelector|querySelectorAll)\s*\(/g;
  while ((match = domRegex.exec(content)) !== null) {
    stats.domManipulations.push(match[0]);
  }

  // Extract event listeners
  const eventRegex = /\.(addEventListener|on\w+)\s*\(["']([^"']+)["']/g;
  while ((match = eventRegex.exec(content)) !== null) {
    stats.eventListeners.push({
      method: match[1],
      event: match[2]
    });
  }

  // Extract UI component patterns
  const componentRegex = /(?:class|const|let|var)\s+(\w*(?:Component|Widget|Panel|Modal|Dialog|Button|Input|Form|Chat|Message)[\w]*)/gi;
  while ((match = componentRegex.exec(content)) !== null) {
    if (!stats.uiComponents.includes(match[1])) {
      stats.uiComponents.push(match[1]);
    }
  }

  // Extract state management patterns
  const stateRegex = /(?:state|setState|useState|useEffect|\.state\s*=|this\.state)/gi;
  if (stateRegex.test(content)) {
    stats.uiState.push('detected');
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

  // Check for features
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

  // Count comments
  stats.comments.single = (content.match(/\/\/[^\n]*/g) || []).length;
  stats.comments.multi = (content.match(/\/\*[\s\S]*?\*\//g) || []).length;

  // Count try-catch blocks
  stats.tryCatchBlocks = (content.match(/\btry\s*\{/g) || []).length;

  // Extract API calls
  const apiRegex = /(?:fetch|XMLHttpRequest|axios|\.get|\.post|\.put|\.delete)\s*\(/gi;
  while ((match = apiRegex.exec(content)) !== null) {
    stats.apiCalls.push(match[1] || match[0]);
  }

  return stats;
}

async function parseAllUIFiles() {
  console.log('🎨 Parsing all UI files...\n');

  const results = {
    html: [],
    javascript: [],
    css: [],
    summary: {
      totalFiles: 0,
      totalSize: 0,
      htmlFiles: 0,
      jsFiles: 0,
      cssFiles: 0,
      totalUIComponents: 0,
      totalInteractiveElements: 0,
      totalCSSVariables: 0,
      totalEventListeners: 0
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
      const parsed = parseHTMLForUI(content, file);
      const embeddedCSS = parsed.embeddedCSS ? parseCSSForUI(parsed.embeddedCSS) : null;
      
      const result = {
        file: relative(PROJECT_ROOT, file),
        sizeKB: (stats.size / 1024).toFixed(2),
        ...parsed,
        embeddedCSS: embeddedCSS
      };

      results.html.push(result);
      results.summary.htmlFiles++;
      results.summary.totalFiles++;
      results.summary.totalSize += stats.size;
      results.summary.totalInteractiveElements += 
        parsed.interactiveElements.buttons.length +
        parsed.interactiveElements.inputs.length +
        parsed.interactiveElements.textareas.length +
        parsed.interactiveElements.forms.length;
      results.summary.totalCSSVariables += parsed.cssVariables.length;

      console.log(`  ✓ ${result.file} (${result.sizeKB} KB)`);
      console.log(`    Elements: ${parsed.totalElements}, Buttons: ${parsed.interactiveElements.buttons.length}, Inputs: ${parsed.interactiveElements.inputs.length}`);
      console.log(`    CSS Variables: ${parsed.cssVariables.length}, Components: ${Object.values(parsed.components).filter(Boolean).length}`);
    } catch (error) {
      console.log(`  ✗ ${file}: ${error.message}`);
    }
  }

  // Parse JavaScript UI files
  console.log('\n📜 Parsing JavaScript UI files...');
  const jsFiles = await glob('public/js/**/*.js', {
    ignore: ['node_modules/**', 'dist/**', 'coverage/**'],
    cwd: PROJECT_ROOT
  });

  for (const file of jsFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      const stats = statSync(file);
      const parsed = parseJavaScriptForUI(content, file);
      
      const result = {
        file: relative(PROJECT_ROOT, file),
        sizeKB: (stats.size / 1024).toFixed(2),
        ...parsed
      };

      results.javascript.push(result);
      results.summary.jsFiles++;
      results.summary.totalFiles++;
      results.summary.totalSize += stats.size;
      results.summary.totalEventListeners += parsed.eventListeners.length;
      results.summary.totalUIComponents += parsed.uiComponents.length;

      console.log(`  ✓ ${result.file} (${result.sizeKB} KB)`);
      console.log(`    Functions: ${parsed.functions.length}, Classes: ${parsed.classes.length}, Events: ${parsed.eventListeners.length}`);
    } catch (error) {
      console.log(`  ✗ ${file}: ${error.message}`);
    }
  }

  // Parse standalone CSS files - search all directories for CSS files
  console.log('\n🎨 Parsing CSS files...');
  const cssFiles = await glob('**/*.{css,scss,sass,less,styl}', {
    ignore: ['node_modules/**', 'dist/**', 'coverage/**', '**/dist-public/**', 'public/dist-public/**'],
    cwd: PROJECT_ROOT
  });

  for (const file of cssFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      const stats = statSync(file);
      const parsed = parseCSSForUI(content);
      
      const result = {
        file: relative(PROJECT_ROOT, file),
        sizeKB: (stats.size / 1024).toFixed(2),
        ...parsed
      };

      results.css.push(result);
      results.summary.cssFiles++;
      results.summary.totalFiles++;
      results.summary.totalSize += stats.size;
      results.summary.totalCSSVariables += parsed.variables.length;

      console.log(`  ✓ ${result.file} (${result.sizeKB} KB)`);
      console.log(`    Rules: ${parsed.rules}, Variables: ${parsed.variables.length}, Media Queries: ${parsed.mediaQueries.length}`);
    } catch (error) {
      console.log(`  ✗ ${file}: ${error.message}`);
    }
  }

  // Calculate summary statistics
  results.summary.totalSizeKB = (results.summary.totalSize / 1024).toFixed(2);
  
  results.summary.htmlStats = {
    totalElements: results.html.reduce((sum, h) => sum + (h.totalElements || 0), 0),
    totalButtons: results.html.reduce((sum, h) => sum + (h.interactiveElements?.buttons?.length || 0), 0),
    totalInputs: results.html.reduce((sum, h) => sum + (h.interactiveElements?.inputs?.length || 0), 0),
    totalTextareas: results.html.reduce((sum, h) => sum + (h.interactiveElements?.textareas?.length || 0), 0),
    totalForms: results.html.reduce((sum, h) => sum + (h.interactiveElements?.forms?.length || 0), 0),
    uniqueIds: [...new Set(results.html.flatMap(h => h.ids || []))].length,
    uniqueClasses: [...new Set(results.html.flatMap(h => h.classes || []))].length,
    totalCSSVariables: results.html.reduce((sum, h) => sum + (h.cssVariables?.length || 0), 0),
    componentsFound: {
      chat: results.html.filter(h => h.components?.hasChat).length,
      mic: results.html.filter(h => h.components?.hasMic).length,
      attachment: results.html.filter(h => h.components?.hasAttachment).length,
      modal: results.html.filter(h => h.components?.hasModal).length,
      dropdown: results.html.filter(h => h.components?.hasDropdown).length
    }
  };

  results.summary.jsStats = {
    totalLines: results.javascript.reduce((sum, j) => sum + (j.lines || 0), 0),
    totalFunctions: results.javascript.reduce((sum, j) => sum + (j.functions.length || 0), 0),
    totalClasses: results.javascript.reduce((sum, j) => sum + (j.classes.length || 0), 0),
    totalEventListeners: results.javascript.reduce((sum, j) => sum + (j.eventListeners.length || 0), 0),
    totalDOMManipulations: results.javascript.reduce((sum, j) => sum + (j.domManipulations.length || 0), 0),
    totalUIComponents: results.javascript.reduce((sum, j) => sum + (j.uiComponents.length || 0), 0),
    filesWithWebSocket: results.javascript.filter(j => j.hasWebSocket).length,
    filesWithWebRTC: results.javascript.filter(j => j.hasWebRTC).length,
    filesWithWebAudio: results.javascript.filter(j => j.hasWebAudio).length
  };

  results.summary.cssStats = {
    totalRules: results.css.reduce((sum, c) => sum + (c.rules || 0), 0),
    totalSelectors: results.css.reduce((sum, c) => sum + (c.selectors.length || 0), 0),
    totalVariables: results.css.reduce((sum, c) => sum + (c.variables.length || 0), 0),
    totalMediaQueries: results.css.reduce((sum, c) => sum + (c.mediaQueries.length || 0), 0),
    totalKeyframes: results.css.reduce((sum, c) => sum + (c.keyframes.length || 0), 0),
    totalAnimations: results.css.reduce((sum, c) => sum + (c.animations.length || 0), 0)
  };

  // Add embedded CSS stats from HTML
  const embeddedCSSStats = results.html
    .filter(h => h.embeddedCSS)
    .map(h => h.embeddedCSS)
    .reduce((acc, css) => {
      acc.totalRules += css.rules || 0;
      acc.totalVariables += css.variables?.length || 0;
      acc.totalMediaQueries += css.mediaQueries?.length || 0;
      acc.totalKeyframes += css.keyframes?.length || 0;
      return acc;
    }, { totalRules: 0, totalVariables: 0, totalMediaQueries: 0, totalKeyframes: 0 });
  
  results.summary.cssStats.embeddedRules = embeddedCSSStats.totalRules;
  results.summary.cssStats.embeddedVariables = embeddedCSSStats.totalVariables;
  results.summary.cssStats.embeddedMediaQueries = embeddedCSSStats.totalMediaQueries;
  results.summary.cssStats.embeddedKeyframes = embeddedCSSStats.totalKeyframes;

  // Write results to JSON
  const outputFile = join(PROJECT_ROOT, 'ui-parse-results.json');
  writeFileSync(outputFile, JSON.stringify(results, null, 2), 'utf-8');

  // Print summary
  console.log('\n=== UI Files Parse Summary ===');
  console.log(`Total files: ${results.summary.totalFiles}`);
  console.log(`Total size: ${results.summary.totalSizeKB} KB`);
  console.log(`\n📄 HTML files: ${results.summary.htmlFiles}`);
  console.log(`  Total elements: ${results.summary.htmlStats.totalElements}`);
  console.log(`  Buttons: ${results.summary.htmlStats.totalButtons}`);
  console.log(`  Inputs: ${results.summary.htmlStats.totalInputs}`);
  console.log(`  Textareas: ${results.summary.htmlStats.totalTextareas}`);
  console.log(`  Forms: ${results.summary.htmlStats.totalForms}`);
  console.log(`  Unique IDs: ${results.summary.htmlStats.uniqueIds}`);
  console.log(`  Unique classes: ${results.summary.htmlStats.uniqueClasses}`);
  console.log(`  CSS Variables: ${results.summary.htmlStats.totalCSSVariables}`);
  console.log(`  Components: Chat(${results.summary.htmlStats.componentsFound.chat}), Mic(${results.summary.htmlStats.componentsFound.mic}), Attachment(${results.summary.htmlStats.componentsFound.attachment})`);
  console.log(`\n📜 JavaScript files: ${results.summary.jsFiles}`);
  console.log(`  Total lines: ${results.summary.jsStats.totalLines.toLocaleString()}`);
  console.log(`  Total functions: ${results.summary.jsStats.totalFunctions}`);
  console.log(`  Total classes: ${results.summary.jsStats.totalClasses}`);
  console.log(`  Event listeners: ${results.summary.jsStats.totalEventListeners}`);
  console.log(`  DOM manipulations: ${results.summary.jsStats.totalDOMManipulations}`);
  console.log(`  UI components: ${results.summary.jsStats.totalUIComponents}`);
  console.log(`  Files with WebSocket: ${results.summary.jsStats.filesWithWebSocket}`);
  console.log(`  Files with WebRTC: ${results.summary.jsStats.filesWithWebRTC}`);
  console.log(`  Files with Web Audio: ${results.summary.jsStats.filesWithWebAudio}`);
  console.log(`\n🎨 CSS files: ${results.summary.cssFiles}`);
  console.log(`  Standalone rules: ${results.summary.cssStats.totalRules}`);
  console.log(`  Embedded rules: ${results.summary.cssStats.embeddedRules}`);
  console.log(`  Total variables: ${results.summary.cssStats.totalVariables + results.summary.cssStats.embeddedVariables}`);
  console.log(`  Media queries: ${results.summary.cssStats.totalMediaQueries + results.summary.cssStats.embeddedMediaQueries}`);
  console.log(`  Keyframes: ${results.summary.cssStats.totalKeyframes + results.summary.cssStats.embeddedKeyframes}`);

  console.log(`\n✓ Results saved to: ${outputFile}`);
  
  return results;
}

parseAllUIFiles().catch(console.error);
