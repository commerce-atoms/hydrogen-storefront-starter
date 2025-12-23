#!/usr/bin/env node

/**
 * agents-sync.mjs
 *
 * Syncs AI agent rules from commerce-atoms/agents repository.
 * This script fetches rule files and writes them locally with header comments.
 *
 * Usage:
 *   node agents-sync.mjs              # Sync from remote (default)
 *   node agents-sync.mjs --local ../agents  # Sync from local clone
 *   node agents-sync.mjs --check      # Check for drift (no writes)
 *   node agents-sync.mjs --verbose    # Print detailed output
 *   node agents-sync.mjs --ref v1     # Sync from specific git ref
 */

import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';

// =============================================================================
// Configuration
// =============================================================================

const REPO_URL = 'https://github.com/commerce-atoms/agents';
const RAW_BASE = 'https://raw.githubusercontent.com/commerce-atoms/agents';
const DEFAULT_REF = 'main';

/**
 * Sync manifest: defines what files to sync from where to where.
 * Update this when adding new rule files or targets.
 */
const SYNC_MANIFEST = {
  cursor: {
    source: 'rules/cursor/hydrogen',
    destination: '.cursor/rules',
    files: [
      '00-system.mdc',
      '10-imports.mdc',
      '20-routing.mdc',
      '30-architecture-boundaries.mdc',
    ],
  },
  copilot: {
    source: 'rules/copilot/hydrogen',
    destination: '.github',
    files: ['copilot-instructions.md'],
  },
};

// =============================================================================
// Header Templates
// =============================================================================

function getMdcHeader(sourcePath) {
  return `# ============================================================================
# AUTO-SYNCED FROM: ${REPO_URL}
# SOURCE: ${sourcePath}
# DO NOT EDIT — changes will be overwritten on next sync.
# To customize: create additional rule files (e.g., 99-local-overrides.mdc)
# ============================================================================

`;
}

function getMdHeader(sourcePath) {
  return `<!--
============================================================================
AUTO-SYNCED FROM: ${REPO_URL}
SOURCE: ${sourcePath}
DO NOT EDIT — changes will be overwritten on next sync.
To customize: create a separate file or add local sections below the marker.
============================================================================
-->

`;
}

function getHeader(filename, sourcePath) {
  if (filename.endsWith('.mdc')) {
    return getMdcHeader(sourcePath);
  }
  if (filename.endsWith('.md')) {
    return getMdHeader(sourcePath);
  }
  // Default to hash-comment style
  return getMdcHeader(sourcePath);
}

// =============================================================================
// File Operations
// =============================================================================

async function fetchRemoteFile(ref, filePath) {
  const url = `${RAW_BASE}/${ref}/${filePath}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
    );
  }
  return response.text();
}

function readLocalFile(basePath, filePath) {
  const fullPath = join(basePath, filePath);
  if (!existsSync(fullPath)) {
    throw new Error(`Local file not found: ${fullPath}`);
  }
  return readFileSync(fullPath, 'utf-8');
}

function writeFile(destPath, content) {
  const dir = dirname(destPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, {recursive: true});
  }
  writeFileSync(destPath, content, 'utf-8');
}

function readExistingFile(path) {
  if (!existsSync(path)) {
    return null;
  }
  return readFileSync(path, 'utf-8');
}

// =============================================================================
// Sync Logic
// =============================================================================

async function syncFile(options, tool, filename, sourceDir, destDir) {
  const {localPath, ref, checkOnly, verbose} = options;
  const sourcePath = `${sourceDir}/${filename}`;
  const destPath = join(destDir, filename);

  // Fetch content
  let content;
  if (localPath) {
    content = readLocalFile(localPath, sourcePath);
  } else {
    content = await fetchRemoteFile(ref, sourcePath);
  }

  // Add header
  const header = getHeader(filename, sourcePath);
  const finalContent = header + content;

  // Check existing
  const existing = readExistingFile(destPath);

  if (existing === finalContent) {
    if (verbose) {
      console.log(`  ✓ ${destPath} (unchanged)`);
    }
    return {path: destPath, status: 'unchanged'};
  }

  if (checkOnly) {
    console.log(`  ✗ ${destPath} (would change)`);
    return {path: destPath, status: 'drift'};
  }

  // Write file
  writeFile(destPath, finalContent);
  const status = existing === null ? 'created' : 'updated';
  console.log(
    `  ${status === 'created' ? '➕' : '🔄'} ${destPath} (${status})`,
  );
  return {path: destPath, status};
}

async function sync(options) {
  const {checkOnly, verbose} = options;
  const results = [];

  console.log(
    checkOnly ? '\nChecking for drift...\n' : '\nSyncing agent rules...\n',
  );

  for (const [tool, config] of Object.entries(SYNC_MANIFEST)) {
    if (verbose) {
      console.log(`[${tool}]`);
    }

    for (const file of config.files) {
      try {
        const result = await syncFile(
          options,
          tool,
          file,
          config.source,
          config.destination,
        );
        results.push(result);
      } catch (error) {
        console.error(`  ❌ Error syncing ${file}: ${error.message}`);
        results.push({path: file, status: 'error', error: error.message});
      }
    }
  }

  return results;
}

// =============================================================================
// CLI
// =============================================================================

function parseArgs(args) {
  const options = {
    localPath: null,
    ref: DEFAULT_REF,
    checkOnly: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--local' && args[i + 1]) {
      options.localPath = args[++i];
    } else if (arg === '--ref' && args[i + 1]) {
      options.ref = args[++i];
    } else if (arg === '--check') {
      options.checkOnly = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else if (arg.startsWith('-')) {
      console.error(`Unknown option: ${arg}`);
      printHelp();
      process.exit(3);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
agents-sync.mjs — Sync AI agent rules from commerce-atoms/agents

Usage:
  node agents-sync.mjs [options]

Options:
  --local <path>   Sync from local agents clone (for development)
  --ref <ref>      Git ref to sync from (default: main)
  --check          Check for drift without writing files
  --verbose, -v    Print detailed output
  --help, -h       Show this help message

Examples:
  node agents-sync.mjs                    # Sync from remote
  node agents-sync.mjs --local ../agents  # Sync from local clone
  node agents-sync.mjs --check            # Check for drift (CI mode)
  node agents-sync.mjs --ref v1           # Sync from tag v1
`);
}

function printSummary(results) {
  const created = results.filter((r) => r.status === 'created').length;
  const updated = results.filter((r) => r.status === 'updated').length;
  const unchanged = results.filter((r) => r.status === 'unchanged').length;
  const drift = results.filter((r) => r.status === 'drift').length;
  const errors = results.filter((r) => r.status === 'error').length;

  console.log('\nSummary:');
  if (created > 0) console.log(`  ➕ Created: ${created}`);
  if (updated > 0) console.log(`  🔄 Updated: ${updated}`);
  if (unchanged > 0) console.log(`  ✓ Unchanged: ${unchanged}`);
  if (drift > 0) console.log(`  ✗ Drift detected: ${drift}`);
  if (errors > 0) console.log(`  ❌ Errors: ${errors}`);
}

async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (options.verbose) {
    console.log('Options:', options);
  }

  try {
    const results = await sync(options);
    printSummary(results);

    const hasErrors = results.some((r) => r.status === 'error');
    const hasDrift = results.some((r) => r.status === 'drift');

    if (hasErrors) {
      process.exit(2);
    }
    if (options.checkOnly && hasDrift) {
      console.log('\n⚠️  Drift detected. Run without --check to update files.');
      process.exit(1);
    }

    console.log('\n✅ Done.');
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Fatal error: ${error.message}`);
    process.exit(2);
  }
}

main();
