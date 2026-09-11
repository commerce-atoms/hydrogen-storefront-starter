# Documentation

This folder documents the **reference architecture** for this Hydrogen storefront boilerplate.

**Purpose:**

- Explain how the project is structured
- Define architectural constraints and why they exist
- Guide feature development without creating structural debt

**This is not a framework or generator.** It's a baseline structure meant to be cloned and adapted for real storefronts.

**Authoritative sources:**

- Enforced rules: `.cursor/rules/*` and `app/tests/*` (smoke tests)
- Architectural intent and guidance: This documentation

---

---

## What This Repository Is

A **module-driven architecture** for Shopify Hydrogen storefronts built on React Router.

**Key characteristics:**

- **Vertical domain slices** - Each module owns routes, UI, data, and logic
- **Explicit, config-based routing** - Single route manifest
- **Minimal global shared code** - Isolated modules
- **Predictable growth patterns** - Start flat, grow incrementally

**Designed for:**

- Multi-feature storefronts
- Long-lived codebases
- Teams that need clarity and refactor safety

---

## What This Repository Is Not

- ❌ Not a replacement for Hydrogen or React Router
- ❌ Not a meta-framework
- ❌ Not a routing abstraction
- ❌ Not opinionated about UI design systems or styling
- ❌ Not optimized for one-off or short-lived sites

**If you need a fast prototype or very small store, the default Hydrogen starter may be more appropriate.**

---

## Documentation Structure

### 📚 Reference (Architectural Rules)

Core concepts and constraints that define the architecture.

| Document                                                     | Purpose                                                               |
| ------------------------------------------------------------ | --------------------------------------------------------------------- |
| [**modules.md**](reference/modules.md)                       | Module structure, scaling, and import rules                           |
| [**routing.md**](reference/routing.md)                       | Explicit routing conventions and URL patterns                         |
| [**layout.md**](reference/layout.md)                         | Layout metadata and route handle contract                             |
| [**graphql.md**](reference/graphql.md)                       | GraphQL organization, caching, and type safety                        |
| [**platform.md**](reference/platform.md)                     | Platform layer rules and what belongs there                           |
| [**metaobjects.md**](reference/metaobjects.md)               | Metaobjects, transformers, and the metafield-backed feature pattern   |
| [**setup-scripts.md**](reference/setup-scripts.md)           | Idempotent Admin API provisioning for custom-data schema              |
| [**collection-theming.md**](reference/collection-theming.md) | Per-collection theming — reference implementation of the pattern      |
| [**test-selectors.md**](reference/test-selectors.md)         | Test selector convention and E2E testing patterns                     |

### 🔧 Guides (How To Build)

Step-by-step playbooks for common development tasks.

| Guide                                           | When to Use                             |
| ----------------------------------------------- | --------------------------------------- |
| [**add_feature.md**](guides/add_feature.md)     | Adding a new page or feature            |
| [**scale_module.md**](guides/scale_module.md)   | Refactoring a module as it grows        |
| [**scale_graphql.md**](guides/scale_graphql.md) | Organizing GraphQL files that get large |

### 🔒 Governance (Process & Enforcement)

Rules about rules and how they're enforced.

| Document                                        | Purpose                                         |
| ----------------------------------------------- | ----------------------------------------------- |
| [**governance.md**](governance/governance.md)   | Non-negotiable constraints and review checklist |
| [**enforcement.md**](governance/enforcement.md) | Tooling, linting, and automated enforcement     |
| [**decisions.md**](governance/decisions.md)     | Architectural decision records (ADRs)           |

---

## Quick Start

### For New Contributors

**Recommended reading order:**

1. **This file** - Overview and structure
2. [reference/modules.md](reference/modules.md) - Modules, structure, and import rules
3. [reference/routing.md](reference/routing.md) - How routes work
4. [governance/governance.md](governance/governance.md) - Constraints and review process
5. [guides/add_feature.md](guides/add_feature.md) - Add your first feature

**You don't need to read everything up front.** Use these documents as reference when making structural decisions.

### For Quick Reference

| Need                    | Document                                                               |
| ----------------------- | ---------------------------------------------------------------------- |
| Add a new page          | [guides/add_feature.md](guides/add_feature.md)                         |
| Module getting messy    | [guides/scale_module.md](guides/scale_module.md)                       |
| GraphQL files too large | [guides/scale_graphql.md](guides/scale_graphql.md)                     |
| Cross-module reuse      | [reference/modules.md](reference/modules.md#cross-module-reuse-ladder) |
| Route not working       | [reference/routing.md](reference/routing.md)                           |
| Layout metadata         | [reference/layout.md](reference/layout.md)                             |
| Platform vs module code | [reference/platform.md](reference/platform.md)                         |
| Test selectors          | [reference/test-selectors.md](reference/test-selectors.md)             |
| Review checklist        | [governance/governance.md](governance/governance.md#review-checklist)  |

---

## Using This Boilerplate

### Typical Workflow

1. **Clone the repository**
2. **Build a real storefront on top of it**
3. **Make project-specific decisions in your clone**
4. **Promote changes back to boilerplate** only if they are:
   - Generally useful
   - Non-opinionated
   - Not tied to a specific product or brand

This keeps the boilerplate stable and reusable.

### When to Update Docs

**Update documentation when:**

- ✅ Changing architectural constraints
- ✅ Adding new enforced rules
- ✅ Introducing new folder patterns
- ✅ Changing module boundary rules

**Don't update documentation for:**

- ❌ Project-specific features
- ❌ One-off patterns
- ❌ Experimental code not yet validated

---

## Core Principles

### 1. Explicit Over Implicit

- Single route manifest (`app/routes.ts`)
- Explicit imports (no barrel files)
- Explicit module boundaries

### 2. Modules Own Features End-to-End

- Each module owns routes, UI, GraphQL, utilities
- Zero cross-module imports
- Modules are deletable

### 3. Start Flat, Grow Incrementally

- No premature folder structure
- Add complexity only when friction appears
- Folders have clear thresholds (e.g., 3+ routes → `routes/` folder)

### 4. Boundaries Are Enforced

- TypeScript path aliases
- ESLint rules
- CI smoke tests
- Code review

---

## Getting Help

### Common Questions

**Q: Can modules import from other modules?**  
A: No. Never. See [reference/modules.md](reference/modules.md#cross-module-reuse-ladder) for reuse strategies.

**Q: Where should this component go?**  
A: See [reference/modules.md](reference/modules.md#shared-components-vs-module-components).

**Q: How do I add a new route?**  
A: See [guides/add_feature.md](guides/add_feature.md).

**Q: My GraphQL file is too large. What now?**  
A: See [guides/scale_graphql.md](guides/scale_graphql.md).

**Q: What belongs in `app/platform/`?**  
A: See [reference/platform.md](reference/platform.md).

---

## Guiding Principle

**The structure should remain understandable as the application grows.**

When in doubt:

- Prefer explicitness over convenience
- Keep features self-contained
- Avoid introducing new global abstractions

---

## Document Map

```text
docs/
├── README.md                    ← You are here
│
├── reference/                   # Architectural rules
│   ├── modules.md              # Modules, structure, import rules
│   ├── routing.md              # Routing conventions
│   ├── layout.md               # Layout metadata and route handle contract
│   ├── graphql.md              # GraphQL organization
│   ├── platform.md             # Platform layer rules
│   └── test-selectors.md       # Test selector convention
│
├── guides/                      # Step-by-step playbooks
│   ├── add_feature.md          # Adding new features
│   ├── scale_module.md         # Refactoring modules
│   └── scale_graphql.md        # Organizing GraphQL
│
└── governance/                  # Process and enforcement
    ├── governance.md           # Constraints and review process
    ├── enforcement.md          # Tooling and automation
    └── decisions.md            # Architectural decision records
```

---

**This documentation is part of the project and should be read when making structural changes.**
