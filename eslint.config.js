import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import unicorn from 'eslint-plugin-unicorn';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'tmp/**',
      '*.js',
      '*.cjs',
      '*.mjs',
      'jest.setup.ts',
      '**/__tests__/**',
      '**/test-utils/**',
      'jest.config.js',
      'jest.e2e.config.js'
    ]
  },
  {
    files: ['src/**/*.ts'],
    plugins: {
      unicorn
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.json'
      }
    },
    rules: {
      // AI生成コード品質向上のための厳格なルール
      '@typescript-eslint/explicit-function-return-type': ['error', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true
      }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      'no-console': 'error',
      'no-debugger': 'error',
      'no-warning-comments': ['warn', { 
        terms: ['todo', 'fixme', 'xxx', 'hack'],
        location: 'start' 
      }],
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'brace-style': ['error', '1tbs'],
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'comma-dangle': ['error', 'never'],
      'no-trailing-spaces': 'error',
      'indent': ['error', 2, { SwitchCase: 1 }],
      'max-len': ['warn', { code: 120, comments: 150 }],
      
      // ファイル名規則（AI向け）
      'unicorn/filename-case': ['error', {
        case: 'kebabCase',
        ignore: [
          'CLAUDE.md',
          'README.md',
          'CHANGELOG.md',
          'LICENSE'
        ]
      }]
    }
  }
);