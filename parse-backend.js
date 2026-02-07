import { readFileSync, statSync, readdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, relative } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function findTypeScriptFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    try {
      const stat = statSync(filePath);
      if (stat.isDirectory()) {
        // Skip node_modules, dist, coverage, and .git directories
        if (!['node_modules', 'dist', 'coverage', '.git', 'dist-public'].includes(file)) {
          findTypeScriptFiles(filePath, fileList);
        }
      } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
        fileList.push(filePath);
      }
    } catch (err) {
      // Skip files we can't access
    }
  });
  
  return fileList;
}

function findJavaScriptFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    try {
      const stat = statSync(filePath);
      if (stat.isDirectory()) {
        // Skip node_modules, dist, coverage, and .git directories
        if (!['node_modules', 'dist', 'coverage', '.git', 'dist-public', 'public'].includes(file)) {
          findJavaScriptFiles(filePath, fileList);
        }
      } else if (file.endsWith('.js') || file.endsWith('.mjs') || file.endsWith('.cjs')) {
        // Only include backend-related JS files (exclude frontend files in public/)
        const relativePath = relative(__dirname, filePath);
        if (!relativePath.startsWith('public') && 
            !relativePath.startsWith('parse-') && 
            !relativePath.includes('vite.config') &&
            !relativePath.includes('babel.config') &&
            !relativePath.includes('eslint.config') &&
            !relativePath.includes('jest.config')) {
          fileList.push(filePath);
        }
      }
    } catch (err) {
      // Skip files we can't access
    }
  });
  
  return fileList;
}

function parseTypeScript(content) {
  const lines = content.split('\n');
  const result = {
    imports: [],
    exports: [],
    classes: [],
    interfaces: [],
    types: [],
    functions: [],
    enums: [],
    variables: [],
    constants: [],
    comments: [],
    jsdocComments: [],
    dependencies: new Set(),
    metadata: {}
  };

  let inMultiLineComment = false;
  let multiLineCommentContent = [];
  let currentJsdoc = null;
  let braceDepth = 0;
  let parenDepth = 0;
  let inString = false;
  let stringChar = null;

  // Simple state machine for parsing
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const lineNum = i + 1;

    // Track string state
    let escaped = false;
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (!inString && (char === '"' || char === "'" || char === '`')) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar) {
        inString = false;
        stringChar = null;
      }
    }

    // Track brace/paren depth (simplified)
    if (!inString) {
      braceDepth += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      parenDepth += (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length;
    }

    // Multi-line comments
    if (trimmed.startsWith('/*')) {
      if (trimmed.includes('*/')) {
        // Single line multi-line comment
        const comment = trimmed.slice(2, trimmed.indexOf('*/'));
        if (comment.trim().startsWith('*')) {
          result.jsdocComments.push({
            content: comment.trim(),
            line: lineNum
          });
        } else {
          result.comments.push({
            content: comment.trim(),
            line: lineNum,
            type: 'block'
          });
        }
      } else {
        inMultiLineComment = true;
        multiLineCommentContent = [trimmed.slice(2)];
        if (trimmed.includes('*')) {
          currentJsdoc = trimmed.slice(2).trim();
        }
      }
      continue;
    }

    if (inMultiLineComment) {
      if (trimmed.includes('*/')) {
        multiLineCommentContent.push(trimmed.slice(0, trimmed.indexOf('*/')));
        const comment = multiLineCommentContent.join('\n');
        if (currentJsdoc || comment.trim().startsWith('*')) {
          result.jsdocComments.push({
            content: comment.trim(),
            line: lineNum - multiLineCommentContent.length
          });
        } else {
          result.comments.push({
            content: comment.trim(),
            line: lineNum - multiLineCommentContent.length,
            type: 'block'
          });
        }
        inMultiLineComment = false;
        multiLineCommentContent = [];
        currentJsdoc = null;
      } else {
        multiLineCommentContent.push(trimmed);
      }
      continue;
    }

    // Single line comments
    if (trimmed.startsWith('//') && !inString) {
      result.comments.push({
        content: trimmed.slice(2).trim(),
        line: lineNum,
        type: 'line'
      });
    }

    // Imports
    if (trimmed.startsWith('import ') && !inString) {
      const importMatch = line.match(/import\s+(?:(?:\{[^}]+\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]+\}|\*\s+as\s+\w+|\w+))*(?:\s*,\s*)?)?\s+from\s+['"]([^'"]+)['"]/);
      if (importMatch) {
        const modulePath = importMatch[1];
        result.imports.push({
          module: modulePath,
          line: lineNum,
          fullLine: trimmed
        });
        // Extract dependency (remove relative paths, get package name)
        if (!modulePath.startsWith('.')) {
          const pkgName = modulePath.split('/')[0];
          result.dependencies.add(pkgName);
        }
      }
    }

    // Exports
    if (trimmed.startsWith('export ') && !inString) {
      // Export class
      const classMatch = trimmed.match(/export\s+(?:default\s+)?class\s+(\w+)/);
      if (classMatch) {
        result.exports.push({
          type: 'class',
          name: classMatch[1],
          line: lineNum,
          isDefault: trimmed.includes('default')
        });
      }
      // Export interface
      const interfaceMatch = trimmed.match(/export\s+(?:default\s+)?interface\s+(\w+)/);
      if (interfaceMatch) {
        result.exports.push({
          type: 'interface',
          name: interfaceMatch[1],
          line: lineNum,
          isDefault: trimmed.includes('default')
        });
      }
      // Export type
      const typeMatch = trimmed.match(/export\s+(?:default\s+)?type\s+(\w+)/);
      if (typeMatch) {
        result.exports.push({
          type: 'type',
          name: typeMatch[1],
          line: lineNum,
          isDefault: trimmed.includes('default')
        });
      }
      // Export function
      const functionMatch = trimmed.match(/export\s+(?:default\s+)?(?:async\s+)?function\s+(\w+)/);
      if (functionMatch) {
        result.exports.push({
          type: 'function',
          name: functionMatch[1],
          line: lineNum,
          isDefault: trimmed.includes('default')
        });
      }
      // Export const/let/var
      const constMatch = trimmed.match(/export\s+(?:default\s+)?(?:const|let|var)\s+(\w+)/);
      if (constMatch) {
        result.exports.push({
          type: 'variable',
          name: constMatch[1],
          line: lineNum,
          isDefault: trimmed.includes('default')
        });
      }
      // Export * from
      const exportFromMatch = trimmed.match(/export\s+\*\s+from\s+['"]([^'"]+)['"]/);
      if (exportFromMatch) {
        result.exports.push({
          type: 'namespace',
          module: exportFromMatch[1],
          line: lineNum
        });
      }
    }

    // Classes
    const classMatch = trimmed.match(/(?:export\s+)?(?:default\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([^{]+))?/);
    if (classMatch && !inString) {
      const className = classMatch[1];
      const extendsClass = classMatch[2] || null;
      const implementsList = classMatch[3] ? classMatch[3].split(',').map(i => i.trim()) : [];
      
      // Find class methods (simplified - look for method patterns in the class)
      const methods = [];
      let inClass = true;
      let classBraceDepth = 0;
      
      for (let j = i + 1; j < lines.length && inClass; j++) {
        const classLine = lines[j];
        const classTrimmed = classLine.trim();
        
        // Track class brace depth
        classBraceDepth += (classLine.match(/{/g) || []).length - (classLine.match(/}/g) || []).length;
        
        if (classBraceDepth < 0) {
          inClass = false;
          break;
        }
        
        // Method patterns
        const methodMatch = classTrimmed.match(/(?:public|private|protected|static)?\s*(?:async\s+)?(\w+)\s*\(/);
        if (methodMatch && classBraceDepth >= 0) {
          const methodName = methodMatch[1];
          const isPrivate = classTrimmed.includes('private');
          const isPublic = classTrimmed.includes('public');
          const isProtected = classTrimmed.includes('protected');
          const isStatic = classTrimmed.includes('static');
          const isAsync = classTrimmed.includes('async');
          
          if (!['constructor', 'get', 'set'].includes(methodName)) {
            methods.push({
              name: methodName,
              line: j + 1,
              visibility: isPrivate ? 'private' : isProtected ? 'protected' : 'public',
              isStatic,
              isAsync
            });
          }
        }
      }
      
      result.classes.push({
        name: className,
        line: lineNum,
        extends: extendsClass,
        implements: implementsList,
        methods: methods,
        methodCount: methods.length
      });
    }

    // Interfaces
    const interfaceMatch = trimmed.match(/(?:export\s+)?(?:default\s+)?interface\s+(\w+)(?:\s+extends\s+([^{]+))?/);
    if (interfaceMatch && !inString) {
      const interfaceName = interfaceMatch[1];
      const extendsList = interfaceMatch[2] ? interfaceMatch[2].split(',').map(e => e.trim()) : [];
      
      result.interfaces.push({
        name: interfaceName,
        line: lineNum,
        extends: extendsList
      });
    }

    // Types
    const typeMatch = trimmed.match(/(?:export\s+)?(?:default\s+)?type\s+(\w+)\s*=/);
    if (typeMatch && !inString) {
      result.types.push({
        name: typeMatch[1],
        line: lineNum
      });
    }

    // Enums
    const enumMatch = trimmed.match(/(?:export\s+)?(?:default\s+)?enum\s+(\w+)/);
    if (enumMatch && !inString) {
      result.enums.push({
        name: enumMatch[1],
        line: lineNum
      });
    }

    // Functions (standalone, not in classes)
    const functionMatch = trimmed.match(/(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+(\w+)/);
    if (functionMatch && !inString && braceDepth === 0) {
      result.functions.push({
        name: functionMatch[1],
        line: lineNum,
        isAsync: trimmed.includes('async')
      });
    }

    // Arrow functions (const/let/var assignments)
    const arrowFunctionMatch = trimmed.match(/(?:export\s+)?(?:const|let|var)\s+(\w+)\s*[:=]\s*(?:async\s+)?\([^)]*\)\s*=>/);
    if (arrowFunctionMatch && !inString && braceDepth === 0) {
      result.functions.push({
        name: arrowFunctionMatch[1],
        line: lineNum,
        isArrow: true,
        isAsync: trimmed.includes('async')
      });
    }

    // Constants/Variables
    const constMatch = trimmed.match(/(?:export\s+)?(?:const|let|var)\s+(\w+)/);
    if (constMatch && !inString && braceDepth === 0 && !trimmed.includes('=>')) {
      const varName = constMatch[1];
      const isConst = trimmed.includes('const');
      if (isConst) {
        result.constants.push({
          name: varName,
          line: lineNum
        });
      } else {
        result.variables.push({
          name: varName,
          line: lineNum
        });
      }
    }
  }

  // Convert Set to Array for JSON serialization
  result.dependencies = Array.from(result.dependencies);

  // Calculate statistics
  result.metadata = {
    totalLines: lines.length,
    totalCharacters: content.length,
    totalWords: content.split(/\s+/).filter(w => w.length > 0).length,
    importCount: result.imports.length,
    exportCount: result.exports.length,
    classCount: result.classes.length,
    interfaceCount: result.interfaces.length,
    typeCount: result.types.length,
    functionCount: result.functions.length,
    enumCount: result.enums.length,
    constantCount: result.constants.length,
    variableCount: result.variables.length,
    commentCount: result.comments.length,
    jsdocCount: result.jsdocComments.length,
    dependencyCount: result.dependencies.length,
    totalMethods: result.classes.reduce((sum, c) => sum + c.methodCount, 0)
  };

  return result;
}

function directoryExists(dir) {
  try {
    const stat = statSync(dir);
    return stat.isDirectory();
  } catch (err) {
    return false;
  }
}

async function parseAllBackendFiles() {
  // Find all TypeScript files in src/ and tests/
  const srcDir = join(__dirname, 'src');
  const testsDir = join(__dirname, 'tests');
  const debugTestsDir = join(__dirname, 'debug', 'tests');
  
  const tsFiles = [];
  if (directoryExists(srcDir)) {
    tsFiles.push(...findTypeScriptFiles(srcDir));
  }
  if (directoryExists(testsDir)) {
    tsFiles.push(...findTypeScriptFiles(testsDir));
  }
  if (directoryExists(debugTestsDir)) {
    tsFiles.push(...findTypeScriptFiles(debugTestsDir));
  }
  
  // Find backend JavaScript files in root and other backend directories
  const jsFiles = [];
  // Check root directory for backend JS files
  const rootFiles = readdirSync(__dirname);
  rootFiles.forEach(file => {
    const filePath = join(__dirname, file);
    try {
      const stat = statSync(filePath);
      if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.mjs') || file.endsWith('.cjs'))) {
        // Include specific backend server files
        if (file === 'server.js' || file === 'server-cors-diagnostics.js') {
          jsFiles.push(filePath);
        }
      }
    } catch (err) {
      // Skip files we can't access
    }
  });
  
  // Also check for JS files in tests/ and debug/tests/ directories
  if (directoryExists(testsDir)) {
    jsFiles.push(...findJavaScriptFiles(testsDir));
  }
  if (directoryExists(debugTestsDir)) {
    jsFiles.push(...findJavaScriptFiles(debugTestsDir));
  }
  
  const allFiles = [...tsFiles, ...jsFiles];
  allFiles.sort();

  console.log(`Found ${tsFiles.length} TypeScript files and ${jsFiles.length} JavaScript files:\n`);

  const results = [];
  const summary = {
    totalFiles: allFiles.length,
    totalSize: 0,
    totalLines: 0,
    totalWords: 0,
    totalCharacters: 0,
    totalImports: 0,
    totalExports: 0,
    totalClasses: 0,
    totalInterfaces: 0,
    totalTypes: 0,
    totalFunctions: 0,
    totalEnums: 0,
    totalConstants: 0,
    totalVariables: 0,
    totalComments: 0,
    totalJSDoc: 0,
    totalMethods: 0,
    allDependencies: new Set(),
    errors: []
  };

  for (const file of allFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      const stats = statSync(file);
      const sizeKB = (stats.size / 1024).toFixed(2);
      const relativePath = relative(__dirname, file);
      
      // Use TypeScript parser for both TS and JS files (JS is a subset)
      const parsed = parseTypeScript(content);
      
      const fileResult = {
        file: relativePath,
        fullPath: file,
        sizeKB: parseFloat(sizeKB),
        ...parsed.metadata,
        imports: parsed.imports.map(imp => ({
          module: imp.module,
          line: imp.line
        })),
        exports: parsed.exports,
        classes: parsed.classes.map(c => ({
          name: c.name,
          line: c.line,
          extends: c.extends,
          implements: c.implements,
          methodCount: c.methodCount,
          methods: c.methods.map(m => ({
            name: m.name,
            line: m.line,
            visibility: m.visibility,
            isStatic: m.isStatic,
            isAsync: m.isAsync
          }))
        })),
        interfaces: parsed.interfaces,
        types: parsed.types,
        functions: parsed.functions,
        enums: parsed.enums,
        constants: parsed.constants,
        variables: parsed.variables,
        dependencies: parsed.dependencies
      };

      results.push(fileResult);

      // Update summary
      summary.totalSize += parseFloat(sizeKB);
      summary.totalLines += parsed.metadata.totalLines;
      summary.totalWords += parsed.metadata.totalWords;
      summary.totalCharacters += parsed.metadata.totalCharacters;
      summary.totalImports += parsed.metadata.importCount;
      summary.totalExports += parsed.metadata.exportCount;
      summary.totalClasses += parsed.metadata.classCount;
      summary.totalInterfaces += parsed.metadata.interfaceCount;
      summary.totalTypes += parsed.metadata.typeCount;
      summary.totalFunctions += parsed.metadata.functionCount;
      summary.totalEnums += parsed.metadata.enumCount;
      summary.totalConstants += parsed.metadata.constantCount;
      summary.totalVariables += parsed.metadata.variableCount;
      summary.totalComments += parsed.metadata.commentCount;
      summary.totalJSDoc += parsed.metadata.jsdocCount;
      summary.totalMethods += parsed.metadata.totalMethods;
      parsed.dependencies.forEach(dep => summary.allDependencies.add(dep));

      console.log(`✓ ${relativePath}`);
      console.log(`  Size: ${sizeKB} KB`);
      console.log(`  Lines: ${parsed.metadata.totalLines}`);
      console.log(`  Classes: ${parsed.metadata.classCount} (${parsed.metadata.totalMethods} methods)`);
      console.log(`  Interfaces: ${parsed.metadata.interfaceCount}`);
      console.log(`  Types: ${parsed.metadata.typeCount}`);
      console.log(`  Functions: ${parsed.metadata.functionCount}`);
      console.log(`  Exports: ${parsed.metadata.exportCount}`);
      console.log(`  Imports: ${parsed.metadata.importCount}`);
      if (parsed.classes.length > 0) {
        const classNames = parsed.classes.map(c => c.name).join(', ');
        console.log(`  Classes: ${classNames}`);
      }
      if (parsed.interfaces.length > 0) {
        const interfaceNames = parsed.interfaces.map(i => i.name).join(', ');
        console.log(`  Interfaces: ${interfaceNames}`);
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

  // Convert Set to Array for JSON
  summary.allDependencies = Array.from(summary.allDependencies);

  // Write results to JSON file
  const outputFile = join(__dirname, 'backend-parse-results.json');
  writeFileSync(outputFile, JSON.stringify({
    summary,
    files: results
  }, null, 2), 'utf-8');

  // Print summary
  console.log('\n=== Backend Parse Summary ===');
  console.log(`Total files: ${summary.totalFiles}`);
  console.log(`Total size: ${summary.totalSize.toFixed(2)} KB`);
  console.log(`Total lines: ${summary.totalLines.toLocaleString()}`);
  console.log(`Total words: ${summary.totalWords.toLocaleString()}`);
  console.log(`Total characters: ${summary.totalCharacters.toLocaleString()}`);
  console.log(`\nCode Structure:`);
  console.log(`  Classes: ${summary.totalClasses} (${summary.totalMethods} methods)`);
  console.log(`  Interfaces: ${summary.totalInterfaces}`);
  console.log(`  Types: ${summary.totalTypes}`);
  console.log(`  Functions: ${summary.totalFunctions}`);
  console.log(`  Enums: ${summary.totalEnums}`);
  console.log(`  Constants: ${summary.totalConstants}`);
  console.log(`  Variables: ${summary.totalVariables}`);
  console.log(`\nImports/Exports:`);
  console.log(`  Imports: ${summary.totalImports}`);
  console.log(`  Exports: ${summary.totalExports}`);
  console.log(`\nDocumentation:`);
  console.log(`  Comments: ${summary.totalComments}`);
  console.log(`  JSDoc: ${summary.totalJSDoc}`);
  console.log(`\nDependencies: ${summary.allDependencies.length}`);
  if (summary.allDependencies.length > 0) {
    console.log(`  ${summary.allDependencies.join(', ')}`);
  }
  
  if (summary.errors.length > 0) {
    console.log(`\nErrors: ${summary.errors.length}`);
    summary.errors.forEach(err => {
      console.log(`  - ${err.file}: ${err.error}`);
    });
  }

  console.log(`\n✓ Results saved to: ${outputFile}`);
}

parseAllBackendFiles().catch(console.error);
