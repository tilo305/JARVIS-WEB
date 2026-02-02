# ESLint Documentation - Complete Guide

## 📁 Directory Context
**Root**: `C:\Users\lazar\Downloads\Everything AI\Github\JARVIS-KING`
**File Location**: `C:\Users\lazar\Downloads\Everything AI\Github\JARVIS-KING\eSlInT dOcS.md`

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation Methods](#installation-methods)
4. [Quick Start](#quick-start)
5. [Configuration](#configuration)
6. [Configuration Files](#configuration-files)
7. [Rules Configuration](#rules-configuration)
8. [Error Levels](#error-levels)
9. [Command Line Interface](#command-line-interface)
10. [Manual Setup](#manual-setup)
11. [Global Installation](#global-installation)
12. [Best Practices](#best-practices)
13. [Integration with Project](#integration-with-project)
14. [Troubleshooting](#troubleshooting)
15. [Next Steps](#next-steps)

---

## 🎯 Overview

### What is ESLint?

ESLint is a tool for identifying and reporting on patterns found in ECMAScript/JavaScript code, with the goal of making code more consistent and avoiding bugs.

### Key Features

- **Completely Pluggable**: Every single rule is a plugin and you can add more at runtime
- **Extensible**: Add community plugins, configurations, and parsers
- **Customizable**: Configure rules individually or use shared configurations
- **Modern**: Supports latest ECMAScript features
- **Framework Agnostic**: Works with any JavaScript framework

### Plugin Architecture

- Every rule is a plugin
- Runtime plugin addition
- Community plugins available
- Custom parsers support
- Shareable configurations

---

## ⚙️ Prerequisites

### Required Node.js Versions

ESLint requires Node.js with the following versions:

- `^18.18.0` (Node.js 18.18.0 or higher)
- `^20.9.0` (Node.js 20.9.0 or higher)  
- `>=21.1.0` (Node.js 21.1.0 or higher)

### SSL Support

- **REQUIRED**: Node.js must be built with SSL support
- **Official Node.js distributions**: SSL is always built in
- **Custom builds**: Verify SSL support is enabled

### Project Requirements

- **package.json**: Must exist in your project
- **npm/yarn/pnpm/bun**: Package manager installed
- **Project structure**: Organized file structure recommended

---

## 🚀 Installation Methods

### Method 1: Quick Start (Recommended)

#### Using npm (npm 7+)
```bash
npm init @eslint/config@latest
```

#### Using yarn
```bash
yarn create @eslint/config
```

#### Using pnpm
```bash
pnpm create @eslint/config@latest
```

#### Using bun
```bash
bun create @eslint/config@latest
```

### Method 2: With Specific Shared Config

#### Using npm
```bash
# Use 'eslint-config-xo' shared config
npm init @eslint/config@latest -- --config eslint-config-xo
```

#### Using yarn
```bash
yarn create @eslint/config -- --config eslint-config-xo
```

#### Using pnpm
```bash
pnpm create @eslint/config@latest -- --config eslint-config-xo
```

#### Using bun
```bash
bun create @eslint/config@latest -- --config eslint-config-xo
```

### Method 3: Manual Installation

#### Step 1: Install ESLint Packages

**npm:**
```bash
npm install --save-dev eslint@latest @eslint/js@latest
```

**yarn:**
```bash
yarn add --dev eslint@latest @eslint/js@latest
```

**pnpm:**
```bash
pnpm add --save-dev eslint@latest @eslint/js@latest
```

**bun:**
```bash
bun add --dev eslint@latest @eslint/js@latest
```

#### Step 2: Create Configuration File
```bash
# Create JavaScript configuration file
touch eslint.config.js
```

#### Step 3: Add Configuration (see Configuration section below)

---

## 🎨 Quick Start

### Interactive Setup

1. **Run the initialization command**:
   ```bash
   npm init @eslint/config@latest
   ```

2. **Answer the questions**:
   - How would you like to use ESLint?
   - What type of modules does your project use?
   - Which framework does your project use?
   - Does your project use TypeScript?
   - Where does your code run? (Browser/Node)
   - What format do you want your config file to be in?

3. **Configuration file created**: `eslint.config.js` or `eslint.config.mjs`

### Running ESLint

#### Using npm
```bash
npx eslint yourfile.js
```

#### Using yarn
```bash
yarn dlx eslint yourfile.js
```

#### Using pnpm
```bash
pnpm dlx eslint yourfile.js
```

#### Using bun
```bash
bunx eslint yourfile.js
```

### Lint Multiple Files/Directories
```bash
npx eslint project-dir/ file.js
```

---

## 🔧 Configuration

### Migration Note

**Important**: If you are coming from a version before 9.0.0, please see the migration guide.

### Configuration File Creation

When you run `npm init @eslint/config`, you'll get:
- `eslint.config.js` (CommonJS)
- `eslint.config.mjs` (ES Modules)

### Basic Configuration Example

```javascript
import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";

export default defineConfig([
    { files: ["**/*.js"], languageOptions: { globals: globals.browser } },
    { files: ["**/*.js"], plugins: { js }, extends: ["js/recommended"] },
]);
```

### Configuration Breakdown

#### 1. **Import Required Modules**
```javascript
import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
```

#### 2. **Define File Patterns**
```javascript
{ files: ["**/*.js"] }
```

#### 3. **Set Language Options**
```javascript
{ languageOptions: { globals: globals.browser } }
```

#### 4. **Configure Plugins**
```javascript
{ plugins: { js } }
```

#### 5. **Extend Configurations**
```javascript
{ extends: ["js/recommended"] }
```

---

## 📄 Configuration Files

### File Names

- `eslint.config.js` (CommonJS)
- `eslint.config.mjs` (ES Modules)
- `eslint.config.cjs` (CommonJS explicit)

### Configuration Structure

```javascript
import { defineConfig } from "eslint/config";
import js from "@eslint/js";

export default defineConfig([
    // Global settings
    { files: ["**/*.js"], plugins: { js }, extends: ["js/recommended"] },
    
    // Specific overrides
    {
        files: ["src/**/*.js"],
        rules: {
            "no-unused-vars": "warn",
            "no-undef": "warn",
        },
    },
]);
```

### Environment Configuration

#### Browser Environment
```javascript
import globals from "globals";

export default defineConfig([
    { 
        files: ["**/*.js"], 
        languageOptions: { globals: globals.browser } 
    },
]);
```

#### Node.js Environment
```javascript
import globals from "globals";

export default defineConfig([
    { 
        files: ["**/*.js"], 
        languageOptions: { globals: globals.node } 
    },
]);
```

#### Mixed Environment
```javascript
import globals from "globals";

export default defineConfig([
    { 
        files: ["**/*.js"], 
        languageOptions: { 
            globals: {
                ...globals.browser,
                ...globals.node
            }
        } 
    },
]);
```

---

## 📏 Rules Configuration

### Using Recommended Rules

```javascript
import { defineConfig } from "eslint/config";
import js from "@eslint/js";

export default defineConfig([
    { files: ["**/*.js"], plugins: { js }, extends: ["js/recommended"] },
]);
```

**Note**: The `"js/recommended"` configuration ensures all rules marked as recommended on the rules page will be turned on.

### Custom Rules Configuration

```javascript
import { defineConfig } from "eslint/config";
import js from "@eslint/js";

export default defineConfig([
    { files: ["**/*.js"], plugins: { js }, extends: ["js/recommended"] },
    
    {
        rules: {
            "no-unused-vars": "warn",
            "no-undef": "warn",
            "no-console": "off",
            "semi": ["error", "always"],
            "quotes": ["error", "double"],
        },
    },
]);
```

### Rule Naming

- **Format**: `"rule-name"`
- **Plugin prefix**: `"plugin-name/rule-name"`
- **Examples**:
  - `"no-unused-vars"`
  - `"no-undef"`
  - `"react/prop-types"`

---

## 🎚️ Error Levels

### Three Error Levels

ESLint rules can be configured with three error levels:

#### 1. **Off (0)**
- **Value**: `"off"` or `0`
- **Behavior**: Rule is disabled completely
- **Use case**: When you don't want to enforce a rule

```javascript
{
    rules: {
        "no-console": "off",  // or 0
    },
}
```

#### 2. **Warn (1)**
- **Value**: `"warn"` or `1`
- **Behavior**: Rule violation shows as warning
- **Exit code**: Does NOT affect exit code (still 0)
- **Use case**: For rules you want to enforce eventually but not block builds

```javascript
{
    rules: {
        "no-unused-vars": "warn",  // or 1
    },
}
```

#### 3. **Error (2)**
- **Value**: `"error"` or `2`
- **Behavior**: Rule violation shows as error
- **Exit code**: Will be 1 (fails CI/CD)
- **Use case**: For rules that must be enforced

```javascript
{
    rules: {
        "no-undef": "error",  // or 2
    },
}
```

### Rule Options

Some rules accept additional options:

```javascript
{
    rules: {
        "semi": ["error", "always"],  // Require semicolons
        "quotes": ["error", "double", { "avoidEscape": true }],
        "max-len": ["warn", { "code": 100, "tabWidth": 2 }],
    },
}
```

---

## 💻 Command Line Interface

### Basic Usage

```bash
npx eslint [options] [file|dir|glob]*
```

### Common Commands

#### Lint a Single File
```bash
npx eslint file.js
```

#### Lint a Directory
```bash
npx eslint src/
```

#### Lint Multiple Files/Directories
```bash
npx eslint src/ lib/ app.js
```

#### Lint with Auto-Fix
```bash
npx eslint --fix file.js
```

#### Lint with Specific Config
```bash
npx eslint --config eslint.config.js file.js
```

#### Lint with Output Format
```bash
npx eslint --format stylish file.js
```

### CLI Options

#### `--fix`
- Automatically fix problems when possible
```bash
npx eslint --fix file.js
```

#### `--format`
- Specify output format
```bash
npx eslint --format json file.js
```

#### `--config`
- Use specific configuration file
```bash
npx eslint --config custom-config.js file.js
```

#### `--ignore-path`
- Specify ignore file
```bash
npx eslint --ignore-path .gitignore file.js
```

#### `--max-warnings`
- Exit with error if warnings exceed limit
```bash
npx eslint --max-warnings 0 file.js
```

#### `--quiet`
- Only report errors, not warnings
```bash
npx eslint --quiet file.js
```

#### `--debug`
- Output debugging information
```bash
npx eslint --debug file.js
```

---

## 🔨 Manual Setup

### Complete Manual Setup Process

#### Step 1: Verify Prerequisites

1. **Check Node.js version**:
   ```bash
   node --version
   ```

2. **Ensure package.json exists**:
   ```bash
   npm init  # if no package.json
   ```

#### Step 2: pnpm-Specific Configuration (if using pnpm)

Create `.npmrc` file with:

```ini
auto-install-peers=true
node-linker=hoisted
```

**Why this is needed**:
- Ensures pnpm installs dependencies compatible with npm
- Less likely to produce errors
- More compatible with ESLint plugins

#### Step 3: Install ESLint Packages

```bash
npm install --save-dev eslint@latest @eslint/js@latest
```

#### Step 4: Create Configuration File

```bash
touch eslint.config.js
```

#### Step 5: Add Configuration

```javascript
import { defineConfig } from "eslint/config";
import js from "@eslint/js";

export default defineConfig([
    {
        files: ["**/*.js"],
        plugins: {
            js,
        },
        extends: ["js/recommended"],
        rules: {
            "no-unused-vars": "warn",
            "no-undef": "warn",
        },
    },
]);
```

#### Step 6: Run ESLint

```bash
npx eslint project-dir/ file.js
```

---

## 🌍 Global Installation

### Installation Command

```bash
npm install eslint --global
```

### ⚠️ Important Notes

**NOT RECOMMENDED** because:

1. **Plugins must still be local**: Any plugins or shareable configs must be installed locally
2. **Version conflicts**: Different projects may need different ESLint versions
3. **Portability**: Project won't be portable to other developers
4. **CI/CD issues**: CI/CD environments won't have global packages

### When to Use Global Installation

- Quick testing/debugging
- One-off linting tasks
- Personal scripts outside projects

### Best Practice

**Always install ESLint locally** in your projects:

```bash
npm install --save-dev eslint@latest
```

---

## ✅ Best Practices

### 1. **Use Local Installation**
```bash
npm install --save-dev eslint@latest @eslint/js@latest
```

### 2. **Use Recommended Configurations**
```javascript
export default defineConfig([
    { files: ["**/*.js"], plugins: { js }, extends: ["js/recommended"] },
]);
```

### 3. **Customize Rules Gradually**
- Start with recommended rules
- Add custom rules as needed
- Document why rules are disabled

### 4. **Use Shareable Configs**
- Search for "eslint-config" on npmjs.com
- Examples:
  - `eslint-config-airbnb`
  - `eslint-config-standard`
  - `eslint-config-google`

### 5. **Integrate with Editor**
- VS Code: ESLint extension
- WebStorm: Built-in support
- Sublime Text: SublimeLinter-eslint
- Atom: linter-eslint

### 6. **Add to package.json Scripts**
```json
{
    "scripts": {
        "lint": "eslint .",
        "lint:fix": "eslint . --fix",
        "lint:check": "eslint . --max-warnings 0"
    }
}
```

### 7. **Use .eslintignore**
```
node_modules/
dist/
build/
coverage/
*.min.js
```

### 8. **Enable in Pre-commit Hooks**
```bash
npm install --save-dev husky lint-staged
```

```json
{
    "lint-staged": {
        "*.js": "eslint --fix"
    }
}
```

### 9. **Configure for CI/CD**
```yaml
# .github/workflows/lint.yml
name: Lint
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run lint
```

### 10. **Document Custom Rules**
```javascript
export default defineConfig([
    {
        rules: {
            // Disabled because we use console for debugging
            "no-console": "off",
            
            // Enforced for code consistency
            "semi": ["error", "always"],
        },
    },
]);
```

---

## 🔧 Integration with Project

### JARVIS-KING Integration

#### Current Setup

Based on the project structure:

**Root**: `C:\Users\lazar\Downloads\Everything AI\Github\JARVIS-KING`

**Configuration file**: `C:\Users\lazar\Downloads\Everything AI\Github\JARVIS-KING\eslint.config.js`

#### Recommended Configuration for This Project

```javascript
import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";

export default defineConfig([
    // Global settings for all JavaScript files
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        plugins: {
            js,
        },
        extends: ["js/recommended"],
    },
    
    // Main process (Electron)
    {
        files: ["src/main.js", "src/preload.js"],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
        rules: {
            "no-console": "off",  // Console allowed in Electron main
        },
    },
    
    // Renderer process
    {
        files: ["public/**/*.js"],
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            "no-console": "warn",  // Warn on console in browser
        },
    },
    
    // Services
    {
        files: ["src/services/**/*.js"],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
        rules: {
            "no-unused-vars": "warn",
            "no-undef": "error",
        },
    },
    
    // Tests
    {
        files: ["tests/**/*.js"],
        languageOptions: {
            globals: {
                ...globals.jest,
            },
        },
        rules: {
            "no-console": "off",  // Console allowed in tests
        },
    },
    
    // AudioWorklet processors
    {
        files: ["public/audio-*-processor.js"],
        languageOptions: {
            globals: {
                AudioWorkletProcessor: "readonly",
                registerProcessor: "readonly",
                currentFrame: "readonly",
                currentTime: "readonly",
                sampleRate: "readonly",
            },
        },
        rules: {
            "no-console": "off",  // Console allowed in AudioWorklet
        },
    },
]);
```

#### Add to package.json

```json
{
    "scripts": {
        "lint": "eslint .",
        "lint:fix": "eslint . --fix",
        "lint:check": "eslint . --max-warnings 0",
        "lint:src": "eslint src/",
        "lint:public": "eslint public/",
        "lint:tests": "eslint tests/"
    }
}
```

#### Create .eslintignore

```
# Dependencies
node_modules/

# Build outputs
dist/
build/
coverage/

# Debug files
debug/

# Documentation
*.md

# Config files
*.config.js
!eslint.config.js
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. **"ESLint couldn't find the config"**

**Problem**: Configuration file not found

**Solution**:
```bash
# Ensure eslint.config.js exists in root
ls eslint.config.js

# Or create it
touch eslint.config.js
```

#### 2. **"ESLint couldn't find the plugin"**

**Problem**: Plugin not installed locally

**Solution**:
```bash
npm install --save-dev @eslint/js
```

#### 3. **"Parsing error: Unexpected token"**

**Problem**: ECMAScript version mismatch

**Solution**:
```javascript
export default defineConfig([
    {
        languageOptions: {
            ecmaVersion: 2022,  // or "latest"
        },
    },
]);
```

#### 4. **"context.getScope is not a function"**

**Problem**: Using ESLint 9+ with old plugin

**Solution**:
- Update plugins to latest versions
- Check plugin compatibility with ESLint 9+

#### 5. **pnpm Installation Issues**

**Problem**: Hoisting issues with pnpm

**Solution**: Create `.npmrc`:
```ini
auto-install-peers=true
node-linker=hoisted
```

#### 6. **Circular fixes detected**

**Problem**: Conflicting rule auto-fixes

**Solution**:
- Check for conflicting rules
- Disable one of the conflicting rules
- Report to ESLint if it's a bug

### Debug Mode

Enable debug mode to see what ESLint is doing:

```bash
npx eslint --debug file.js
```

### Check Configuration

Verify your configuration is loaded correctly:

```bash
npx eslint --print-config file.js
```

---

## 🚀 Next Steps

### 1. **Learn Advanced Configuration**
- Multiple configuration files
- Override patterns
- Plugin development
- Custom rules

### 2. **Explore Plugins**
- `eslint-plugin-react`
- `eslint-plugin-vue`
- `eslint-plugin-import`
- `eslint-plugin-node`
- `eslint-plugin-promise`

### 3. **Integrate with Tools**
- Editor integration (VS Code, WebStorm)
- Build systems (Webpack, Rollup, Vite)
- CI/CD pipelines (GitHub Actions, GitLab CI)
- Pre-commit hooks (Husky, lint-staged)

### 4. **Create Custom Rules**
- Write custom rules for project-specific patterns
- Share rules with team via plugins
- Contribute to community

### 5. **Use Shareable Configs**
- Search npmjs.com for "eslint-config"
- Popular configs:
  - Airbnb: `eslint-config-airbnb`
  - Standard: `eslint-config-standard`
  - Google: `eslint-config-google`
  - XO: `eslint-config-xo`

### 6. **Contribute to ESLint**
- Report bugs
- Propose new rules
- Submit pull requests
- Help with documentation

---

## 📚 Additional Resources

### Official Documentation
- **Main site**: https://eslint.org
- **Getting Started**: https://eslint.org/docs/latest/use/getting-started
- **Configuration**: https://eslint.org/docs/latest/use/configure
- **Rules**: https://eslint.org/docs/latest/rules
- **CLI**: https://eslint.org/docs/latest/use/command-line-interface
- **Migration Guide**: https://eslint.org/docs/latest/use/migrate-to-9.0.0

### Community Resources
- **GitHub**: https://github.com/eslint/eslint
- **Discord**: https://eslint.org/chat
- **Twitter**: @geteslint
- **Stack Overflow**: [eslint] tag

### Plugins Directory
- **npm search**: https://www.npmjs.com/search?q=eslint-plugin
- **Awesome ESLint**: https://github.com/dustinspecker/awesome-eslint

---

## 📝 Summary

### Key Takeaways

1. **ESLint** is a pluggable linting utility for JavaScript
2. **Prerequisites**: Node.js `^18.18.0`, `^20.9.0`, or `>=21.1.0`
3. **Installation**: Use `npm init @eslint/config@latest` for quick start
4. **Configuration**: Use `eslint.config.js` with flat config format
5. **Error Levels**: `"off"` (0), `"warn"` (1), `"error"` (2)
6. **Best Practice**: Install locally, not globally
7. **Integration**: Editor, CI/CD, pre-commit hooks
8. **Extensibility**: Plugins, shareable configs, custom rules

### Quick Reference

```bash
# Install
npm install --save-dev eslint@latest @eslint/js@latest

# Initialize
npm init @eslint/config@latest

# Lint
npx eslint file.js

# Auto-fix
npx eslint --fix file.js

# Check
npx eslint . --max-warnings 0
```

---

**Document Created**: 2025-11-11  
**ESLint Version**: 9.x (Latest)  
**Node.js Compatibility**: ^18.18.0, ^20.9.0, >=21.1.0  
**Official Documentation**: https://eslint.org/docs/latest/use/getting-started












