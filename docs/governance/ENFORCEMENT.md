# Enforcement & Tooling

This document defines how architectural constraints are enforced through tooling and conventions.

**Single Responsibility**: Practical guardrails to keep the architecture consistent.

**See Also:**
- [governance.md](governance.md) - Non-negotiable constraints and review process
- [../reference/modules.md](../reference/modules.md) - Module structure and import rules

---

## Enforcement Layers

### 1. Conventions (Human-Enforced)

Guidelines that require team discipline and code review.

### 2. TypeScript Compiler

Path aliases and type checking enforce some boundaries automatically.

### 3. ESLint

Automated lint rules catch violations before they reach main branch.

### 4. CI Smoke Tests

Fast structural checks that fail builds if violations exist.

---

## Naming Conventions

### File Naming

| File Type | Pattern | Example |
|-----------|---------|---------|
| Route files | `*.route.tsx` | `product-handle.route.tsx` |
| View files | `*.view.tsx` | `product-handle.view.tsx` |
| Module components | `PascalCase.tsx` | `ProductForm.tsx` |
| CSS modules | `kebab-case.module.css` | `product-form.module.css` |
| GraphQL files | `lowercase.ts` | `queries.ts`, `fragments.ts` |
| Utilities | `camelCase.ts` | `formatPrice.ts` |

### Export Conventions

**Prefer named exports:**
```typescript
// ✅ GOOD
export function Button() { /* ... */ }
export function getProduct() { /* ... */ }
```

**Use default exports only when required:**
```typescript
// ✅ ACCEPTABLE (required by React Router)
export default function ProductRoute() { /* ... */ }
```

**Never use barrel files:**
```typescript
// ❌ FORBIDDEN
// app/components/index.ts
export * from './Button';
export * from './Input';
```

---

## TypeScript Path Aliases

Path aliases reduce relative import noise and make boundary violations visible in reviews.

### Approved Aliases

Configure in `tsconfig.json` and `vite.config.ts`:

```json
{
  "compilerOptions": {
    "paths": {
      "@layout/*": ["./app/layout/*"],
      "@modules/*": ["./app/modules/*"],
      "@components/*": ["./app/components/*"],
      "@platform/*": ["./app/platform/*"],
      "@hooks/*": ["./app/hooks/*"],
      "@utils/*": ["./app/utils/*"],
      "@styles/*": ["./app/styles/*"],
      "~/*": ["./app/*"],
      "@shoppy/*": ["@shoppy/*/src", "@shoppy/*"]
    }
  }
}
```

### Usage Guidelines

**Inside a module:**
```typescript
// ✅ Use relative imports for module-local files
import {ProductForm} from './components/ProductForm';

// ✅ Use aliases for global dependencies
import {Button} from '@components/Button';
import {createStorefrontClient} from '@platform/shopify/context';
```

**Forbidden:**
```typescript
// ❌ Don't use @/* root alias
import {Button} from '@/components/Button';

// ❌ Don't use deep relative imports across boundaries
import {helper} from '../../../platform/utils/helper';
```

### Configuration Rule

Aliases must be:
- ✅ Consistent across `tsconfig.json` and bundler (Vite)
- ✅ Consistent across lint tooling
- ✅ Non-overlapping

---

## ESLint Enforcement

### Required Rules

A minimal set of lint rules that prevent architectural drift:

#### 1. No Cross-Module Imports

**Rule:** `no-restricted-imports`

```javascript
// eslint.config.js
{
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['**/modules/*/!(types)*'],
          message: 'Modules cannot import from other modules. See docs/reference/modules.md',
        },
      ],
    }],
  },
}
```

#### 2. Platform Cannot Import Modules

```javascript
{
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['@modules/*', '../modules/*'],
          message: 'Platform code cannot import modules.',
        },
      ],
    }],
  },
  files: ['app/platform/**/*.ts', 'app/platform/**/*.tsx'],
}
```

#### 3. Prevent Dumping Ground Folders

```javascript
{
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['app/lib/**', 'app/common/**', 'app/shared/**', 'app/ui/**'],
          message: 'Dumping ground folders are forbidden. Use app/components/*, app/hooks/*, app/utils/*, app/platform/*, or keep code in modules.',
        },
      ],
    }],
  },
}
```

### Enforcement Strategy

**Option 1: `no-restricted-imports` (Simple, good enough)**
- Block imports from forbidden paths
- Easy to configure
- Works out of the box with ESLint

**Option 2: `eslint-plugin-boundaries` (Stronger)**
- Declare element types (module, platform, components)
- Enforce allowed dependencies
- More configuration, more power

**Recommendation:** Start with `no-restricted-imports`.

---

## CI Smoke Tests

Fast, lightweight tests that protect architecture without heavy test maintenance.

### What to Test

Located in `app/tests/`:

#### `boundaries.smoke.test.ts`

Verifies:
- ✅ No module → module imports
- ✅ No platform → module imports
- ✅ No forbidden folders exist (`app/lib`, `app/common`, etc.)

#### `structure.smoke.test.ts`

Verifies:
- ✅ Critical directories exist
- ✅ No barrel files (`index.ts`)
- ✅ Route manifest exists
- ✅ Design tokens file exists

#### `routing.smoke.test.ts`

Verifies:
- ✅ Route manifest structure is valid
- ✅ Critical routes are defined
- ✅ Resource routes present

#### `test-selectors.smoke.test.ts`

Verifies:
- ✅ Interactive elements have `data-testid` attributes
- ✅ Test selector convention is followed
- ✅ No class-based or text-based selectors in production code

See [../reference/test_selectors.md](../reference/test_selectors.md) for the full convention.

### Running Tests

```bash
npm run test:smoke    # Run all smoke tests
npm run ci            # Lint + typecheck + smoke tests
```

### Test Characteristics

- **Fast** - Run in < 5 seconds
- **Focused** - Structural integrity only
- **Non-invasive** - No runtime overhead
- **Node-based** - No DOM needed

---

## Pre-Commit Checklist

Use this checklist during code review:

### Routing
- [ ] Is the route added to the single route manifest (`app/routes.ts`)?
- [ ] Is the route mapped explicitly to a module file?
- [ ] Is layout nesting intentional and correct?

### Modules
- [ ] Does new feature logic live inside a module?
- [ ] Is module ownership clear?
- [ ] Are there any cross-module imports?

### Shared Components
- [ ] Is the component domain-agnostic?
- [ ] Could this component belong to a module instead?
- [ ] Does it avoid Storefront API and routing assumptions?

### Platform
- [ ] Is platform code limited to infrastructure concerns?
- [ ] Does it avoid feature-specific shaping?

### Structure
- [ ] Were new folders introduced only to reduce friction?
- [ ] Is any new global folder justified?

### Code Quality
- [ ] TypeScript compiles without errors?
- [ ] ESLint passes?
- [ ] Smoke tests pass?

---

## Editor Configuration

### `.editorconfig`

```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
```

### VSCode Settings (Recommended)

```json
{
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.css": "css"
  }
}
```

---

## Priority Order

If you only implement three guardrails initially:

1. **TypeScript path aliases** - `@platform`, `@components`, `@modules`
2. **ESLint: Platform → Modules restriction** - Prevent platform importing modules
3. **ESLint: Cross-module restriction** - Prevent module → module imports

Everything else can be added later without reworking the architecture.

---

## Handling Violations

### When a Rule is Violated

1. **Identify the violation** - ESLint, tests, or code review
2. **Understand the intent** - Why did this happen?
3. **Choose the fix:**
   - Refactor to comply with the rule
   - Promote shared code to appropriate bucket
   - Document as exception (if justified)

### Documenting Exceptions

If an exception is necessary:

```typescript
// eslint-disable-next-line no-restricted-imports
// TODO: Remove this cross-module import once ProductCard is promoted to shared
// Tracked in: https://github.com/org/repo/issues/123
import {ProductCard} from '@modules/products/components/ProductCard';
```

**Exception policy:**
- Must be documented with reason
- Must be tracked (issue/ticket)
- Must be temporary
- If repeated 2+ times, refactor instead

---

## Summary

**Enforcement exists to keep the architecture consistent as the codebase grows.**

**Layers:**
1. Conventions - Team discipline
2. TypeScript - Path aliases and types
3. ESLint - Automated boundary checks
4. CI Tests - Structural integrity

**These rules are not about control; they are about maintaining clarity and long-term maintainability.**

