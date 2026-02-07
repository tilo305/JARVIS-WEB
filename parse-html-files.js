import { readFileSync, statSync } from 'fs';
import { glob } from 'glob';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple HTML parser to extract basic information
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
    hasManifest: false
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

async function parseAllHtmlFiles() {
  const htmlFiles = await glob('**/*.html', {
    ignore: ['node_modules/**', 'dist/**', 'coverage/**', '**/dist-public/**'],
    cwd: __dirname
  });

  console.log(`Found ${htmlFiles.length} HTML files:\n`);

  const results = [];

  for (const file of htmlFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      const stats = statSync(file);
      const sizeKB = (stats.size / 1024).toFixed(2);
      
      const parsed = parseHTML(content);
      
      results.push({
        file,
        valid: true,
        sizeKB: parseFloat(sizeKB),
        parsed
      });

      console.log(`✓ ${file}`);
      console.log(`  Size: ${sizeKB} KB`);
      console.log(`  DOCTYPE: ${parsed.doctype || 'Not specified'}`);
      console.log(`  Title: ${parsed.title || 'Not specified'}`);
      console.log(`  Language: ${parsed.lang || 'Not specified'}`);
      console.log(`  Total Elements: ${parsed.totalElements}`);
      console.log(`  Scripts: ${parsed.scriptTags} (${parsed.externalScripts} external, ${parsed.inlineScripts} inline, ${parsed.moduleScripts} modules)`);
      console.log(`  Styles: ${parsed.styleTags} inline stylesheets, ${parsed.inlineStyles} inline styles`);
      console.log(`  Links: ${parsed.linkTags} (${parsed.externalStylesheets} stylesheets)`);
      console.log(`  Meta Tags: ${parsed.metaTags}`);
      console.log(`  IDs: ${parsed.ids.length} unique`);
      console.log(`  Classes: ${parsed.classes.length} unique`);
      
      // Show top elements
      const topElements = Object.entries(parsed.elements)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      if (topElements.length > 0) {
        console.log(`  Top Elements: ${topElements.map(([tag, count]) => `${tag}(${count})`).join(', ')}`);
      }
      
      // Show features
      const features = [];
      if (parsed.hasForm) features.push('Form');
      if (parsed.hasInput) features.push('Input');
      if (parsed.hasButton) features.push('Button');
      if (parsed.hasImage) features.push('Image');
      if (parsed.hasVideo) features.push('Video');
      if (parsed.hasAudio) features.push('Audio');
      if (parsed.hasCanvas) features.push('Canvas');
      if (parsed.hasSVG) features.push('SVG');
      if (parsed.hasWebSocket) features.push('WebSocket');
      if (parsed.hasWebRTC) features.push('WebRTC');
      if (parsed.hasServiceWorker) features.push('ServiceWorker');
      if (parsed.hasManifest) features.push('Manifest');
      if (features.length > 0) {
        console.log(`  Features: ${features.join(', ')}`);
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
  const totalElements = results.reduce((sum, r) => sum + (r.parsed?.totalElements || 0), 0);
  const totalScripts = results.reduce((sum, r) => sum + (r.parsed?.scriptTags || 0), 0);
  const totalStyles = results.reduce((sum, r) => sum + (r.parsed?.styleTags || 0), 0);
  
  console.log(`Total files: ${results.length}`);
  console.log(`Valid: ${valid}`);
  console.log(`Invalid: ${invalid}`);
  console.log(`Total size: ${totalSize.toFixed(2)} KB`);
  console.log(`Total elements: ${totalElements}`);
  console.log(`Total scripts: ${totalScripts}`);
  console.log(`Total style tags: ${totalStyles}`);
  
  if (invalid > 0) {
    console.log('\nInvalid files:');
    results.filter(r => !r.valid).forEach(r => {
      console.log(`  - ${r.file}: ${r.error}`);
    });
  }

  // Feature summary
  const featureCounts = {
    forms: results.filter(r => r.parsed?.hasForm).length,
    websockets: results.filter(r => r.parsed?.hasWebSocket).length,
    webrtc: results.filter(r => r.parsed?.hasWebRTC).length,
    serviceWorkers: results.filter(r => r.parsed?.hasServiceWorker).length,
    manifests: results.filter(r => r.parsed?.hasManifest).length
  };
  
  console.log('\n=== Feature Summary ===');
  console.log(`Files with forms: ${featureCounts.forms}`);
  console.log(`Files with WebSocket: ${featureCounts.websockets}`);
  console.log(`Files with WebRTC: ${featureCounts.webrtc}`);
  console.log(`Files with Service Worker: ${featureCounts.serviceWorkers}`);
  console.log(`Files with manifest: ${featureCounts.manifests}`);
}

parseAllHtmlFiles().catch(console.error);
