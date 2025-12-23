import globals from 'globals';

/**
 * Special case overrides
 * Handles edge cases like .eslintrc.cjs globals and *.server.* hook rules
 */
export default [
  {
    files: ['**/.eslintrc.cjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.server.*'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
    },
  },
];
