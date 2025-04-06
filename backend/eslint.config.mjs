import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import nextPlugin from '@next/eslint-plugin-next';
import globals from 'globals';

export default [
  { 
    ignores: ['.next/*', 'node_modules/*'] 
  },
  // Use recommended JS configuration
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': tsPlugin,
      '@next/next': nextPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: {
        ...globals.node,
        ...globals.browser,
        React: true,
        JSX: true,
      }
    },
    rules: {
      // Disable Node.js global errors
      'no-undef': 'off',
      
      // Handle unused variables - Turn off completely
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      
      // TypeScript specific rules
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // Next.js specific rules
      '@next/next/no-html-link-for-pages': 'warn',
      '@next/next/no-img-element': 'warn',
    }
  }
];
