# Hydrogen Storefront Starter

> A structured, production-ready foundation for building scalable Shopify Hydrogen storefronts with React Router.  
> Powered by @shoppy utilities, but zero vendor lock-in.

<!-- [![CI](https://github.com/doctor-undefined/hydrogen-storefront-base/actions/workflows/ci.yml/badge.svg)](https://github.com/doctor-undefined/hydrogen-storefront-base/actions/workflows/ci.yml) -->

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](tsconfig.json)

---

## 🎯 **What This Provides**

A foundation for **large, long-lived Shopify storefronts** with:

- ⚡ **Vertical domain slices** — Modules own routes, UI, data, and logic end-to-end
- 🛡️ **Automated boundary enforcement** — ESLint + tests block coupling before it happens
- 📐 **Explicit routing** — Single manifest shows all routes at a glance
- 📚 **Documented scaling patterns** — Clear thresholds for when to add folders
- 🧪 **Principle-based tests** — Won't break when you customize
- 🎓 **Architecture documentation** — 5,000+ lines explaining why, not just what
- 🔧 **CI/CD ready** — Full pipeline with automated checks

**Best for:** Team projects, long-term codebases, scalable architectures  
**Not for:** Quick prototypes or simple stores (lighter alternatives exist)

---

## 🏗️ **Architecture Highlights**

### Vertical Domain Slices (Modules)

Each module owns **routes → UI → data → logic** with zero coupling:

```
app/modules/products/
├── product-handle.route.tsx    # Loader + data fetching
├── product-handle.view.tsx     # UI rendering
├── components/                  # Product-specific UI
├── graphql/                     # Product queries
└── hooks/                       # Variant selection logic
```

**Zero cross-module imports.** Enforced by ESLint + smoke tests.

### Explicit Routing

Single route manifest (`app/routes.ts`) — no filesystem magic:

```typescript
export default hydrogenRoutes([
  route('products/:handle', 'modules/products/product-handle.route.tsx'),
  route('cart', 'modules/cart/cart.route.tsx'),
  // ... all routes visible in one place
]);
```

### Automated Guardrails

- **ESLint rules** — Block cross-module imports, dumping grounds, platform→module violations
- **Smoke tests** — Protect architectural principles
- **TypeScript strict mode** — Full type safety
- **CI pipeline** — Automated enforcement on every push

---

## 🚀 **Quick Start**

### Prerequisites

- Node.js 18+ ([use nvm](https://github.com/nvm-sh/nvm))
- Shopify store (or [Partner account](https://partners.shopify.com))

### Installation

```bash
# Clone this repository
git clone https://github.com/doctor-undefined/hydrogen-storefront-base.git my-storefront
cd my-storefront

# Install dependencies
npm install

# Set up environment variables
cp .env .env.local  # Or create .env with your Shopify credentials

# Start development
npm run dev
```

Visit `http://localhost:3000` 🎉

> **💡 First time?** Read [`docs/README.md`](docs/README.md) for architecture overview

---

## 📁 **Project Structure**

```
app/
├── routes.ts          # Single route manifest (explicit, not filesystem-based)
├── modules/           # Feature domains — vertical slices owning routes, UI, data, logic
├── components/        # Shared UI — domain-agnostic primitives + global components
├── layout/            # Application shell — header, footer, navigation
├── platform/          # Infrastructure — sessions, i18n, routing (robots, sitemap, catchall)
└── styles/            # Global design tokens

@shoppy/               # Workspace packages — pure logic (variants, urlstate)
docs/                  # Architecture documentation — reference, guides, governance
```

**See [`docs/reference/modules.md`](docs/reference/modules.md) for detailed structure rules.**

---

## ✨ **Key Features**

### 🔒 **Enforced Boundaries**

```bash
npm run ci  # ✅ Lint + TypeCheck + Architectural Tests

# ESLint rules block violations:
- No cross-module imports
- No dumping ground folders (app/lib, app/common, etc.)
- Platform cannot import modules
- Layout cannot import modules
- Test selector convention

# Smoke test suites validate:
- Architectural principles (not specific features)
- Tests won't break when you customize
```

### 📦 **Start Flat, Grow Incrementally**

Modules start minimal:

```
modules/reviews/
├── reviews-index.route.tsx
└── reviews-index.view.tsx
```

Add folders **only when friction appears** (documented thresholds):

- `components/` when UI is reused (2-3+ components)
- `graphql/` when queries needed
- `hooks/` for domain-specific React hooks
- `utils/` when helpers exceed ~200 LOC

### 🎨 **Workspace Packages (`@shoppy/*`)**

Pure logic extracted for reuse:

- **`@shoppy/variants`** — Variant selection, availability, URL sync
- **`@shoppy/urlstate`** — Schema-driven filter/pagination state

**Local development:** npm workspaces for fast iteration

---

## 🧪 **Testing Strategy**

**Smoke tests** protect architecture, **unit tests** validate platform utilities:

```bash
npm test

# Smoke tests (architectural principles)
✓ No dumping ground folders
✓ CSS colocated, no barrel files
✓ Single route manifest
✓ Explicit routing functions
✓ Test selector convention

# Unit tests (platform i18n utilities)
✓ Locale detection (7 tests)
✓ URL building (11 tests)
✓ Redirect logic (6 tests)

7 test suites • 34 tests • ~200ms
```

**Philosophy:**

- Smoke tests won't break when you add/remove features
- Unit tests validate pure infrastructure logic
- No component tests (consumers customize UI)
- No integration tests (project-specific)

See [`docs/reference/test_selectors.md`](docs/reference/test_selectors.md) for test selector conventions.

---

## 🛠️ **Scripts**

```bash
npm run dev          # Dev server + codegen (hot reload)
npm run build        # Production build
npm run preview      # Preview production build

npm run lint         # ESLint (quality + boundaries)
npm run typecheck    # TypeScript strict mode
npm test             # All tests (smoke + unit)
npm run test:smoke   # Architectural smoke tests only
npm run ci           # Full pipeline (lint + typecheck + all tests)
```

---

## 🗺️ **Path Aliases**

Enforce boundaries and reduce import noise:

```typescript
import {Button} from '@components/Button'; // Shared UI
import {ProductForm} from './components/ProductForm'; // Module-local
import {buildProductUrl} from '@platform/i18n/urls'; // Infrastructure
```

**Configured aliases:**

- `@layout/*` → Application shell
- `@modules/*` → Feature modules
- `@components/*` → Shared UI
- `@platform/*` → Infrastructure
- `@styles/*` → Global tokens
- `~/*` → App root (escape hatch)

---

## 📖 **Documentation**

Comprehensive architecture guidance organized into:

- **`docs/reference/`** — Rules (modules, routing, GraphQL, platform)
- **`docs/guides/`** — How-to playbooks (add features, scale modules)
- **`docs/governance/`** — Process (review, enforcement, decisions)

**Start here:** [`docs/README.md`](docs/README.md)

**Quick links:**

- 🆕 [Adding a new feature](docs/guides/add_feature.md)
- 📈 [Scaling a module](docs/guides/scale_module.md)
- 🔍 [Cross-module reuse](docs/reference/modules.md#cross-module-reuse-ladder)
- ✅ [Review checklist](docs/governance/governance.md#review-checklist)

---

## 🤖 **AI Assistance**

This repository includes AI agent rules (Cursor, Copilot) synced from [commerce-atoms/agents](https://github.com/commerce-atoms/agents).

**For AI tools to work optimally:**

- Rules are in `.cursor/rules/` and `.github/copilot-instructions.md`
- Do not edit synced files (they have headers indicating this)
- To customize, create additional files (e.g., `.cursor/rules/99-local-overrides.mdc`)

**To update rules from upstream:**

```bash
node agents-sync.mjs
```

---

## 📦 **What's Included**

- ✅ **8 feature modules** — Products, cart, collections, search, blogs, pages, policies, home
- ✅ **Infrastructure routes** — robots.txt, sitemap, catchall, locale validation (in `app/platform/routing/`)
- ✅ **Shared components** — Primitives + domain components + global UI (cart/search)
- ✅ **2 workspace packages** — `@shoppy/variants`, `@shoppy/urlstate`
- ✅ **Architectural docs** — 12 organized files (~5,000 lines)
- ✅ **CI/CD pipeline** — Automated lint, typecheck, smoke tests
- ✅ **Boundary enforcement** — ESLint rules + architectural tests

---

## 🎓 **Learn More**

### Shopify Hydrogen

- [Official Documentation](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/hydrogen)
- [Storefront API Reference](https://shopify.dev/docs/api/storefront)

### React Router

- [React Router Docs](https://reactrouter.com/)
- [Route Configuration](https://reactrouter.com/how-to/route-config)

### Architecture

- [`docs/reference/modules.md`](docs/reference/modules.md) — Module structure
- [`docs/reference/routing.md`](docs/reference/routing.md) — Routing patterns
- [`docs/governance/governance.md`](docs/governance/governance.md) — Constraints

---

## 🤝 **Contributing**

We welcome contributions! See [`CONTRIBUTING.md`](CONTRIBUTING.md) for:

- Contribution guidelines
- PR process and review checklist
- Architectural constraints
- Development workflow

**Before contributing:**

1. Read [`docs/reference/modules.md`](docs/reference/modules.md)
2. Review [`docs/governance/governance.md`](docs/governance/governance.md)
3. Run `npm run ci` before submitting

---

## 🚢 **Deployment**

Built for [Shopify Oxygen](https://shopify.dev/docs/custom-storefronts/oxygen):

```bash
npm run build    # Creates dist/ for Oxygen

# Deploy to Oxygen
shopify hydrogen deploy
```

Compatible with other Node.js platforms (Vercel, Netlify, etc.) with minor adjustments.

---

## 📝 **License**

[MIT](LICENSE) — Free to use, modify, and distribute.

---

## 🙏 **Acknowledgments**

Built on:

- [Shopify Hydrogen](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/hydrogen) — React framework for Shopify
- [React Router](https://reactrouter.com/) — Modern routing
- [Vite](https://vitejs.dev/) — Fast build tooling
- [TypeScript](https://www.typescriptlang.org/) — Type safety

Inspired by domain-driven design and scalable software architecture principles.

---

## 💬 **Community & Support**

- 📖 **Docs:** [`docs/README.md`](docs/README.md)
- 🐛 **Issues:** [GitHub Issues](https://github.com/doctor-undefined/hydrogen-storefront-base/issues)
- 💡 **Discussions:** [GitHub Discussions](https://github.com/doctor-undefined/hydrogen-storefront-base/discussions)
- 📝 **Contributing:** [CONTRIBUTING.md](CONTRIBUTING.md)

---

<div align="center">

**[Documentation](docs/README.md)** • **[Contributing](CONTRIBUTING.md)** • **[Changelog](CHANGELOG.md)**

Made with ⚡ for scalable Shopify storefronts

</div>
