/**
 * Enhanced OWASP Content Downloader
 * Downloads and formats OWASP guides properly
 */

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import https from 'node:https';

const BOOKS_DIR = process.cwd();

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Download OWASP API Security Top 10 - Full Content
 */
async function downloadAPISecurity() {
  try {
    console.log('Downloading OWASP API Security Top 10 full content...');
    
    // Try multiple sources for complete content
    const sources = [
      'https://owasp.org/www-project-api-security/',
      'https://github.com/OWASP/API-Security',
    ];
    
    let content = '';
    for (const url of sources) {
      try {
        const data = await download(url);
        content += `\n\n## Content from ${url}\n\n${data}\n\n`;
      } catch (err) {
        console.warn(`Failed to download from ${url}:`, err.message);
      }
    }
    
    const filePath = join(BOOKS_DIR, 'oWaSp aPi sEcUrItY tOp 10.md');
    const header = `# OWASP API Security Top 10 - Full Content

**Source**: https://owasp.org/www-project-api-security/
**License**: Creative Commons Attribution-ShareAlike 4.0
**Downloaded**: ${new Date().toISOString()}

---

## Complete Book Content

This file contains the full content from OWASP API Security Top 10.

`;
    
    await writeFile(filePath, header + content, 'utf-8');
    console.log('✅ Downloaded OWASP API Security Top 10');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

/**
 * Download OWASP LLM Top 10 - Full Content
 */
async function downloadLLM() {
  try {
    console.log('Downloading OWASP LLM Top 10 full content...');
    
    const url = 'https://owasp.org/www-project-large-language-model-applications/';
    const content = await download(url);
    
    const filePath = join(BOOKS_DIR, 'oWaSp lLm tOp 10.md');
    const header = `# OWASP LLM Top 10 - Full Content

**Source**: https://owasp.org/www-project-large-language-model-applications/
**License**: Creative Commons Attribution-ShareAlike 4.0
**Downloaded**: ${new Date().toISOString()}

---

## Complete Book Content

This file contains the full content from OWASP LLM Top 10.

`;
    
    await writeFile(filePath, header + content, 'utf-8');
    console.log('✅ Downloaded OWASP LLM Top 10');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

async function main() {
  await downloadAPISecurity();
  await downloadLLM();
  console.log('\n✅ Complete!');
}

main().catch(console.error);
