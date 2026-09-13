# Architectural Decisions

This document records the key architectural decisions made for this Hydrogen storefront boilerplate.

## Layout Architecture

**Decision**: Layout chrome lives in `app/layout/`, not `app/modules/layout/`

**Rationale**:

- Layout represents application-level concerns (global navigation, SEO, error handling)
- Layout should not be treated as a feature module
- Keeps module boundaries clean - modules focus on domain logic
- Layout can consume metadata from any module via the handle contract

**Consequences**:

- Layout imports are `@layout/..` not `@modules/layout/..`
- Modules export handle objects for layout metadata (SEO, breadcrumbs)
- Layout is owned by the application, not individual features

## Module-Driven Development

**Decision**: Feature modules own complete vertical slices

**Rationale**:

- Clear ownership boundaries prevent coupling
- Easier to add/remove/replace features
- Modules can be developed independently
- Forces explicit APIs between modules

**Boundaries**:

- Modules cannot import other modules
- Platform code cannot import modules
- Shared components avoid module-specific logic
- Route manifest wires everything together

## Explicit Routing

**Decision**: Single route manifest with no filesystem-based discovery

**Rationale**:

- Routing is infrastructure, not feature logic
- Clear overview of all URLs and their ownership
- Prevents accidental route conflicts
- Enables route refactoring without file moves

**Implementation**:

- All routes in `app/routes.ts`
- Explicit path-to-component mapping
- Layout routes wrap feature routes
- Resource routes (robots, sitemap) live outside layout

## Design Token System

**Decision**: CSS variables in `app/styles/tokens.css` with module-scoped styles

**Rationale**:

- Design consistency without complex tooling
- Easy to override for theming
- CSS modules prevent style leakage
- Minimal bundle size impact

**Structure**:

- `tokens.css` - Global design tokens
- `reset.css` - Base element resets
- `app.css` - Minimal global styles
- `{module}.module.css` - Component-scoped styles

## Import Boundaries

**Decision**: Strict import rules enforced by ESLint

**Rationale**:

- Prevents accidental architectural drift
- Makes dependencies explicit
- Easier to reason about code organization
- Automated enforcement reduces human error

**Rules**:

- Modules cannot import other modules
- Platform cannot import modules
- Shared components prefer domain-agnostic logic
- No dumping folders (app/lib, app/common, etc.)

## Error Handling Strategy

**Decision**: Standardized error boundaries with route-aware error UI

**Rationale**:

- Consistent error experience across the app
- Development-friendly error details
- Production-safe error messages
- Clear separation of error types (React vs Route vs Network)

**Implementation**:

- React ErrorBoundary for component errors
- Route ErrorBoundary for 404/500 responses
- Catchall boundary for unmatched routes
- Error logging hooks in platform layer

## GraphQL Organization

**Decision**: Module-owned queries with strategic caching

**Rationale**:

- Clear ownership of data requirements
- Prevents query sprawl and duplication
- Appropriate cache strategies per data type
- Type-safe generated interfaces

**Patterns**:

- Fragments composed hierarchically
- Cache duration matches data volatility
- Separate queries for different cache needs
- Module isolation prevents coupling

## Testing Strategy

**Decision**: Minimal smoke tests protecting architecture

**Rationale**:

- Avoid test maintenance burden
- Focus on structural integrity
- ESLint catches most issues
- CI validation prevents regressions

**Scope**:

- Route manifest smoke tests
- Import boundary verification
- Type checking and linting
- Build validation

## Path Aliases

**Decision**: Explicit TypeScript/Vite aliases for all top-level directories

**Rationale**:

- Clear import semantics
- Prevents relative import hell
- TypeScript and build tool alignment
- Explicit boundaries in code

**Aliases**:

- `@layout/*` → `app/layout/*`
- `@platform/*` → `app/platform/*`
- `@components/*` → `app/components/*`
- `@modules/*` → `app/modules/*`
- `@styles/*` → `app/styles/*`
- `~/*` → `app/*` (escape hatch)

## Shared Package Consumption

**Decision**: Consume shared logic through published `@commerce-atoms/*` npm packages.

**Rationale**:

- Single source of truth per capability. `metafield`, `seo`, `filters`, `money`, `variants`, `urlstate` each have one canonical implementation.
- Version-pinned consumption. Drift becomes impossible by construction; upgrades are explicit.
- No workspace coupling. The starter and every fork stay independently buildable.

**Setup**:

- `@commerce-atoms/*` packages are declared as regular `dependencies` in `package.json`.
- Node resolution via `node_modules`; no TypeScript path aliases required for these packages.
- Local development against an unpublished change uses `npm link` or `file:` protocol overrides, not a monorepo workspace.

**Consequences**:

- Adding a new shared capability means publishing a new `@commerce-atoms/*` package first, then depending on it, not adding a local package folder.
- The legacy `@shoppy/*` scope is deprecated (see ADR 002 in `@commerce-atoms/agents`).
