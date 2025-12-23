import requireDataTestId from '../rules/require-data-testid.js';

/**
 * Data-testid enforcement rule
 * Requires data-testid on interactive elements in components, layout, and modules
 * Excludes primitives (consumers add test IDs), route files, and test files
 */
export default {
  files: [
    'app/components/**/*.tsx',
    'app/layout/**/*.tsx',
    'app/modules/**/*.tsx',
  ],
  ignores: [
    '**/*.route.tsx',
    '**/*.test.tsx',
    '**/*.spec.tsx',
    'app/components/primitives/**/*.tsx', // Primitives are reusable - consumers add test IDs
  ],
  plugins: {
    'require-data-testid': {
      rules: {
        'require-data-testid': requireDataTestId,
      },
    },
  },
  rules: {
    'require-data-testid/require-data-testid': 'error',
  },
};
