/**
 * Smoke tests for routing architecture
 *
 * These tests protect routing principles, not specific routes.
 * They should NOT break when devs add/remove features.
 */

import fs from 'fs';

import {describe, expect, test} from 'vitest';

describe('Routing Architecture', () => {
  test('single route manifest exists and is valid', () => {
    const routesFilePath = 'app/routes.ts';
    expect(fs.existsSync(routesFilePath)).toBe(true);

    const content = fs.readFileSync(routesFilePath, 'utf-8');

    // Verify it imports from React Router (not Remix)
    expect(content).toContain("from '@react-router/dev/routes'");

    // Verify it uses Hydrogen routes wrapper
    expect(content).toContain('hydrogenRoutes');

    // Verify it has a default export
    expect(content).toContain('export default');

    // Verify it satisfies RouteConfig type
    expect(content).toContain('satisfies RouteConfig');
  });

  test('routes use explicit routing functions (not filesystem discovery)', () => {
    const content = fs.readFileSync('app/routes.ts', 'utf-8');

    // Should use explicit routing functions from React Router
    const explicitFunctions = ['route(', 'layout(', 'index(', 'prefix('];

    for (const fn of explicitFunctions) {
      expect(content).toContain(fn);
    }

    // Should NOT use filesystem patterns
    const forbiddenPatterns = [
      'lazy(', // Lazy loading indicates filesystem routes
      'routes/', // app/routes/ folder pattern
      '**/routes/**', // Glob pattern
    ];

    for (const pattern of forbiddenPatterns) {
      if (content.includes(pattern)) {
        throw new Error(
          `Route manifest contains filesystem discovery pattern: "${pattern}". Use explicit route() functions instead.`,
        );
      }
    }
  });

  test('locale layout route exists for application shell', () => {
    const content = fs.readFileSync('app/routes.ts', 'utf-8');

    // Layout route should be defined
    expect(content).toContain('layout(');

    // Should reference platform routing (locale validation)
    expect(content).toMatch(/layout\(['"]platform\/routing\/locale\.route/);
  });
});
