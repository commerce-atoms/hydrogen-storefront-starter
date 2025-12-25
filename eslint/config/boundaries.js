/**
 * Architecture boundary enforcement rules
 * Prevents dumping ground folders and enforces module boundaries
 */
export default [
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // Prevent dumping ground folders
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'app/lib/**',
                'app/common/**',
                'app/shared/**',
                'app/ui/**',
              ],
              message:
                'Dumping ground folders are forbidden. Use app/components/* (shared UI), app/hooks/* (generic hooks), app/utils/* (tiny utilities), app/platform/* (infrastructure), or keep code in modules. See docs/reference/modules.md',
            },
          ],
        },
      ],
    },
  },
  // Platform cannot import modules
  {
    files: ['app/platform/**/*.ts', 'app/platform/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@modules/*', '../modules/*', '../../modules/*'],
              message:
                'Platform code cannot import modules. Platform is infrastructure only. See docs/reference/platform.md',
            },
          ],
        },
      ],
    },
  },
  // Shared code cannot import modules
  {
    files: [
      'app/components/**/*.ts',
      'app/components/**/*.tsx',
      'app/hooks/**/*.ts',
      'app/hooks/**/*.tsx',
      'app/utils/**/*.ts',
      'app/utils/**/*.tsx',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@modules/*', '../modules/*', '../../modules/*'],
              message:
                'Shared code (components/hooks/utils) cannot import modules. Keep domain logic in modules. See docs/reference/modules.md',
            },
          ],
        },
      ],
    },
  },
];
