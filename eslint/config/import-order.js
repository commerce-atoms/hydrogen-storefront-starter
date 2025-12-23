/**
 * Import ordering rule configuration
 * Defines the import/order rule with pathGroups for consistent import organization
 *
 * Key principles:
 * - All value imports first
 * - Type imports grouped just before styles
 * - Styles always last (using 'object' group)
 * - Minimal, predictable spacing
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
          'object', // Styles live here, LAST
        ],
        pathGroups: [
          // --- External ---
          {
            pattern: '@shopify/**',
            group: 'external',
            position: 'after',
          },
          {
            pattern: '@commerce-atoms/**',
            group: 'external',
            position: 'after',
          },
          // --- Internal ---
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
          // --- Styles (ALWAYS LAST) ---
          {
            pattern: '@styles/**',
            group: 'object',
            position: 'after',
          },
          {
            pattern: '**/*.module.css',
            group: 'object',
            position: 'after',
          },
          {
            pattern: '**/*.css',
            group: 'object',
            position: 'after',
          },
        ],
        pathGroupsExcludedImportTypes: ['type'],
        // Fixes spacing explosion - only adds newlines between logical groups
        'newlines-between': 'always-and-inside-groups',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
  },
};
