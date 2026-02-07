/**
 * Extract Google Book Content from HTML Files
 * Converts HTML chapters to markdown content
 */

import { readFile, readdir, writeFile } from 'fs/promises';
import { join } from 'path';

const BOOK_DIR = 'temp-google-book/raw';
const OUTPUT_FILE = 'bUiLdInG sEcUrE aNd ReLiAbLe SyStEmS.md';

/**
 * Simple HTML to text converter (removes tags, keeps content)
 */
function htmlToText(html) {
  // Remove script and style tags
  html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Convert common HTML elements to markdown
  html = html.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  html = html.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  html = html.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  html = html.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
  html = html.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  html = html.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  html = html.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  html = html.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  html = html.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
  html = html.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  
  // Remove all remaining HTML tags
  html = html.replace(/<[^>]+>/g, '');
  
  // Decode HTML entities
  html = html.replace(/&nbsp;/g, ' ');
  html = html.replace(/&amp;/g, '&');
  html = html.replace(/&lt;/g, '<');
  html = html.replace(/&gt;/g, '>');
  html = html.replace(/&quot;/g, '"');
  html = html.replace(/&#39;/g, "'");
  
  // Clean up whitespace
  html = html.replace(/\n{3,}/g, '\n\n');
  html = html.trim();
  
  return html;
}

/**
 * Extract content from HTML file
 */
async function extractChapter(filename) {
  try {
    const filePath = join(BOOK_DIR, filename);
    const html = await readFile(filePath, 'utf-8');
    const text = htmlToText(html);
    return { filename, content: text };
  } catch (err) {
    console.warn(`Failed to read ${filename}:`, err.message);
    return null;
  }
}

/**
 * Main extraction function
 */
async function main() {
  try {
    console.log('Extracting Google Book content...\n');
    
    // Get all HTML files
    const files = await readdir(BOOK_DIR);
    const htmlFiles = files
      .filter(f => f.endsWith('.html') && f.startsWith('ch'))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
      });
    
    console.log(`Found ${htmlFiles.length} chapters\n`);
    
    // Extract all chapters
    const chapters = [];
    for (const file of htmlFiles) {
      console.log(`Extracting ${file}...`);
      const chapter = await extractChapter(file);
      if (chapter) {
        chapters.push(chapter);
      }
    }
    
    // Combine into single document
    const header = `# Building Secure and Reliable Systems

**Authors**: Heather Adkins, Betsy Beyer, Paul Blankinship, Piotr Lewandowski, Ana Oprea, Adam Stubblefield
**Publisher**: O'Reilly Media (2020)
**Source**: https://google.github.io/building-secure-and-reliable-systems/
**License**: CC-BY-4.0
**Extracted**: ${new Date().toISOString()}

---

## Complete Book Content

This file contains the full content extracted from the official Google repository.

---

`;
    
    const fullContent = header + chapters.map(ch => 
      `## ${ch.filename}\n\n${ch.content}\n\n---\n\n`
    ).join('\n');
    
    await writeFile(OUTPUT_FILE, fullContent, 'utf-8');
    
    console.log(`\n✅ Extracted ${chapters.length} chapters to ${OUTPUT_FILE}`);
    console.log(`Total content length: ${fullContent.length} characters`);
    
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
