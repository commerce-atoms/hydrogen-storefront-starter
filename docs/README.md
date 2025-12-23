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

| Document                                     | Purpose                                        |
| -------------------------------------------- | ---------------------------------------------- |
| [**MODULES.md**](reference/MODULES.md)       | Module structure, scaling, and import rules    |
| [**ROUTING.md**](reference/ROUTING.md)       | Explicit routing conventions and URL patterns  |
| [**GRAPHQL.md**](reference/GRAPHQL.md)       | GraphQL organization, caching, and type safety |
| [**PLATFORM.md**](reference/PLATFORM.md)     | Platform layer rules and what belongs there    |
| [**SHOPPY.md**](reference/SHOPPY.md)         | Local workspace packages documentation         |
| [**TEST_SELECTORS.md**](reference/TEST_SELECTORS.md) | Test selector convention and E2E testing patterns |

### 🔧 Guides (How To Build)

Step-by-step playbooks for common development tasks.

| Guide                                           | When to Use                             |
| ----------------------------------------------- | --------------------------------------- |
| [**ADD_FEATURE.md**](guides/ADD_FEATURE.md)     | Adding a new page or feature            |
| [**SCALE_MODULE.md**](guides/SCALE_MODULE.md)   | Refactoring a module as it grows        |
| [**SCALE_GRAPHQL.md**](guides/SCALE_GRAPHQL.md) | Organizing GraphQL files that get large |

### 🔒 Governance (Process & Enforcement)

Rules about rules and how they're enforced.

| Document                                        | Purpose                                         |
| ----------------------------------------------- | ----------------------------------------------- |
| [**GOVERNANCE.md**](governance/GOVERNANCE.md)   | Non-negotiable constraints and review checklist |
| [**ENFORCEMENT.md**](governance/ENFORCEMENT.md) | Tooling, linting, and automated enforcement     |
| [**DECISIONS.md**](governance/DECISIONS.md)     | Architectural decision records (ADRs)           |

---

## Quick Start

### For New Contributors

**Recommended reading order:**

1. **This file** - Overview and structure
2. [reference/MODULES.md](reference/MODULES.md) - Modules, structure, and import rules
3. [reference/ROUTING.md](reference/ROUTING.md) - How routes work
4. [governance/GOVERNANCE.md](governance/GOVERNANCE.md) - Constraints and review process
5. [guides/ADD_FEATURE.md](guides/ADD_FEATURE.md) - Add your first feature

**You don't need to read everything up front.** Use these documents as reference when making structural decisions.

### For Quick Reference

| Need                    | Document                                                               |
| ----------------------- | ---------------------------------------------------------------------- |
| Add a new page          | [guides/ADD_FEATURE.md](guides/ADD_FEATURE.md)                         |
| Module getting messy    | [guides/SCALE_MODULE.md](guides/SCALE_MODULE.md)                       |
| GraphQL files too large | [guides/SCALE_GRAPHQL.md](guides/SCALE_GRAPHQL.md)                     |
| Cross-module reuse      | [reference/MODULES.md](reference/MODULES.md#cross-module-reuse-ladder) |
| Route not working       | [reference/ROUTING.md](reference/ROUTING.md)                           |
| Platform vs module code | [reference/PLATFORM.md](reference/PLATFORM.md)                         |
| Test selectors          | [reference/TEST_SELECTORS.md](reference/TEST_SELECTORS.md)             |
| Review checklist        | [governance/GOVERNANCE.md](governance/GOVERNANCE.md#review-checklist)  |

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
A: No. Never. See [reference/MODULES.md](reference/MODULES.md#cross-module-reuse-ladder) for reuse strategies.

**Q: Where should this component go?**  
A: See [reference/MODULES.md](reference/MODULES.md#shared-components-vs-module-components).

**Q: How do I add a new route?**  
A: See [guides/ADD_FEATURE.md](guides/ADD_FEATURE.md).

**Q: My GraphQL file is too large. What now?**  
A: See [guides/SCALE_GRAPHQL.md](guides/SCALE_GRAPHQL.md).

**Q: What belongs in `app/platform/`?**  
A: See [reference/PLATFORM.md](reference/PLATFORM.md).

---

## Guiding Principle

**The structure should remain understandable as the application grows.**

When in doubt:

- Prefer explicitness over convenience
- Keep features self-contained
- Avoid introducing new global abstractions

---

## Document Map

```
docs/
├── README.md                    ← You are here
│
├── reference/                   # Architectural rules
│   ├── MODULES.md              # Modules, structure, import rules
│   ├── ROUTING.md              # Routing conventions
│   ├── GRAPHQL.md              # GraphQL organization
│   ├── PLATFORM.md             # Platform layer rules
│   ├── SHOPPY.md               # Workspace packages
│   └── TEST_SELECTORS.md       # Test selector convention
│
├── guides/                      # Step-by-step playbooks
│   ├── ADD_FEATURE.md          # Adding new features
│   ├── SCALE_MODULE.md         # Refactoring modules
│   └── SCALE_GRAPHQL.md        # Organizing GraphQL
│
└── governance/                  # Process and enforcement
    ├── GOVERNANCE.md           # Constraints and review process
    ├── ENFORCEMENT.md          # Tooling and automation
    └── DECISIONS.md            # Architectural decision records
```

---

**This documentation is part of the project and should be read when making structural changes.**
