import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      'js/bootstrap.min.js',
      'js/jquery-3.7.1.min.js'
    ]
  },
  {
    files: ['js/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.jquery
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': 'off'
    }
  },
  {
    files: ['tests/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.jquery,
        ...globals.qunit
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-global-assign': 'off',
      'no-unused-vars': 'off'
    }
  }
];
