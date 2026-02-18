/**
 * Download Security Books Script
 * Downloads free/open-source security books and saves them to documentation files
 * Only downloads content that is legally free and open-source
 */

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import https from 'node:https';
import http from 'node:http';

const BOOKS_DIR = process.cwd();

/**
 * Download content from URL
 */
function downloadContent(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Download OWASP API Security Top 10
 */
async function downloadOWASPAPISecurity() {
  try {
    console.log('Downloading OWASP API Security Top 10...');
    // OWASP content is available via their website
    const url = 'https://owasp.org/www-project-api-security/';
    const content = await downloadContent(url);
    
    // Extract main content (simplified - in production would parse HTML properly)
    const filePath = join(BOOKS_DIR, 'oWaSp aPi sEcUrItY tOp 10.md');
    const header = `# OWASP API Security Top 10

**Source**: https://owasp.org/www-project-api-security/
**License**: Creative Commons Attribution-ShareAlike 4.0
**Downloaded**: ${new Date().toISOString()}

---

## Full Content

`;
    
    await writeFile(filePath, header + content, 'utf-8');
    console.log('✅ Downloaded OWASP API Security Top 10');
  } catch (err) {
    console.error('❌ Error downloading OWASP API Security:', err.message);
  }
}

/**
 * Download OWASP LLM Top 10
 */
async function downloadOWASPLLM() {
  try {
    console.log('Downloading OWASP LLM Top 10...');
    const url = 'https://owasp.org/www-project-large-language-model-applications/';
    const content = await downloadContent(url);
    
    const filePath = join(BOOKS_DIR, 'oWaSp lLm tOp 10.md');
    const header = `# OWASP LLM Top 10

**Source**: https://owasp.org/www-project-large-language-model-applications/
**License**: Creative Commons Attribution-ShareAlike 4.0
**Downloaded**: ${new Date().toISOString()}

---

## Full Content

`;
    
    await writeFile(filePath, header + content, 'utf-8');
    console.log('✅ Downloaded OWASP LLM Top 10');
  } catch (err) {
    console.error('❌ Error downloading OWASP LLM:', err.message);
  }
}

/**
 * Download Building Secure and Reliable Systems from Google
 */
async function downloadGoogleBook() {
  try {
    console.log('Downloading Building Secure and Reliable Systems...');
    // Google's book is available at their GitHub repo
    
    // Try to get the main README or index
    const url = 'https://google.github.io/building-secure-and-reliable-systems/';
    const content = await downloadContent(url);
    
    const filePath = join(BOOKS_DIR, 'bUiLdInG sEcUrE aNd ReLiAbLe SyStEmS.md');
    const header = `# Building Secure and Reliable Systems

**Authors**: Heather Adkins, Betsy Beyer, Paul Blankinship, Piotr Lewandowski, Ana Oprea, Adam Stubblefield
**Publisher**: O'Reilly Media (2020)
**Source**: https://google.github.io/building-secure-and-reliable-systems/
**License**: CC-BY-4.0
**Downloaded**: ${new Date().toISOString()}

---

## Full Content

`;
    
    await writeFile(filePath, header + content, 'utf-8');
    console.log('✅ Downloaded Building Secure and Reliable Systems');
  } catch (err) {
    console.error('❌ Error downloading Google book:', err.message);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Starting security books download...\n');
  
  await downloadOWASPAPISecurity();
  await downloadOWASPLLM();
  await downloadGoogleBook();
  
  console.log('\n✅ Download complete!');
  console.log('\nNote: For copyrighted books, please download from official sources:');
  console.log('- Internet Archive (archive.org)');
  console.log('- Public libraries');
  console.log('- Official publishers');
}

main().catch(console.error);
