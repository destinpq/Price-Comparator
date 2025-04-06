import nextEslintPlugin from '@next/eslint-plugin-next';
import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      '**/test-*.js',
      '**/temp-*.js',
      '**/temp-*.mjs',
      '**/*test.mjs',
      '**/check-interfaces.js',
      '**/direct-blinkit-test.js',
      '**/test-scraper-temp.js',
      '**/test-scraper-direct.js',
      '**/test-simple.js',
      '**/test-scrapers.js',
      '**/verify-scrapers.js'
    ]
  },
  // Use recommended JS configuration
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx,jsx}'],
    plugins: {
      '@next/next': nextEslintPlugin
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser
      }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-unused-vars': 'warn'
    }
  }
];
