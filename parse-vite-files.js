#!/usr/bin/env node
/**
 * Vite Files Parser
 * Parses all Vite-related files in the project:
 * - vite.config.js (and variants like vite.config.ts, vite.config.mjs)
 * - Vite plugin files
 * - Analyzes Vite-specific configuration
 */

import { readFileSync, statSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { fileURLToPath } from 'url';
import { dirname, join, relative } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = __dirname;

// Parse Vite configuration file
function parseViteConfig(content, filePath) {
  const stats = {
    type: 'vite-config',
    hasDefineConfig: false,
    hasLoadEnv: false,
    plugins: [],
    customPlugins: [],
    buildConfig: {},
    serverConfig: {},
    previewConfig: {},
    define: {},
    root: null,
    publicDir: null,
    base: null,
    mode: null,
    envPrefix: [],
    resolve: {},
    optimizeDeps: {},
    ssr: {},
    constants: [],
    imports: [],
    exports: [],
    functions: [],
    classes: [],
    viteVersion: null,
    hasTypeScript: false,
    hasJSX: false
  };

  // Check for defineConfig
  stats.hasDefineConfig = /defineConfig|export\s+default\s+defineConfig/i.test(content);
  
  // Check for loadEnv
  stats.hasLoadEnv = /loadEnv/i.test(content);

  // Extract Vite imports
  const viteImportRegex = /import\s+.*?\b(defineConfig|loadEnv|UserConfig|Plugin|PluginOption)\b.*?from\s+['"]vite['"]/gi;
  const viteImports = [...content.matchAll(viteImportRegex)];
  stats.imports = viteImports.map(m => m[0]);

  // Extract plugin imports
  const pluginImportRegex = /import\s+.*?from\s+['"](vite-plugin-[^'"]+|@vitejs\/[^'"]+)['"]/gi;
  const pluginImports = [...content.matchAll(pluginImportRegex)];
  pluginImports.forEach(match => {
    const importLine = match[0];
    const pluginNameMatch = importLine.match(/['"]([^'"]+)['"]/);
    if (pluginNameMatch) {
      stats.plugins.push({
        name: pluginNameMatch[1],
        import: importLine
      });
    }
  });

  // Extract custom plugin functions
  const customPluginRegex = /(?:function|const)\s+(\w+Plugin)\s*[=\(]/gi;
  const customPlugins = [...content.matchAll(customPluginRegex)];
  customPlugins.forEach(match => {
    const pluginName = match[1];
    // Try to extract plugin details
    const pluginStart = content.indexOf(match[0]);
    const pluginEnd = content.indexOf('}', pluginStart);
    const pluginCode = content.substring(pluginStart, pluginEnd + 100);
    
    const pluginInfo = {
      name: pluginName,
      hasName: /name:\s*['"]([^'"]+)['"]/.test(pluginCode),
      pluginName: pluginCode.match(/name:\s*['"]([^'"]+)['"]/)?.[1] || null,
      apply: pluginCode.match(/apply:\s*['"]([^'"]+)['"]/)?.[1] || null,
      hooks: []
    };

    // Extract hooks
    const hooks = ['buildStart', 'buildEnd', 'configureServer', 'transform', 'load', 'resolveId', 'writeBundle'];
    hooks.forEach(hook => {
      if (new RegExp(`\\b${hook}\\s*[:\(]`, 'i').test(pluginCode)) {
        pluginInfo.hooks.push(hook);
      }
    });

    stats.customPlugins.push(pluginInfo);
  });

  // Extract build configuration
  const buildMatch = content.match(/build:\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/s);
  if (buildMatch) {
    const buildContent = buildMatch[1];
    stats.buildConfig = {
      outDir: extractValue(buildContent, 'outDir'),
      emptyOutDir: extractValue(buildContent, 'emptyOutDir'),
      sourcemap: extractValue(buildContent, 'sourcemap'),
      minify: extractValue(buildContent, 'minify'),
      target: extractValue(buildContent, 'target'),
      rollupOptions: /rollupOptions/.test(buildContent),
      lib: /lib:\s*\{/.test(buildContent),
      manifest: /manifest/.test(buildContent)
    };
  }

  // Extract server configuration
  const serverMatch = content.match(/server:\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/s);
  if (serverMatch) {
    const serverContent = serverMatch[1];
    stats.serverConfig = {
      port: extractValue(serverContent, 'port'),
      host: extractValue(serverContent, 'host'),
      open: extractValue(serverContent, 'open'),
      https: /https/.test(serverContent),
      cors: extractValue(serverContent, 'cors'),
      proxy: /proxy:\s*\{/.test(serverContent)
    };
  }

  // Extract preview configuration
  const previewMatch = content.match(/preview:\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/s);
  if (previewMatch) {
    const previewContent = previewMatch[1];
    stats.previewConfig = {
      port: extractValue(previewContent, 'port'),
      host: extractValue(previewContent, 'host'),
      open: extractValue(previewContent, 'open')
    };
  }

  // Extract define (environment variables)
  const defineMatch = content.match(/define:\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/s);
  if (defineMatch) {
    const defineContent = defineMatch[1];
    const defineEntries = [...defineContent.matchAll(/(['"][^'"]+['"])\s*:\s*([^,}]+)/g)];
    defineEntries.forEach(match => {
      const key = match[1].replace(/['"]/g, '');
      const value = match[2].trim();
      stats.define[key] = value;
    });
  }

  // Extract root
  const rootMatch = content.match(/root:\s*['"]([^'"]+)['"]/);
  if (rootMatch) {
    stats.root = rootMatch[1];
  } else {
    const rootExprMatch = content.match(/root:\s*([^,}\n]+)/);
    if (rootExprMatch) {
      stats.root = rootExprMatch[1].trim();
    }
  }

  // Extract publicDir
  const publicDirMatch = content.match(/publicDir:\s*(true|false|['"][^'"]+['"])/);
  if (publicDirMatch) {
    stats.publicDir = publicDirMatch[1];
  }

  // Extract base
  const baseMatch = content.match(/base:\s*['"]([^'"]+)['"]/);
  if (baseMatch) {
    stats.base = baseMatch[1];
  }

  // Extract constants
  const constRegex = /const\s+([A-Z_][A-Z0-9_]*)\s*=\s*['"]([^'"]+)['"]/g;
  const constants = [...content.matchAll(constRegex)];
  stats.constants = constants.map(m => ({
    name: m[1],
    value: m[2]
  }));

  // Extract functions
  const functionRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|(\w+))\s*=>)/g;
  const functions = [...content.matchAll(functionRegex)];
  stats.functions = [...new Set(functions.map(m => m[1] || m[2] || m[4]).filter(Boolean))];

  // Extract classes
  const classRegex = /class\s+(\w+)/g;
  const classes = [...content.matchAll(classRegex)];
  stats.classes = classes.map(m => m[1]);

  // Check for TypeScript
  stats.hasTypeScript = /\.tsx?/.test(filePath) || /from\s+['"]typescript['"]/i.test(content);

  // Check for JSX
  stats.hasJSX = /\.tsx|\.jsx/.test(filePath) || /jsx|React/i.test(content);

  // Try to extract Vite version from package.json or comments
  const viteVersionMatch = content.match(/vite[:\s]+['"]?([\d.]+)['"]?/i);
  if (viteVersionMatch) {
    stats.viteVersion = viteVersionMatch[1];
  }

  return stats;
}

// Helper function to extract values from configuration objects
function extractValue(content, key) {
  const regex = new RegExp(`${key}:\\s*([^,}\\n]+)`, 'i');
  const match = content.match(regex);
  if (match) {
    const value = match[1].trim();
    // Try to parse as boolean, number, or string
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (/^\d+$/.test(value)) return parseInt(value, 10);
    if (/^['"](.+)['"]$/.test(value)) return value.replace(/['"]/g, '');
    return value;
  }
  return null;
}

async function parseAllViteFiles() {
  console.log('🔍 Parsing all Vite files...\n');

  const results = {
    configFiles: [],
    summary: {
      totalFiles: 0,
      totalSize: 0,
      plugins: [],
      customPlugins: [],
      envVars: [],
      buildConfigs: 0,
      serverConfigs: 0
    }
  };

  // Find all Vite config files
  const viteConfigPatterns = [
    'vite.config.js',
    'vite.config.ts',
    'vite.config.mjs',
    'vite.config.cjs',
    '**/vite.config.*'
  ];

  const viteFiles = [];
  for (const pattern of viteConfigPatterns) {
    const files = await glob(pattern, {
      ignore: ['node_modules/**', 'dist/**', 'coverage/**', 'dist-public/**', '.git/**'],
      cwd: PROJECT_ROOT
    });
    viteFiles.push(...files);
  }

  // Remove duplicates
  const uniqueViteFiles = [...new Set(viteFiles)];

  console.log(`Found ${uniqueViteFiles.length} Vite configuration file(s):\n`);

  for (const file of uniqueViteFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      const stats = statSync(file);
      const parsed = parseViteConfig(content, file);

      const result = {
        file: relative(PROJECT_ROOT, file),
        sizeKB: (stats.size / 1024).toFixed(2),
        ...parsed
      };

      results.configFiles.push(result);
      results.summary.totalFiles++;
      results.summary.totalSize += stats.size;

      // Collect plugins
      parsed.plugins.forEach(plugin => {
        if (!results.summary.plugins.find(p => p.name === plugin.name)) {
          results.summary.plugins.push(plugin);
        }
      });

      // Collect custom plugins
      parsed.customPlugins.forEach(plugin => {
        if (!results.summary.customPlugins.find(p => p.name === plugin.name)) {
          results.summary.customPlugins.push(plugin);
        }
      });

      // Collect environment variables
      Object.keys(parsed.define).forEach(key => {
        if (!results.summary.envVars.includes(key)) {
          results.summary.envVars.push(key);
        }
      });

      if (parsed.buildConfig && Object.keys(parsed.buildConfig).length > 0) {
        results.summary.buildConfigs++;
      }

      if (parsed.serverConfig && Object.keys(parsed.serverConfig).length > 0) {
        results.summary.serverConfigs++;
      }

      console.log(`✓ ${result.file}`);
      console.log(`  Size: ${result.sizeKB} KB`);
      console.log(`  Plugins: ${parsed.plugins.length} external, ${parsed.customPlugins.length} custom`);
      console.log(`  Environment variables: ${Object.keys(parsed.define).length}`);
      if (parsed.root) {
        console.log(`  Root: ${parsed.root}`);
      }
      if (parsed.buildConfig.outDir) {
        console.log(`  Build output: ${parsed.buildConfig.outDir}`);
      }
      console.log('');
    } catch (error) {
      console.log(`  ✗ ${file}: ${error.message}`);
    }
  }

  // Calculate summary statistics
  results.summary.totalSizeKB = (results.summary.totalSize / 1024).toFixed(2);

  // Write results to JSON
  const outputFile = join(PROJECT_ROOT, 'vite-parse-results.json');
  writeFileSync(outputFile, JSON.stringify(results, null, 2), 'utf-8');

  // Print summary
  console.log('=== Vite Files Parse Summary ===');
  console.log(`Total Vite config files: ${results.summary.totalFiles}`);
  console.log(`Total size: ${results.summary.totalSizeKB} KB`);
  console.log(`\nExternal plugins used:`);
  results.summary.plugins.forEach(plugin => {
    console.log(`  - ${plugin.name}`);
  });
  console.log(`\nCustom plugins defined:`);
  results.summary.customPlugins.forEach(plugin => {
    console.log(`  - ${plugin.name}${plugin.pluginName ? ` (${plugin.pluginName})` : ''}`);
    if (plugin.apply) {
      console.log(`    Apply: ${plugin.apply}`);
    }
    if (plugin.hooks.length > 0) {
      console.log(`    Hooks: ${plugin.hooks.join(', ')}`);
    }
  });
  console.log(`\nEnvironment variables defined:`);
  results.summary.envVars.forEach(envVar => {
    console.log(`  - ${envVar}`);
  });
  console.log(`\nBuild configurations: ${results.summary.buildConfigs}`);
  console.log(`Server configurations: ${results.summary.serverConfigs}`);

  console.log(`\n✓ Results saved to: ${outputFile}`);

  return results;
}

parseAllViteFiles().catch(console.error);
