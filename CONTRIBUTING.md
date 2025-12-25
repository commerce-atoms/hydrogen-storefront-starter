# Contributing

This document describes how to contribute to this Hydrogen storefront boilerplate while respecting its architectural constraints.

---

## Philosophy

This is **not a framework**. It's a structured starting point for building Shopify Hydrogen storefronts.

**Contributions should:**

- ✅ Be generally useful across different storefronts
- ✅ Follow existing architectural patterns
- ✅ Include documentation updates
- ✅ Pass all automated checks

**Contributions should NOT:**

- ❌ Add store-specific business logic
- ❌ Introduce framework abstractions
- ❌ Add opinionated UI styling
- ❌ Break architectural boundaries

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Familiarity with Shopify Hydrogen and React Router

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/doctor-undefined/hydrogen-storefront-base.git
   cd hydrogen-storefront-base
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run development server**

   ```bash
   npm run dev
   ```

4. **Run tests**
   ```bash
   npm run ci  # Lint + typecheck + smoke tests
   ```

---

## Developing with Local @shoppy Packages

If you're also contributing to `@shoppy` packages and want instant feedback:

### Setup

1. **Clone both repos side-by-side**

   ```
   ~/Projects/
     shoppy/                    # @shoppy monorepo
     hydrogen-storefront-starter/
   ```

2. **Switch to local dependencies**

   In `package.json`, replace the published versions:

   ```json
   // FROM (published):
   "@shoppy/filters": "^0.0.1",
   "@shoppy/urlstate": "^0.0.1",

   // TO (local):
   "@shoppy/filters": "file:../shoppy/packages/filters",
   "@shoppy/urlstate": "file:../shoppy/packages/urlstate",
   ```

   And add a workspaces entry:

   ```json
   "workspaces": ["../shoppy/packages/*"],
   ```

3. **Run both dev servers**

   ```bash
   # Terminal 1: @shoppy (rebuilds on change)
   cd ~/Projects/shoppy
   npm run dev

   # Terminal 2: starter
   cd ~/Projects/hydrogen-storefront-starter
   npm install
   npm run dev
   ```

### Switching Back

Before committing, restore published versions:

```json
"@shoppy/filters": "^0.0.1",
"@shoppy/urlstate": "^0.0.1",
```

And remove the `workspaces` array.

> **Note:** Don't commit `file:` references. The CI will fail.

---

### Read the Documentation

Before contributing, read:

1. [`docs/README.md`](docs/README.md) - Documentation overview
2. [`docs/reference/modules.md`](docs/reference/modules.md) - Module structure and import rules
3. [`docs/governance/governance.md`](docs/governance/governance.md) - Non-negotiable constraints

---

## Architectural Constraints

These rules are **non-negotiable** and enforced by automated tests:

### ✅ Module Boundaries

- **Modules NEVER import from other modules**
- Modules are vertical domain slices (routes, UI, data, logic)
- Cross-module reuse follows the [reuse ladder](docs/reference/modules.md#cross-module-reuse-ladder)

### ✅ Explicit Routing

- **Single route manifest** (`app/routes.ts`)
- No filesystem-based route discovery
- Routes map explicitly to module files
- Infrastructure routes (robots, sitemap, catchall, locale) in `app/platform/routing/`
- User-facing routes in `app/modules/*`

### ✅ Start Flat

- Modules start flat (route + view files)
- Subfolders added only when complexity demands:
  - `components/` when 2+ module components exist
  - `graphql/` when queries are needed
  - `hooks/` when domain-specific hooks exist
  - `utils/` when helpers exceed ~200 LOC

### ✅ CSS Colocation

- CSS modules **colocated directly** with components
- **NO `styles/` subfolders**
- Naming: `Button.tsx` → `button.module.css`

### ✅ Route/View Separation

- `*.route.tsx` - Loaders, actions, data fetching, metadata
- `*.view.tsx` - UI rendering only, no data fetching

### ✅ No Dumping Grounds

**Forbidden folders:**

- `app/lib/`
- `app/common/`
- `app/shared/`
- `app/ui/`

**Allowed shared buckets (with strict rules):**

- `app/components/*` - Domain-agnostic UI (2+ modules)
- `app/hooks/*` - Generic UI hooks only
- `app/utils/*` - Tiny utilities (< 200 LOC, no Shopify types)

---

## Pull Request Process

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

**Branch naming:**

- `feature/` - New features or modules
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates

### 2. Make Changes

Follow these guidelines:

- ✅ Match existing code style
- ✅ Use path aliases (`@modules/*`, `@components/*`, etc.)
- ✅ Add tests if adding new architectural rules
- ✅ Update documentation if changing structure
- ✅ Keep changes focused and scoped

### 3. Run Checks

Before committing:

```bash
# Run full CI pipeline
npm run ci

# Or individually:
npm run lint         # ESLint
npm run typecheck    # TypeScript
npm run test:smoke   # Smoke tests
```

**All checks must pass.**

### 4. Commit

Use clear, descriptive commit messages:

```bash
# Good
git commit -m "Add product review module with graphql queries"
git commit -m "Fix: CSS colocation in cart components"
git commit -m "Docs: Update modules.md with hooks policy"

# Bad
git commit -m "updates"
git commit -m "fix stuff"
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Create a pull request using the provided template.

### 6. PR Review Checklist

Your PR will be reviewed for:

**Code Quality:**

- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] Smoke tests pass

**Architecture:**

- [ ] No cross-module imports
- [ ] Module boundaries respected
- [ ] CSS colocated properly
- [ ] Route/view separation maintained
- [ ] No forbidden folders created

**Documentation:**

- [ ] Docs updated if structure changed
- [ ] ADR added if architectural decision made
- [ ] README updated if new feature added

**Testing:**

- [ ] Smoke tests updated if new rules added
- [ ] Architectural constraints enforced

---

## Types of Contributions

### ✅ New Modules

**When to contribute:**

- Common e-commerce feature (wishlists, reviews, etc.)
- Generally useful across different stores
- Well-structured example of module scaling

**Requirements:**

- Start flat (route + view files)
- Include GraphQL queries/fragments
- Add route to `app/routes.ts`
- Document in `docs/reference/modules.md` (if structure changes)

### ✅ Shared Components

**When to contribute:**

- Component used in 2+ modules
- Domain-agnostic (no business logic)
- Well-typed with TypeScript

**Requirements:**

- Add to `app/components/`
- Colocate CSS module
- No data fetching
- No module imports

### ✅ Documentation Improvements

**Always welcome:**

- Clarifications to existing docs
- New playbooks for common tasks
- Examples and best practices
- Typo fixes

**Requirements:**

- Follow existing doc structure
- Update `docs/README.md` if adding new files
- Use clear, concise language

### ✅ Bug Fixes

**Requirements:**

- Describe what was broken
- Explain how you fixed it
- Add test if architectural bug

### ❌ Not Accepted

- Store-specific business logic
- Opinionated UI frameworks (Tailwind, Material-UI, etc.)
- Framework abstractions or meta-frameworks
- Breaking changes without discussion

---

## Enforcement Mechanisms

### Automated

1. **TypeScript** - Strict type checking
2. **ESLint** - Import restrictions and code quality
3. **Smoke Tests** - Architectural integrity
   - `boundaries.smoke.test.ts` - Module isolation
   - `structure.smoke.test.ts` - File structure
   - `routing.smoke.test.ts` - Route manifest
4. **CI Pipeline** - All checks in GitHub Actions

### Manual

1. **Code Review** - Architectural compliance
2. **Documentation Review** - Consistency and clarity

---

## Development Workflow

### Adding a New Feature

1. Read [`docs/guides/add_feature.md`](docs/guides/add_feature.md)
2. Decide module ownership
3. Create route and view files
4. Add to route manifest
5. Run tests
6. Update docs

### Refactoring a Module

1. Read [`docs/guides/scale_module.md`](docs/guides/scale_module.md)
2. Identify friction points
3. Add folders incrementally
4. Keep imports explicit
5. Run tests

### Scaling GraphQL

1. Read [`docs/guides/scale_graphql.md`](docs/guides/scale_graphql.md)
2. Start consolidated (`queries.ts`)
3. Split only when > 250-400 LOC
4. Use structured folders

---

## Reporting Issues

### Bug Reports

Include:

- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment (Node version, OS)

### Feature Requests

Describe:

- Use case
- Why it's generally useful
- How it fits the architecture
- Willingness to implement

### Documentation Issues

Note:

- Which doc is unclear
- What you expected to find
- Suggested improvements

---

## Questions?

- **Architecture questions:** See [`docs/reference/`](docs/reference/)
- **How-to questions:** See [`docs/guides/`](docs/guides/)
- **Process questions:** See [`docs/governance/`](docs/governance/)
- **Still stuck?** Open a discussion

---

## Code of Conduct

- Be respectful and professional
- Focus on the architecture, not individuals
- Provide constructive feedback
- Help maintain code quality

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT).

---

## Thank You!

Your contributions help make this boilerplate better for everyone building scalable Shopify storefronts. 🚀
