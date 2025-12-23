# Shoppy Local Development Integration

This document explains how local `@shoppy/*` packages are integrated into the development workflow.

## Overview

The boilerplate uses npm workspaces to enable local development of shared packages. This allows:

- Developing packages alongside the storefront
- Testing package changes immediately
- TypeScript resolution across workspace boundaries
- Easy transition between local and published packages

## Directory Structure

```
org-root/
├── shoppy/                     # Utility package monorepo
│   └── packages/
│       ├── variants/          # Product variant utilities
│       ├── urlstate/           # URL state management
│       ├── money/             # Money formatting
│       ├── seo/               # SEO meta builders
│       └── metafield/         # Metafield parsing
└── hydrogen-storefront-starter/
    ├── app/                   # Storefront application
    ├── package.json           # Root with workspace config
    └── tsconfig.json          # TypeScript config with @shoppy paths
```

## Package Organization

### @shoppy/variants

Product variant selection and availability utilities.

**Key exports**:

- `getAvailabilityMap()` - Calculate variant availability
- `pickDefaultVariant()` - Select default variant from product

**Usage**:

```typescript
import {getAvailabilityMap} from '@shoppy/variants/getAvailabilityMap';
import {pickDefaultVariant} from '@shoppy/variants/pickDefaultVariant';
```

### @shoppy/urlstate

URL-based state management for filters, pagination, sorting.

**Key exports**:

- `defineSearchSchema()` - Define filter/pagination schema
- `parseSearchState()` - Parse URL into state object
- `patchSearchParams()` - Update URL with new state

**Usage**:

```typescript
import {defineSearchSchema} from '@shoppy/urlstate/defineSearchSchema';
import {parseSearchState} from '@shoppy/urlstate/parseSearchState';
```

## Development Workflow

### Local Development

1. **Make changes** in `../shoppy/packages/*/src/` directories
2. **Build packages** (if needed):
   ```bash
   cd ../shoppy/packages/variants && npm run build
   cd ../shoppy/packages/urlstate && npm run build
   ```
3. **Test in storefront** - changes are immediately available

### Publishing Packages

1. **Increment version** in package.json
2. **Build and test** locally
3. **Publish to npm**:
   ```bash
   cd ../shoppy/packages/variants && npm publish
   ```
4. **Update storefront** dependency versions

### Switching Between Local and Published

The workspace setup automatically uses local packages. To use published versions:

1. **Remove local packages** from workspace
2. **Install published versions**:
   ```bash
   npm install @shoppy/variants@latest @shoppy/urlstate@latest
   ```

## TypeScript Configuration

### Path Mapping

```json
{
  "compilerOptions": {
    "paths": {
      "@shoppy/*": ["@shoppy/*/src", "@shoppy/*"]
    }
  }
}
```

This allows imports from both source and built versions.

### Package Exports

Each package should have proper `"exports"` in package.json:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./getAvailabilityMap": {
      "types": "./dist/availability/getAvailabilityMap.d.ts",
      "import": "./dist/availability/getAvailabilityMap.js"
    }
  }
}
```

## Build Configuration

### Individual Package Builds

Each package has its own build setup:

```json
{
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch"
  }
}
```

### Root Workspace

The root `package.json` includes workspace configuration:

```json
{
  "workspaces": ["../shoppy/packages/*"],
  "dependencies": {
    "@shoppy/variants": "file:../shoppy/packages/variants",
    "@shoppy/urlstate": "file:../shoppy/packages/urlstate",
    "@shoppy/money": "file:../shoppy/packages/money",
    "@shoppy/seo": "file:../shoppy/packages/seo"
  }
}
```

**Note:** npm workspaces (npm 7+) and Yarn workspaces use the same format and are compatible.

## Testing Local Packages

### Unit Tests

Run tests in individual packages:

```bash
cd ../shoppy/packages/variants && npm test
```

### Integration Tests

Test package integration in the storefront:

```bash
# From root directory
npm run test:smoke  # Tests storefront integration
```

## Best Practices

### Package Design

1. **Single Responsibility** - Each package has one clear purpose
2. **Tree Shakeable** - Use named exports for optimal bundling
3. **Type Safe** - Full TypeScript support with generated .d.ts files
4. **Well Tested** - Unit tests for all public APIs

### Development Workflow

1. **Atomic Changes** - Test package changes in isolation first
2. **Version Bumping** - Follow semantic versioning
3. **Documentation** - Keep README.md updated in each package
4. **Type Checking** - Ensure types work across workspace boundaries

### Publishing

1. **Pre-publish Checks** - Build, test, and lint before publishing
2. **Changelog** - Update CHANGELOG.md with changes
3. **Breaking Changes** - Major version bumps for breaking changes
4. **Deprecation** - Warn before removing APIs

## Troubleshooting

### Import Resolution Issues

If TypeScript can't resolve @shoppy imports:

1. Check tsconfig.json paths configuration
2. Ensure packages are built (have dist/ directories)
3. Verify package.json exports are correct

### Build Issues

If packages don't build correctly:

1. Check individual package tsconfig.json
2. Verify dependencies are installed
3. Check for TypeScript compilation errors

### Workspace Issues

If workspace isn't working:

1. Verify `package.json` workspaces array
2. Check that local package versions are "file:./path"
3. Run `npm install` from root (requires npm 7+)
4. Ensure Node.js 18+ (check with `node --version`)

## Migration Path

### From Monorepo to Published Packages

1. **Publish packages** to npm
2. **Update storefront** dependencies to use npm versions
3. **Remove local packages** from workspace
4. **Update CI/CD** to not build local packages

### From Published to Local Development

1. **Ensure packages exist** in `../shoppy/packages/` directory
2. **Update package.json** to use `file:../shoppy/packages/*` references
3. **Install dependencies** and build packages
4. **Update workspace** configuration to `../shoppy/packages/*`
