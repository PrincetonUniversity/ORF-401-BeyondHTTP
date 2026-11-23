import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/', 'test-results/', 'playwright-report/', 'coverage/'] },
  js.configs.recommended,
  {
    files: ['site/**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.worker, ...globals.serviceworker } },
  },
  {
    files: ['scripts/**/*.js', 'tests/**/*.js', '*.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    // Playwright tests run callbacks inside the page via page.evaluate().
    files: ['tests/e2e/**/*.js'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  {
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      eqeqeq: 'error',
      'no-implicit-globals': 'error',
    },
  },
];
