/**
 * Smoke test for test selector convention
 *
 * This test validates that interactive elements have data-testid attributes.
 * It uses simple heuristics to catch obvious drift, not perfect detection.
 *
 * Limitations:
 * - Approximate pattern matching (not AST-based)
 * - May have false positives (can be suppressed with ignore patterns)
 * - Fast execution prioritized over perfect accuracy
 *
 * To suppress false positives, add file patterns to IGNORE_PATTERNS below.
 */

import fs from 'fs';
import path from 'path';

import {describe, expect, test} from 'vitest';

describe('Test Selectors Convention', () => {
  const IGNORE_PATTERNS = [
    '**/*.test.tsx',
    '**/*.spec.tsx',
    '**/*.route.tsx', // Route files may not need test ids
    '**/node_modules/**',
    '**/dist/**',
    'app/components/primitives/**', // Primitives are reusable - consumers add test IDs
  ];

  function shouldIgnore(filePath: string): boolean {
    return IGNORE_PATTERNS.some((pattern) => {
      // Simple glob matching
      const regex = new RegExp(
        pattern
          .replace(/\*\*/g, '.*')
          .replace(/\*/g, '[^/]*')
          .replace(/\//g, '\\/'),
      );
      return regex.test(filePath);
    });
  }

  function findTsxFiles(dir: string, files: string[] = []): string[] {
    if (!fs.existsSync(dir)) return files;

    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativePath = path.relative(process.cwd(), fullPath);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (
          !item.startsWith('.') &&
          item !== 'node_modules' &&
          item !== 'dist'
        ) {
          findTsxFiles(fullPath, files);
        }
      } else if (item.endsWith('.tsx') && !shouldIgnore(relativePath)) {
        files.push(fullPath);
      }
    }

    return files;
  }

  function checkFileForTestIds(filePath: string): {
    violations: Array<{line: number; element: string}>;
  } {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const violations: Array<{line: number; element: string}> = [];

    // Simple heuristics: look for interactive elements without data-testid
    // This is approximate - not perfect, but catches obvious violations

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Skip comment lines
      const trimmedLine = line.trim();
      if (
        trimmedLine.startsWith('//') ||
        trimmedLine.startsWith('/*') ||
        trimmedLine.startsWith('*')
      ) {
        continue;
      }

      // Check for button elements without data-testid
      if (
        /<button\s+[^>]*>/.test(line) &&
        !/data-testid=/.test(line) &&
        !/eslint-disable.*require-data-testid/.test(
          lines.slice(Math.max(0, i - 2), i + 1).join('\n'),
        )
      ) {
        violations.push({line: lineNum, element: 'button'});
      }

      // Check for anchor elements with href (interactive links)
      if (
        /<a\s+[^>]*href/.test(line) &&
        !/data-testid=/.test(line) &&
        !/eslint-disable.*require-data-testid/.test(
          lines.slice(Math.max(0, i - 2), i + 1).join('\n'),
        )
      ) {
        violations.push({line: lineNum, element: 'a (with href)'});
      }

      // Check for input elements (skip hidden inputs)
      if (
        /<input\s+[^>]*>/.test(line) &&
        !/data-testid=/.test(line) &&
        !/type=["']hidden["']/.test(line) &&
        !/eslint-disable.*require-data-testid/.test(
          lines.slice(Math.max(0, i - 2), i + 1).join('\n'),
        )
      ) {
        violations.push({line: lineNum, element: 'input'});
      }

      // Check for select elements
      if (
        /<select\s+[^>]*>/.test(line) &&
        !/data-testid=/.test(line) &&
        !/eslint-disable.*require-data-testid/.test(
          lines.slice(Math.max(0, i - 2), i + 1).join('\n'),
        )
      ) {
        violations.push({line: lineNum, element: 'select'});
      }

      // Check for textarea elements
      if (
        /<textarea\s+[^>]*>/.test(line) &&
        !/data-testid=/.test(line) &&
        !/eslint-disable.*require-data-testid/.test(
          lines.slice(Math.max(0, i - 2), i + 1).join('\n'),
        )
      ) {
        violations.push({line: lineNum, element: 'textarea'});
      }
    }

    return {violations};
  }

  test('interactive elements in components have data-testid', () => {
    const componentDirs = ['app/components', 'app/layout', 'app/modules'];

    const allViolations: Array<{
      file: string;
      violations: Array<{line: number; element: string}>;
    }> = [];

    for (const dir of componentDirs) {
      if (!fs.existsSync(dir)) continue;

      const files = findTsxFiles(dir);

      for (const file of files) {
        const {violations} = checkFileForTestIds(file);
        if (violations.length > 0) {
          allViolations.push({
            file: path.relative(process.cwd(), file),
            violations,
          });
        }
      }
    }

    if (allViolations.length > 0) {
      console.error('\n❌ Found interactive elements without data-testid:\n');
      for (const {file, violations} of allViolations) {
        console.error(`  ${file}:`);
        for (const {line, element} of violations) {
          console.error(`    Line ${line}: ${element}`);
        }
      }
      console.error(
        '\n💡 Add data-testid attributes or suppress with:',
        '// eslint-disable-next-line require-data-testid -- reason\n',
      );
    }

    expect(allViolations).toHaveLength(0);
  });
});
