import { readFileSync, statSync, readdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, relative } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function findJsonFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    try {
      const stat = statSync(filePath);
      if (stat.isDirectory()) {
        // Skip node_modules, dist, and coverage directories
        if (!['node_modules', 'dist', 'coverage', '.git'].includes(file)) {
          findJsonFiles(filePath, fileList);
        }
      } else if (file.endsWith('.json')) {
        fileList.push(filePath);
      }
    } catch (err) {
      // Skip files we can't access
    }
  });
  
  return fileList;
}

async function parseAllJsonFiles() {
  const jsonFiles = findJsonFiles(__dirname);

  console.log(`Found ${jsonFiles.length} JSON files:\n`);

  const results = [];

  for (const file of jsonFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      const parsed = JSON.parse(content);
      
      // Get file size
      const stats = statSync(file);
      const sizeKB = (stats.size / 1024).toFixed(2);
      
      // Count keys/items
      let itemCount = 0;
      if (Array.isArray(parsed)) {
        itemCount = parsed.length;
      } else if (typeof parsed === 'object' && parsed !== null) {
        itemCount = Object.keys(parsed).length;
      }

      results.push({
        file,
        valid: true,
        sizeKB: parseFloat(sizeKB),
        itemCount,
        type: Array.isArray(parsed) ? 'array' : typeof parsed
      });

      console.log(`✓ ${file}`);
      console.log(`  Size: ${sizeKB} KB`);
      console.log(`  Type: ${Array.isArray(parsed) ? 'Array' : 'Object'}`);
      console.log(`  Items/Keys: ${itemCount}`);
      
      // Show top-level keys for objects
      if (typeof parsed === 'object' && !Array.isArray(parsed) && parsed !== null) {
        const keys = Object.keys(parsed).slice(0, 10);
        if (keys.length > 0) {
          console.log(`  Top-level keys: ${keys.join(', ')}${Object.keys(parsed).length > 10 ? '...' : ''}`);
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
  console.log('\n=== Summary ===');
  const valid = results.filter(r => r.valid).length;
  const invalid = results.filter(r => !r.valid).length;
  const totalSize = results.reduce((sum, r) => sum + (r.sizeKB || 0), 0);
  
  console.log(`Total files: ${results.length}`);
  console.log(`Valid: ${valid}`);
  console.log(`Invalid: ${invalid}`);
  console.log(`Total size: ${totalSize.toFixed(2)} KB`);
  
  if (invalid > 0) {
    console.log('\nInvalid files:');
    results.filter(r => !r.valid).forEach(r => {
      console.log(`  - ${r.file}: ${r.error}`);
    });
  }

  // Save results to JSON file
  const outputFile = join(__dirname, 'json-parse-results.json');
  const outputData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: results.length,
      valid: valid,
      invalid: invalid,
      totalSizeKB: parseFloat(totalSize.toFixed(2))
    },
    files: results.map(r => ({
      file: relative(__dirname, r.file),
      valid: r.valid,
      sizeKB: r.sizeKB || null,
      itemCount: r.itemCount || null,
      type: r.type || null,
      error: r.error || null
    }))
  };

  writeFileSync(outputFile, JSON.stringify(outputData, null, 2), 'utf-8');
  console.log(`\n✓ Results saved to: json-parse-results.json`);
}

parseAllJsonFiles().catch(console.error);
