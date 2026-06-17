// eslint.config.js
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

const config = [
  // 基本
  js.configs.recommended,

  // 無視
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
    ],
  },

  // TypeScript（バックエンド）
  {
    files: ['**/*.ts'],

    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },

    plugins: {
      '@typescript-eslint': typescriptEslint,
    },

    rules: {
      // ===== TypeScript推奨 =====
      ...typescriptEslint.configs.recommended.rules,

      // ===== バックエンド品質 =====

      // consoleは許可（ログ用途）
      'no-console': 'off',

      // debuggerは禁止
      'no-debugger': 'error',

      // 未使用変数
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],

      // anyは警告（現実的）
      '@typescript-eslint/no-explicit-any': 'warn',

      // Promise忘れ防止（重要）
      '@typescript-eslint/no-floating-promises': 'error',

      // await忘れ防止
      '@typescript-eslint/require-await': 'warn',

      // null安全
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'error',

      // ===== JS基本 =====
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // Prettier（競合回避のみ）
  prettier,
];

export default config;