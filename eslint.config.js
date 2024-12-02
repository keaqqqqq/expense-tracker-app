import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import nextPlugin from '@next/eslint-plugin-next';

export default [
  {
    ignores: ['**/node_modules/**', '**/.next/**', '**/out/**', '**/coverage/**', '**/functions/lib/**', '**/functions/build/**']
  },
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        React: 'readonly',
        JSX: 'readonly',
        HTMLInputElement: 'readonly',
        FileReader: 'readonly',
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        process: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        File: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        module: 'readonly',
        jest: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react': reactPlugin,
      '@next/next': nextPlugin
    },
    rules: {
      ...typescript.configs['recommended'].rules,
      ...reactPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-undef': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-useless-catch': 'warn',
      '@typescript-eslint/no-namespace': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
      'react/prop-types': 'off',
      '@typescript-eslint/ban-ts-comment': 'warn',
      'no-empty': 'warn',
      'prefer-const': 'warn',
      'no-debugger': 'warn',
      'no-constant-condition': 'warn',
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  }
];