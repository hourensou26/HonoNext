// eslint.config.js
import js from '@eslint/js';
import next from 'eslint-config-next';
import prettierConfig from 'eslint-config-prettier';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';

const config = [
  js.configs.recommended,

  // Next.js公式ルール（かなり重要）
  ...next,

  {
    ignores: ['.next/**', 'node_modules/**', 'dist/**', 'build/**', 'out/**'],
  },

  {
    files: ['**/*.{ts,tsx,js,jsx}'],

    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },

    plugins: {
      '@typescript-eslint': typescriptEslint,
      'react-hooks': reactHooks,
    },

    rules: {
      // ===== 基本 =====
      'no-console': 'warn',
      'no-debugger': 'error',

      // ===== TS =====
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

      '@typescript-eslint/no-explicit-any': 'warn',

      // ===== JS品質 =====
      'prefer-const': 'error',
      'no-var': 'error',

      // ===== React Hooks =====
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Prettierは競合ルール無効化だけ
  prettierConfig,
];

export default config;
