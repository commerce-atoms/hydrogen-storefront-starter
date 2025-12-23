/**
 * Import ordering rule configuration
 * Defines the import/order rule with pathGroups for consistent import organization
 */
export default {
  files: ['**/*.{ts,tsx}'],
  rules: {
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'type',
          'index',
        ],
        pathGroups: [
          {
            pattern: '@shopify/**',
            group: 'external',
            position: 'after',
          },
          {
            pattern: '@shoppy/**',
            group: 'external',
            position: 'after',
          },
          {
            pattern: '@platform/**',
            group: 'internal',
            position: 'after',
          },
          {
            pattern: '@layout/**',
            group: 'internal',
            position: 'after',
          },
          {
            pattern: '@components/**',
            group: 'internal',
            position: 'after',
          },
          {
            pattern: '@modules/**',
            group: 'internal',
            position: 'after',
          },
          {
            pattern: '@hooks/**',
            group: 'internal',
            position: 'after',
          },
          {
            pattern: '@utils/**',
            group: 'internal',
            position: 'after',
          },
          {
            pattern: '@styles/**',
            group: 'internal',
            position: 'after',
          },
          {
            pattern: '**/*.module.css',
            group: 'index',
            position: 'after',
          },
          {
            pattern: '**/*.css',
            group: 'index',
            position: 'after',
          },
        ],
        pathGroupsExcludedImportTypes: ['type'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
  },
};
