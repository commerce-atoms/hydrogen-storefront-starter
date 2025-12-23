/**
 * ESLint ignore patterns
 * Excludes build artifacts, generated files, and the separate @shoppy monorepo
 */

export default {
  ignores: [
    '**/node_modules/',
    '**/build/',
    '**/dist/',
    '**/*.graphql.d.ts',
    '**/*.graphql.ts',
    '**/*.generated.d.ts',
    '**/.react-router/',
    '**/packages/hydrogen/dist/',
    '@shoppy/**', // Separate project with own eslint config
  ],
};
