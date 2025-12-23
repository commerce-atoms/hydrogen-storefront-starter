/**
 * Smoke tests for project structure
 *
 * These tests protect core architecture, not specific features.
 * They should NOT break when devs customize the boilerplate.
 */

import fs from 'fs';
import path from 'path';

import {describe, expect, test} from 'vitest';

describe('Project Structure', () => {
  test('required core directories exist', () => {
    // Only test directories that MUST exist for the architecture to work
    const requiredDirs = [
      'app/modules', // Module-driven architecture requires this
      'app/layout', // Application shell required
      'app/styles', // Global tokens required
    ];

    const missing: string[] = [];

    for (const dir of requiredDirs) {
      if (!fs.existsSync(dir)) {
        missing.push(dir);
      }
    }

    if (missing.length > 0) {
      console.error('Missing required directories:', missing);
    }

    expect(missing).toHaveLength(0);
  });

  test('no barrel files (index.ts) exist in app/', () => {
    const findBarrelFiles = (dir: string, barrels: string[] = []): string[] => {
      if (!fs.existsSync(dir)) return barrels;

      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (
          stat.isDirectory() &&
          !item.startsWith('.') &&
          item !== 'node_modules' &&
          item !== 'dist' &&
          item !== '.react-router'
        ) {
          findBarrelFiles(fullPath, barrels);
        } else if (
          item === 'index.ts' ||
          item === 'index.tsx' ||
          item === 'index.js'
        ) {
          barrels.push(path.relative(process.cwd(), fullPath));
        }
      }

      return barrels;
    };

    const barrelFiles = findBarrelFiles('app');

    if (barrelFiles.length > 0) {
      console.error(
        'Found barrel files (index.ts). Use explicit imports instead:',
        barrelFiles,
      );
    }

    expect(barrelFiles).toHaveLength(0);
  });

  test('single route manifest exists', () => {
    // Must have exactly one route manifest
    expect(fs.existsSync('app/routes.ts')).toBe(true);

    // Should NOT have multiple route manifests
    const forbiddenManifests = [
      'app/routes.tsx',
      'app/router.ts',
      'app/routes/index.ts',
    ];

    for (const manifest of forbiddenManifests) {
      if (fs.existsSync(manifest)) {
        throw new Error(
          `Multiple route manifests detected: ${manifest}. Only app/routes.ts should exist.`,
        );
      }
    }
  });

  test('global design tokens file exists', () => {
    expect(fs.existsSync('app/styles/tokens.css')).toBe(true);
  });
});
