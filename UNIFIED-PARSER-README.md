# Unified File Parser

**File:** `parse-all-files.js`

A comprehensive unified parser that combines all functionality from the individual `parse-*.js` files in the project.

## Features

The unified parser combines the following parsers:

1. **Backend Parser** - TypeScript/JavaScript backend files
2. **Frontend Parser** - HTML, CSS, JavaScript/TypeScript files
3. **Client Parser** - STT, TTS, WebSocket clients
4. **Cartesia Parser** - Cartesia-related files
5. **VAD Parser** - Voice Activity Detection files
6. **WebSocket Parser** - WebSocket-related files
7. **JSON Parser** - JSON files (including n8n workflows)
8. **Markdown Parser** - Markdown documentation files
9. **Vite Parser** - Vite configuration files

## Usage

### Parse All Files
```bash
node parse-all-files.js
# or explicitly
node parse-all-files.js --type=all
```

### Parse Specific File Types
```bash
# Backend files only
node parse-all-files.js --type=backend

# Frontend files only
node parse-all-files.js --type=frontend

# JSON files only
node parse-all-files.js --type=json

# Markdown files only
node parse-all-files.js --type=markdown

# Vite config files only
node parse-all-files.js --type=vite
```

### Custom Output File
```bash
node parse-all-files.js --output=custom-results.json
```

## Output

The parser generates `all-parse-results.json` (or custom filename) with the following structure:

```json
{
  "backend": [...],
  "frontend": {
    "html": [...],
    "javascript": [...],
    "css": [...],
    "audioworklet": [...]
  },
  "client": [...],
  "cartesia": [...],
  "vad": [...],
  "websocket": [...],
  "json": [...],
  "markdown": [...],
  "vite": [...],
  "summary": {
    "totalFiles": 182,
    "totalSizeKB": "2681.51",
    "byType": {...},
    "errors": [...]
  }
}
```

## What Gets Parsed

### Backend Files
- TypeScript files (`.ts`) in `src/`, `tests/`, `debug/tests/`
- Extracts: classes, interfaces, types, functions, imports, exports, dependencies

### Frontend Files
- HTML files - structure, elements, scripts, styles
- JavaScript/TypeScript files - functions, classes, WebSocket usage, AudioWorklet processors
- CSS files - rules, selectors, variables, media queries

### Specialized Parsers
- **Client files** - Identifies STT, TTS, WebSocket clients with endpoints and protocols
- **Cartesia files** - Cartesia API usage, classes, endpoints
- **VAD files** - Voice Activity Detection imports and configuration
- **WebSocket files** - WebSocket endpoints, protocols, reconnection logic
- **JSON files** - Validates JSON and identifies n8n workflows
- **Markdown files** - Headings, links, code blocks, tables
- **Vite files** - Vite configuration and plugins

## Example Output

```
🔍 Starting unified file parser (type: all)...

📦 Parsing backend files...
  ✓ src\stt-client.ts
  ✓ src\tts-client.ts
  ...

🌐 Parsing frontend files...
  ✓ public\index.html
  ✓ public\js\app.js
  ...

📋 Parsing JSON files...
  ✓ package.json
  ...

📝 Parsing Markdown files...
  ✓ README.md
  ...

================================================================================
PARSE SUMMARY
================================================================================
Total files parsed: 182
Total size: 2681.51 KB

By category:
  Backend: 16
  Frontend: 73 (HTML: 5, JS/TS: 68, CSS: 0, AudioWorklet: 8)
  Client: 6
  Cartesia: 15
  VAD: 7
  WebSocket: 14
  JSON: 17
  Markdown: 67
  Vite: 1

✓ Results saved to: all-parse-results.json

✅ All files parsed successfully!
```

## Benefits

1. **Single Source** - One file instead of 14+ separate parser files
2. **Unified Output** - All results in one JSON file
3. **Selective Parsing** - Parse only what you need with `--type` flag
4. **Comprehensive** - Combines all specialized parsers
5. **Efficient** - Single pass through files with multiple analyses

## Replacing Individual Parsers

You can now use `parse-all-files.js` instead of running individual parsers:

- ❌ `node parse-backend.js`
- ❌ `node parse-frontend-complete.js`
- ❌ `node parse-client-files.js`
- ❌ `node parse-cartesia-files.js`
- ❌ `node parse-vad-files.js`
- ❌ `node parse-websocket-files.js`
- ❌ `node parse-json-files.js`
- ❌ `node parse-md-files.js`
- ❌ `node parse-vite-files.js`
- ✅ `node parse-all-files.js` (replaces all of the above)

## Notes

- The parser automatically excludes `node_modules/`, `dist/`, `coverage/`, and `.git/` directories
- Errors are captured and reported in the summary
- All file paths are relative to the project root
- File sizes are reported in KB
