/**
 * Smoke tests for architectural boundaries
 *
 * These tests protect core architecture, not content.
 * They should NOT break when devs customize the boilerplate.
 */

import fs from 'fs';
import path from 'path';

import {describe, expect, test} from 'vitest';

describe('Architectural Boundaries', () => {
  test('no forbidden dumping ground folders exist', () => {
    const forbiddenFolders = [
      'app/lib',
      'app/common',
      'app/shared',
      'app/graphql',
      'app/ui',
    ];

    const violations: string[] = [];

    for (const folder of forbiddenFolders) {
      if (fs.existsSync(folder)) {
        violations.push(`Forbidden folder exists: ${folder}`);
      }
    }

    if (violations.length > 0) {
      console.error('Dumping ground folder violations:', violations);
    }

    expect(violations).toHaveLength(0);
  });

  test('no CSS files in styles/ subfolders (must be colocated)', () => {
    const violations: string[] = [];

    function checkForStylesFolders(dir: string) {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (!stat.isDirectory()) continue;
        if (item.startsWith('.') || item === 'node_modules') continue;

        // Forbidden: app/components/styles/ or app/modules/*/styles/
        if (item === 'styles' && !fullPath.includes('app/styles')) {
          violations.push(
            `Found forbidden styles/ folder: ${path.relative(process.cwd(), fullPath)}. CSS must be colocated with components.`,
          );
        }

        checkForStylesFolders(fullPath);
      }
    }

    checkForStylesFolders('app');

    if (violations.length > 0) {
      console.error('CSS colocation violations:', violations);
    }

    expect(violations).toHaveLength(0);
  });

  test('shared layers cannot import from modules', () => {
    const violations: string[] = [];
    // Layout can import from modules for app shell integration
    const sharedLayers = ['app/components', 'app/utils', 'app/platform'];

    function checkFile(filePath: string) {
      if (!fs.existsSync(filePath)) return;
      if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;

      const content = fs.readFileSync(filePath, 'utf-8');

      // Check for imports from app/modules
      const moduleImportPatterns = [
        /from ['"]@modules\//,
        /from ['"]\.\.?\/.*modules\//,
        /from ['"]\.\.?\/.*\.\.\/.*modules\//,
      ];

      for (const pattern of moduleImportPatterns) {
        if (pattern.test(content)) {
          const relativePath = path.relative(process.cwd(), filePath);
          violations.push(
            `Shared layer file imports from modules: ${relativePath}`,
          );
          break; // Only report once per file
        }
      }
    }

    function checkDirectory(dir: string) {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip node_modules and hidden directories
          if (item.startsWith('.') || item === 'node_modules') continue;
          checkDirectory(fullPath);
        } else {
          checkFile(fullPath);
        }
      }
    }

    for (const layer of sharedLayers) {
      checkDirectory(layer);
    }

    if (violations.length > 0) {
      console.error(
        'Shared layer purity violations (cannot import from modules):',
        violations,
      );
    }

    expect(violations).toHaveLength(0);
  });
});
