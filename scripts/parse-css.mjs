#!/usr/bin/env node
/**
 * CSS Parser - Parses all CSS files in the project
 * Extracts selectors, properties, variables, media queries, keyframes, etc.
 */

import { readFile, readdir } from 'fs/promises';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// Simple CSS parser
class CSSParser {
  constructor() {
    this.rules = [];
    this.variables = new Map();
    this.mediaQueries = [];
    this.keyframes = [];
    this.imports = [];
    this.fontFaces = [];
  }

  parse(css, sourceFile) {
    // Remove comments
    css = css.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Extract CSS variables
    this.extractVariables(css, sourceFile);
    
    // Extract @import
    this.extractImports(css, sourceFile);
    
    // Extract @font-face
    this.extractFontFaces(css, sourceFile);
    
    // Extract @keyframes
    this.extractKeyframes(css, sourceFile);
    
    // Extract @media queries
    this.extractMediaQueries(css, sourceFile);
    
    // Extract regular rules
    this.extractRules(css, sourceFile);
  }

  extractVariables(css, sourceFile) {
    const varRegex = /:root\s*\{([^}]+)\}/g;
    let match;
    while ((match = varRegex.exec(css)) !== null) {
      const declarations = match[1];
      const varRegex2 = /--([^:]+):\s*([^;]+);/g;
      let varMatch;
      while ((varMatch = varRegex2.exec(declarations)) !== null) {
        const name = varMatch[1].trim();
        const value = varMatch[2].trim();
        if (!this.variables.has(name)) {
          this.variables.set(name, { value, sourceFile });
        }
      }
    }
  }

  extractImports(css, sourceFile) {
    const importRegex = /@import\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(css)) !== null) {
      this.imports.push({ url: match[1], sourceFile });
    }
  }

  extractFontFaces(css, sourceFile) {
    const fontFaceRegex = /@font-face\s*\{([^}]+)\}/g;
    let match;
    while ((match = fontFaceRegex.exec(css)) !== null) {
      const declarations = match[1];
      const fontFamilyMatch = declarations.match(/font-family:\s*['"]?([^;'"]+)['"]?/);
      if (fontFamilyMatch) {
        this.fontFaces.push({
          family: fontFamilyMatch[1].trim(),
          declarations: declarations.trim(),
          sourceFile
        });
      }
    }
  }

  extractKeyframes(css, sourceFile) {
    const keyframeRegex = /@keyframes\s+([^{]+)\{([^}]+)\}/g;
    let match;
    while ((match = keyframeRegex.exec(css)) !== null) {
      const name = match[1].trim();
      const content = match[2];
      this.keyframes.push({ name, content: content.trim(), sourceFile });
    }
  }

  extractMediaQueries(css, sourceFile) {
    // Simple media query extraction (handles nested braces)
    const mediaRegex = /@media\s+([^{]+)\{/g;
    let match;
    let depth = 0;
    let startPos = 0;
    
    while ((match = mediaRegex.exec(css)) !== null) {
      const query = match[1].trim();
      startPos = match.index + match[0].length;
      depth = 1;
      
      // Find matching closing brace
      for (let i = startPos; i < css.length; i++) {
        if (css[i] === '{') depth++;
        if (css[i] === '}') {
          depth--;
          if (depth === 0) {
            const content = css.substring(startPos, i);
            this.mediaQueries.push({
              query,
              content: content.trim(),
              sourceFile
            });
            break;
          }
        }
      }
    }
  }

  extractRules(css, sourceFile) {
    // Remove @rules we've already processed
    let processedCss = css
      .replace(/@import[^;]+;/g, '')
      .replace(/@font-face\s*\{[^}]+\}/g, '')
      .replace(/@keyframes\s+[^{]+\{[^}]+\}/g, '')
      .replace(/@media\s+[^{]+\{[^}]+\}/g, '');
    
    // Extract selector rules
    const ruleRegex = /([^{]+)\{([^}]+)\}/g;
    let match;
    while ((match = ruleRegex.exec(processedCss)) !== null) {
      const selector = match[1].trim();
      const declarations = match[2].trim();
      
      if (selector && declarations && !selector.includes('@')) {
        const properties = this.parseDeclarations(declarations);
        this.rules.push({
          selector,
          properties,
          sourceFile
        });
      }
    }
  }

  parseDeclarations(declarations) {
    const props = [];
    const propRegex = /([^:]+):\s*([^;]+);?/g;
    let match;
    while ((match = propRegex.exec(declarations)) !== null) {
      props.push({
        property: match[1].trim(),
        value: match[2].trim()
      });
    }
    return props;
  }

  getSummary() {
    return {
      totalRules: this.rules.length,
      totalVariables: this.variables.size,
      totalMediaQueries: this.mediaQueries.length,
      totalKeyframes: this.keyframes.length,
      totalImports: this.imports.length,
      totalFontFaces: this.fontFaces.length,
      uniqueSelectors: new Set(this.rules.map(r => r.selector)).size,
      uniqueProperties: new Set(this.rules.flatMap(r => r.properties.map(p => p.property))).size
    };
  }
}

async function findCSSFiles(rootDir, excludeDirs = ['node_modules', '.git', 'dist', 'dist-public']) {
  const cssFiles = [];
  const htmlFiles = [];
  
  async function walkDir(dir, relativePath = '') {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relPath = join(relativePath, entry.name);
        
        if (entry.isDirectory()) {
          if (!excludeDirs.some(ex => relPath.includes(ex))) {
            await walkDir(fullPath, relPath);
          }
        } else if (entry.isFile()) {
          if (entry.name.endsWith('.css')) {
            cssFiles.push(fullPath);
          } else if (entry.name.endsWith('.html')) {
            htmlFiles.push(fullPath);
          }
        }
      }
    } catch {
      // Skip directories we can't read
    }
  }
  
  await walkDir(rootDir);
  return { cssFiles, htmlFiles };
}

async function extractCSSFromHTML(htmlFile) {
  try {
    const content = await readFile(htmlFile, 'utf-8');
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    const styles = [];
    let match;
    
    while ((match = styleRegex.exec(content)) !== null) {
      styles.push(match[1]);
    }
    
    return styles.length > 0 ? styles.join('\n\n') : null;
  } catch {
    return null;
  }
}

async function parseAllCSS() {
  console.log('🔍 Finding CSS files...\n');
  
  const { cssFiles, htmlFiles } = await findCSSFiles(PROJECT_ROOT);
  
  console.log(`Found ${cssFiles.length} CSS files:`);
  cssFiles.forEach(file => {
    console.log(`  - ${relative(PROJECT_ROOT, file)}`);
  });
  
  console.log(`\nFound ${htmlFiles.length} HTML files (checking for embedded CSS)...\n`);
  
  const parser = new CSSParser();
  const results = {
    files: [],
    summary: null
  };
  
  // Parse standalone CSS files
  for (const cssFile of cssFiles) {
    try {
      const content = await readFile(cssFile, 'utf-8');
      const fileParser = new CSSParser();
      fileParser.parse(content, relative(PROJECT_ROOT, cssFile));
      
      results.files.push({
        file: relative(PROJECT_ROOT, cssFile),
        type: 'css',
        rules: fileParser.rules.length,
        variables: fileParser.variables.size,
        mediaQueries: fileParser.mediaQueries.length,
        keyframes: fileParser.keyframes.length,
        imports: fileParser.imports.length,
        fontFaces: fileParser.fontFaces.length,
        data: {
          rules: fileParser.rules,
          variables: Array.from(fileParser.variables.entries()).map(([name, data]) => ({ name, ...data })),
          mediaQueries: fileParser.mediaQueries,
          keyframes: fileParser.keyframes,
          imports: fileParser.imports,
          fontFaces: fileParser.fontFaces
        }
      });
      
      // Merge into main parser
      parser.rules.push(...fileParser.rules);
      fileParser.variables.forEach((value, key) => {
        if (!parser.variables.has(key)) {
          parser.variables.set(key, value);
        }
      });
      parser.mediaQueries.push(...fileParser.mediaQueries);
      parser.keyframes.push(...fileParser.keyframes);
      parser.imports.push(...fileParser.imports);
      parser.fontFaces.push(...fileParser.fontFaces);
    } catch (err) {
      console.error(`Error reading ${cssFile}:`, err.message);
    }
  }
  
  // Parse embedded CSS in HTML files
  for (const htmlFile of htmlFiles) {
    const css = await extractCSSFromHTML(htmlFile);
    if (css) {
      const fileParser = new CSSParser();
      fileParser.parse(css, relative(PROJECT_ROOT, htmlFile));
      
      if (fileParser.rules.length > 0 || fileParser.variables.size > 0) {
        results.files.push({
          file: relative(PROJECT_ROOT, htmlFile),
          type: 'html-embedded',
          rules: fileParser.rules.length,
          variables: fileParser.variables.size,
          mediaQueries: fileParser.mediaQueries.length,
          keyframes: fileParser.keyframes.length,
          imports: fileParser.imports.length,
          fontFaces: fileParser.fontFaces.length,
          data: {
            rules: fileParser.rules,
            variables: Array.from(fileParser.variables.entries()).map(([name, data]) => ({ name, ...data })),
            mediaQueries: fileParser.mediaQueries,
            keyframes: fileParser.keyframes,
            imports: fileParser.imports,
            fontFaces: fileParser.fontFaces
          }
        });
        
        // Merge into main parser
        parser.rules.push(...fileParser.rules);
        fileParser.variables.forEach((value, key) => {
          if (!parser.variables.has(key)) {
            parser.variables.set(key, value);
          }
        });
        parser.mediaQueries.push(...fileParser.mediaQueries);
        parser.keyframes.push(...fileParser.keyframes);
        parser.imports.push(...fileParser.imports);
        parser.fontFaces.push(...fileParser.fontFaces);
      }
    }
  }
  
  results.summary = parser.getSummary();
  
  return results;
}

// Main execution
async function main() {
  try {
    const results = await parseAllCSS();
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 CSS PARSING SUMMARY');
    console.log('='.repeat(80));
    console.log(`\nTotal Files Parsed: ${results.files.length}`);
    console.log(`Total CSS Rules: ${results.summary.totalRules}`);
    console.log(`Total CSS Variables: ${results.summary.totalVariables}`);
    console.log(`Total Media Queries: ${results.summary.totalMediaQueries}`);
    console.log(`Total Keyframes: ${results.summary.totalKeyframes}`);
    console.log(`Total @imports: ${results.summary.totalImports}`);
    console.log(`Total @font-face: ${results.summary.totalFontFaces}`);
    console.log(`Unique Selectors: ${results.summary.uniqueSelectors}`);
    console.log(`Unique Properties: ${results.summary.uniqueProperties}`);
    
    console.log('\n' + '='.repeat(80));
    console.log('📁 FILES BREAKDOWN');
    console.log('='.repeat(80));
    results.files.forEach(file => {
      console.log(`\n${file.file} (${file.type})`);
      console.log(`  Rules: ${file.rules}`);
      console.log(`  Variables: ${file.variables}`);
      console.log(`  Media Queries: ${file.mediaQueries}`);
      console.log(`  Keyframes: ${file.keyframes}`);
    });
    
    if (results.summary.totalVariables > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('🎨 CSS VARIABLES');
      console.log('='.repeat(80));
      const allVars = [];
      results.files.forEach(file => {
        file.data.variables.forEach(v => {
          allVars.push({ ...v, file: file.file });
        });
      });
      allVars.forEach(v => {
        console.log(`\n  --${v.name}: ${v.value}`);
        console.log(`     Source: ${v.file}`);
      });
    }
    
    if (results.summary.totalKeyframes > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('🎬 KEYFRAMES');
      console.log('='.repeat(80));
      results.files.forEach(file => {
        file.data.keyframes.forEach(kf => {
          console.log(`\n  @keyframes ${kf.name}`);
          console.log(`     Source: ${kf.sourceFile}`);
          console.log(`     Content: ${kf.content.substring(0, 100)}${kf.content.length > 100 ? '...' : ''}`);
        });
      });
    }
    
    if (results.summary.totalMediaQueries > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('📱 MEDIA QUERIES');
      console.log('='.repeat(80));
      results.files.forEach(file => {
        file.data.mediaQueries.forEach(mq => {
          console.log(`\n  @media ${mq.query}`);
          console.log(`     Source: ${mq.sourceFile}`);
          console.log(`     Rules: ${mq.content.split('{').length - 1}`);
        });
      });
    }
    
    // Save detailed results to JSON
    const outputFile = join(PROJECT_ROOT, 'css-parse-results.json');
    await import('fs/promises').then(fs => 
      fs.writeFile(outputFile, JSON.stringify(results, null, 2), 'utf-8')
    );
    console.log(`\n\n✅ Detailed results saved to: css-parse-results.json`);
    
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
