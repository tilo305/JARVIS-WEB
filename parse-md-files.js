import { readFileSync, statSync, readdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, relative } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function findMdFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    try {
      const stat = statSync(filePath);
      if (stat.isDirectory()) {
        // Skip node_modules, dist, coverage, and .git directories
        if (!['node_modules', 'dist', 'coverage', '.git', 'dist-public'].includes(file)) {
          findMdFiles(filePath, fileList);
        }
      } else if (file.endsWith('.md')) {
        fileList.push(filePath);
      }
    } catch (err) {
      // Skip files we can't access
    }
  });
  
  return fileList;
}

function parseMarkdown(content) {
  const lines = content.split('\n');
  const result = {
    headings: [],
    codeBlocks: [],
    links: [],
    images: [],
    lists: [],
    tables: [],
    metadata: {}
  };

  let inCodeBlock = false;
  let codeBlockLanguage = '';
  let codeBlockContent = [];
  let currentHeading = null;

  lines.forEach((line, index) => {
    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch && !inCodeBlock) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      result.headings.push({ level, text, line: index + 1 });
      currentHeading = text;
    }

    // Code blocks
    const codeBlockStart = line.match(/^```(\w+)?$/);
    if (codeBlockStart) {
      if (inCodeBlock) {
        // End of code block
        result.codeBlocks.push({
          language: codeBlockLanguage || 'text',
          content: codeBlockContent.join('\n'),
          lines: codeBlockContent.length
        });
        codeBlockContent = [];
        codeBlockLanguage = '';
        inCodeBlock = false;
      } else {
        // Start of code block
        inCodeBlock = true;
        codeBlockLanguage = codeBlockStart[1] || '';
      }
    } else if (inCodeBlock) {
      codeBlockContent.push(line);
    }

    // Links
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(line)) !== null && !inCodeBlock) {
      result.links.push({
        text: linkMatch[1],
        url: linkMatch[2],
        line: index + 1
      });
    }

    // Images
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let imageMatch;
    while ((imageMatch = imageRegex.exec(line)) !== null && !inCodeBlock) {
      result.images.push({
        alt: imageMatch[1],
        url: imageMatch[2],
        line: index + 1
      });
    }

    // Lists (simple detection)
    if (line.match(/^[\s]*[-*+]\s+/) && !inCodeBlock) {
      result.lists.push({
        item: line.trim(),
        line: index + 1
      });
    }

    // Tables (simple detection)
    if (line.includes('|') && !inCodeBlock && line.trim().startsWith('|')) {
      result.tables.push({
        row: line.trim(),
        line: index + 1
      });
    }
  });

  // Calculate statistics
  result.metadata = {
    totalLines: lines.length,
    totalWords: content.split(/\s+/).filter(w => w.length > 0).length,
    totalCharacters: content.length,
    headingCount: result.headings.length,
    codeBlockCount: result.codeBlocks.length,
    linkCount: result.links.length,
    imageCount: result.images.length,
    listItemCount: result.lists.length,
    tableRowCount: result.tables.length
  };

  return result;
}

async function parseAllMdFiles() {
  const mdFiles = findMdFiles(__dirname);
  mdFiles.sort();

  console.log(`Found ${mdFiles.length} markdown files:\n`);

  const results = [];
  const summary = {
    totalFiles: mdFiles.length,
    totalSize: 0,
    totalLines: 0,
    totalWords: 0,
    totalHeadings: 0,
    totalCodeBlocks: 0,
    totalLinks: 0,
    totalImages: 0,
    errors: []
  };

  for (const file of mdFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      const stats = statSync(file);
      const sizeKB = (stats.size / 1024).toFixed(2);
      const relativePath = relative(__dirname, file);
      
      const parsed = parseMarkdown(content);
      
      const fileResult = {
        file: relativePath,
        fullPath: file,
        sizeKB: parseFloat(sizeKB),
        ...parsed.metadata,
        headings: parsed.headings,
        codeBlocks: parsed.codeBlocks.map(cb => ({
          language: cb.language,
          lines: cb.lines
        })),
        links: parsed.links,
        images: parsed.images
      };

      results.push(fileResult);

      // Update summary
      summary.totalSize += parseFloat(sizeKB);
      summary.totalLines += parsed.metadata.totalLines;
      summary.totalWords += parsed.metadata.totalWords;
      summary.totalHeadings += parsed.metadata.headingCount;
      summary.totalCodeBlocks += parsed.metadata.codeBlockCount;
      summary.totalLinks += parsed.metadata.linkCount;
      summary.totalImages += parsed.metadata.imageCount;

      console.log(`✓ ${relativePath}`);
      console.log(`  Size: ${sizeKB} KB`);
      console.log(`  Lines: ${parsed.metadata.totalLines}`);
      console.log(`  Words: ${parsed.metadata.totalWords}`);
      console.log(`  Headings: ${parsed.metadata.headingCount}`);
      console.log(`  Code blocks: ${parsed.metadata.codeBlockCount}`);
      console.log(`  Links: ${parsed.metadata.linkCount}`);
      if (parsed.headings.length > 0) {
        const topHeadings = parsed.headings.slice(0, 3).map(h => `${'#'.repeat(h.level)} ${h.text}`).join(', ');
        console.log(`  Top headings: ${topHeadings}${parsed.headings.length > 3 ? '...' : ''}`);
      }
      console.log('');

    } catch (error) {
      summary.errors.push({
        file: relative(__dirname, file),
        error: error.message
      });
      console.log(`✗ ${relative(__dirname, file)}`);
      console.log(`  Error: ${error.message}\n`);
    }
  }

  // Write results to JSON file
  const outputFile = join(__dirname, 'md-parse-results.json');
  writeFileSync(outputFile, JSON.stringify({
    summary,
    files: results
  }, null, 2), 'utf-8');

  // Print summary
  console.log('\n=== Summary ===');
  console.log(`Total files: ${summary.totalFiles}`);
  console.log(`Total size: ${summary.totalSize.toFixed(2)} KB`);
  console.log(`Total lines: ${summary.totalLines.toLocaleString()}`);
  console.log(`Total words: ${summary.totalWords.toLocaleString()}`);
  console.log(`Total headings: ${summary.totalHeadings}`);
  console.log(`Total code blocks: ${summary.totalCodeBlocks}`);
  console.log(`Total links: ${summary.totalLinks}`);
  console.log(`Total images: ${summary.totalImages}`);
  
  if (summary.errors.length > 0) {
    console.log(`\nErrors: ${summary.errors.length}`);
    summary.errors.forEach(err => {
      console.log(`  - ${err.file}: ${err.error}`);
    });
  }

  console.log(`\n✓ Results saved to: ${outputFile}`);
}

parseAllMdFiles().catch(console.error);
