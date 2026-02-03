import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  // Global ignores (replaces deprecated .eslintignore)
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "dist-public/**",
      "**/dist-public/**",
      "coverage/**",
      "*.md",
      "*.min.js",
    ],
  },

  // Base JavaScript recommended rules
  js.configs.recommended,

  // TypeScript files (src/, tests/)
  {
    files: ["src/**/*.ts", "tests/**/*.ts"],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.eslint.json",
        tsconfigRootDir: __dirname,
      },
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": "off", // Handled by @typescript-eslint/no-unused-vars
      "no-undef": "off", // TypeScript handles this
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    },
  },

  // Node.js files (server.js, vite.config.js, scripts)
  {
    files: ["server.js", "vite.config.js", "scripts/**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-console": "off",
    },
  },

  // Browser JavaScript (public/js/)
  {
    files: ["public/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      "no-console": "warn",
      "no-unused-vars": "warn",
      "no-undef": "error",
    },
  },

  // AudioWorklet processors (special globals)
  {
    files: ["public/audio/*-processor.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        AudioWorkletProcessor: "readonly",
        registerProcessor: "readonly",
        currentFrame: "readonly",
        currentTime: "readonly",
        sampleRate: "readonly",
      },
    },
    rules: {
      "no-console": "off",
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    },
  },

  // Debug scripts and live tests (Node + Jest)
  {
    files: ["debug/**/*.js", "debug/**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      "no-console": "off",
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    },
  },

  // Tests (Jest globals for .js setup files)
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
    rules: {
      "no-console": "off",
    },
  },

  // Tests (Jest globals for .ts)
  {
    files: ["tests/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
    rules: {
      "no-console": "off",
    },
  }
);
