#!/usr/bin/env node
/**
 * Agent Files Parser
 * Parses all agent-related files in the project:
 * - Files with "agent" in their name
 * - Files containing agent-related code patterns
 * - Agentic patterns implementations
 * - Agent configuration files
 * - Agent documentation
 */

import { readFileSync, statSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { fileURLToPath } from 'url';
import { dirname, join, relative } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = __dirname;

// Parse JavaScript/TypeScript files for agent usage
function parseJSFileForAgent(content, filePath) {
  const stats = {
    hasAgentReference: false,
    hasAgenticPatterns: false,
    hasAgentConfig: false,
    hasAgentClass: false,
    agentImports: [],
    agentConfigReferences: [],
    agentClasses: [],
    agentMethods: [],
    agentProperties: [],
    agentPatterns: [],
    totalAgentReferences: 0,
    agentFunctionCalls: [],
    agentTypes: {
      memory: false,
      routing: false,
      guardrails: false,
      exceptionHandling: false,
      contextEnrichment: false
    }
  };

  // Check for agent imports
  const importRegex = /import\s+.*?\b(agent|Agent|agentic|Agentic|ConversationHistory|Memory|Routing|Guardrails|ExceptionHandler)\b.*?from\s+['"]([^'"]+)['"]/gi;
  const importMatches = [...content.matchAll(importRegex)];
  if (importMatches.length > 0) {
    stats.hasAgentReference = true;
    stats.agentImports = importMatches.map(m => ({
      import: m[0],
      source: m[2]
    }));
  }

  // Check for agentic patterns
  const agenticPatterns = [
    'ConversationHistory',
    'classifyIntent',
    'validateInput',
    'sanitizeOutput',
    'runWithRetry',
    'getContextEnrichment',
    'runParallel',
    'Memory',
    'Routing',
    'Guardrails',
    'ExceptionHandler'
  ];

  agenticPatterns.forEach(pattern => {
    if (new RegExp(`\\b${pattern}\\b`).test(content)) {
      stats.hasAgenticPatterns = true;
      stats.agentPatterns.push(pattern);
      stats.totalAgentReferences++;
    }
  });

  // Check for agent config
  if (/AgentConfig|agentConfig|agent-config|agent_config/i.test(content)) {
    stats.hasAgentConfig = true;
    const configMatches = [...content.matchAll(/(AgentConfig|agentConfig|agent-config|agent_config)\s*[\.\[]/gi)];
    stats.agentConfigReferences = [...new Set(configMatches.map(m => m[1]))];
  }

  // Check for agent classes
  const classRegex = /class\s+(\w*[Aa]gent\w*)/g;
  const classMatches = [...content.matchAll(classRegex)];
  if (classMatches.length > 0) {
    stats.hasAgentClass = true;
    stats.agentClasses = [...new Set(classMatches.map(m => m[1]))];
  }

  // Check for agent methods
  const methodRegex = /(\w*[Aa]gent\w*)\s*\(/g;
  const methodMatches = [...content.matchAll(methodRegex)];
  stats.agentMethods = [...new Set(methodMatches.map(m => m[1]))];

  // Check for agent properties
  const propertyRegex = /(\w*[Aa]gent\w*)\s*[:=]/g;
  const propertyMatches = [...content.matchAll(propertyRegex)];
  stats.agentProperties = [...new Set(propertyMatches.map(m => m[1]))];

  // Check for agent types
  if (/\bMemory\b|\bConversationHistory\b/i.test(content)) {
    stats.agentTypes.memory = true;
  }
  if (/\bRouting\b|\bclassifyIntent\b/i.test(content)) {
    stats.agentTypes.routing = true;
  }
  if (/\bGuardrails\b|\bvalidateInput\b|\bsanitizeOutput\b/i.test(content)) {
    stats.agentTypes.guardrails = true;
  }
  if (/\bExceptionHandler\b|\brunWithRetry\b/i.test(content)) {
    stats.agentTypes.exceptionHandling = true;
  }
  if (/\bgetContextEnrichment\b|\brunParallel\b/i.test(content)) {
    stats.agentTypes.contextEnrichment = true;
  }

  return stats;
}

async function parseAllAgentFiles() {
  console.log('🔍 Finding agent-related files...\n');

  // Find all files that mention "agent" in name or content
  const allFiles = await glob('**/*', {
    ignore: ['node_modules/**', 'dist/**', 'coverage/**', 'dist-public/**', '.git/**', '**/parse-*.js', '**/parse-*.mjs'],
    cwd: __dirname
  });

  // Filter files that contain agent references or have agent in filename
  const agentFiles = [];
  for (const file of allFiles) {
    try {
      // Check if filename contains "agent"
      if (/\bagent\b/i.test(file)) {
        agentFiles.push(file);
        continue;
      }
      
      // Check file content for agent references
      const content = readFileSync(file, 'utf-8');
      if (/\b(agent|Agent|agentic|Agentic|ConversationHistory|Memory|Routing|Guardrails|ExceptionHandler)\b/.test(content)) {
        agentFiles.push(file);
      }
    } catch (error) {
      // Skip files we can't read (binary files, etc.)
    }
  }

  console.log(`Found ${agentFiles.length} agent-related files:\n`);

  const results = [];
  const fileTypes = {
    js: [],
    ts: [],
    md: [],
    json: [],
    html: [],
    other: []
  };

  for (const file of agentFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      const stats = statSync(file);
      const sizeKB = (stats.size / 1024).toFixed(2);
      const parts = file.split('.');
      const ext = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'other';

      let parsed = {};
      let fileType = 'other';

      if (ext === 'js' || ext === 'mjs' || ext === 'cjs' || ext === 'jsx') {
        fileType = 'js';
        parsed = parseJSFileForAgent(content, file);
        fileTypes.js.push(file);
      } else if (ext === 'ts' || ext === 'tsx') {
        fileType = 'ts';
        parsed = parseJSFileForAgent(content, file);
        fileTypes.ts.push(file);
      } else if (ext === 'md') {
        fileType = 'md';
        parsed = {
          hasAgentContent: /\b(agent|Agent|agentic|Agentic)\b/i.test(content),
          agentMentions: (content.match(/\b(agent|Agent|agentic|Agentic)\b/gi) || []).length,
          agentSections: [...content.matchAll(/^#{1,6}\s+.*\b(agent|Agent|agentic|Agentic)\b.*$/gim)].map(m => m[0]),
          agentLinks: [...content.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].filter(m => /\b(agent|Agent|agentic|Agentic)\b/i.test(m[0])),
          agentCodeBlocks: (content.match(/```[\s\S]*?\b(agent|Agent|agentic|Agentic)\b[\s\S]*?```/gi) || []).length
        };
        fileTypes.md.push(file);
      } else if (ext === 'json') {
        fileType = 'json';
        parsed = { type: 'json', hasAgent: true };
        fileTypes.json.push(file);
      } else if (ext === 'html') {
        fileType = 'html';
        parsed = { type: 'html', hasAgent: true };
        fileTypes.html.push(file);
      } else {
        parsed = { type: ext, hasAgent: true };
        fileTypes.other.push(file);
      }

      results.push({
        file: relative(__dirname, file),
        fullPath: file,
        valid: true,
        sizeKB: parseFloat(sizeKB),
        type: fileType,
        parsed
      });

      console.log(`✓ ${relative(__dirname, file)}`);
      console.log(`  Size: ${sizeKB} KB`);
      console.log(`  Type: ${fileType.toUpperCase()}`);

      if (fileType === 'js' || fileType === 'ts') {
        if (parsed.hasAgentReference) {
          console.log(`  Agent imports: ${parsed.agentImports.length}`);
        }
        if (parsed.hasAgenticPatterns) {
          console.log(`  Agentic patterns: ${parsed.agentPatterns.join(', ')}`);
        }
        if (parsed.hasAgentClass) {
          console.log(`  Agent classes: ${parsed.agentClasses.join(', ')}`);
        }
      }
      console.log('');
    } catch (error) {
      console.error(`✗ ${relative(__dirname, file)}: ${error.message}`);
    }
  }

  const output = {
    generated: new Date().toISOString(),
    summary: {
      totalFilesChecked: allFiles.length,
      agentFilesFound: agentFiles.length,
      invalidFiles: results.filter(r => !r.valid).length,
      byType: {
        js: fileTypes.js.length,
        ts: fileTypes.ts.length,
        md: fileTypes.md.length,
        json: fileTypes.json.length,
        html: fileTypes.html.length,
        other: fileTypes.other.length
      }
    },
    files: results
  };

  const outputPath = join(__dirname, 'agent-parse-results.json');
  writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total files checked: ${output.summary.totalFilesChecked}`);
  console.log(`Agent files found: ${output.summary.agentFilesFound}`);
  console.log(`\nBy type:`);
  console.log(`  JavaScript: ${fileTypes.js.length}`);
  console.log(`  TypeScript: ${fileTypes.ts.length}`);
  console.log(`  Markdown: ${fileTypes.md.length}`);
  console.log(`  JSON: ${fileTypes.json.length}`);
  console.log(`  HTML: ${fileTypes.html.length}`);
  console.log(`  Other: ${fileTypes.other.length}`);
  console.log(`\n✓ Results saved to: agent-parse-results.json`);
}

parseAllAgentFiles().catch(console.error);
