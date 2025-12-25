# Module Structure & Scaling

This document defines how feature modules are structured and how they evolve over time.

**Single Responsibility**: Define what a module is, how it starts, and when to introduce complexity.

**See Also:**

- [../governance/governance.md](../governance/governance.md) - Non-negotiable constraints and review process
- [../guides/scale_module.md](../guides/scale_module.md) - Step-by-step scaling guide

---

## What is a Module

**A module is a vertical domain slice owning routes, UI, data, and logic.**

It represents a **single domain boundary** in the application.

**Examples:**

- `products` - Product detail pages and product logic
- `collections` - Collection pages and filtering
- `cart` - Cart functionality
- `account` - Customer account area
- `search` - Search functionality
- `policies` - Policy pages
- `blogs` - Blog and article pages
- `pages` - CMS pages
- `home` - Homepage

**Note:** Infrastructure routes (robots.txt, sitemap, catchall, locale validation) belong in `app/platform/routing/`, not in modules.

### Module Ownership

A module owns **all logic related to its domain:**

- Route handlers (loaders, actions, metadata)
- UI components (views and module-specific components)
- Styles (CSS modules)
- Data access (GraphQL queries, fragments, mutations)
- Feature-specific helpers (utilities, hooks)

### Module Discovery

**There is no central registry of modules.**

Modules are discovered through:

1. The route manifest (`app/routes.ts`)
2. The filesystem (`app/modules/` directory)

---

## Default Module Structure (Start Flat)

**Every module starts flat.** No subfolders are created until they are needed.

### Minimal Example

```
modules/products/
├── product-handle.route.tsx
└── product-handle.view.tsx
```

### Why Start Flat?

- **Easy to scan** - All files visible at once
- **Avoids premature organization** - Don't organize what doesn't exist yet
- **Keeps early features lightweight** - Less ceremony
- **Friction-driven growth** - Add structure only when it reduces pain

**Rule:** Don't create folders for symmetry with other modules.

---

## Route and View Responsibilities

### Route Files (`*.route.tsx`)

**Responsibilities:**

- Loaders and actions
- Redirects and error handling
- Data fetching and validation
- Shaping data for the view
- Exporting metadata used by layout (page header, breadcrumbs, SEO)
- Cache strategy decisions

**Example:**

```typescript
// product-handle.route.tsx
export async function loader({params, context}: LoaderFunctionArgs) {
  const {handle} = params;
  const {storefront} = context;

  const product = await storefront.query(PRODUCT_QUERY, {
    variables: {handle},
    cache: storefront.CacheShort(),
  });

  if (!product) {
    throw new Response('Not found', {status: 404});
  }

  return {product};
}

export const handle = {
  breadcrumb: (data) => data.product.title,
};

export default function ProductRoute() {
  return <ProductView />;
}
```

**Must NOT:**

- Render large UI trees
- Contain complex presentation logic
- Import UI from other modules

### View Files (`*.view.tsx`)

**Responsibilities:**

- Rendering UI
- Composing module components
- Client-side interactions

**Example:**

```typescript
// product-handle.view.tsx
export function ProductView() {
  const {product} = useLoaderData<typeof loader>();

  return (
    <div>
      <ProductImage image={product.featuredImage} />
      <ProductForm product={product} />
    </div>
  );
}
```

**Must NOT:**

- Fetch data
- Call the Storefront API directly
- Manage sessions or cookies
- Import platform-level infrastructure

**Why separate?** This separation keeps responsibilities explicit and makes code easier to test and refactor.

---

## Introducing Subfolders

Subfolders are introduced **only when they reduce friction.**

### When to Add `routes/` Folder

Add when:

- Module has **more than 3 routes**, OR
- Module has **nested routes**, OR
- Scanning route files becomes difficult

**Before:**

```
modules/account/
├── account-index.route.tsx
├── account-login.route.tsx
├── account-profile.route.tsx
├── account-orders.route.tsx
└── account-addresses.route.tsx
```

**After:**

```
modules/account/
├── routes/
│   ├── index.route.tsx
│   ├── login.route.tsx
│   ├── profile.route.tsx
│   ├── orders.route.tsx
│   └── addresses.route.tsx
├── components/
└── graphql/
```

### When to Add `components/` Folder

Add when:

- Module has **more than 3 module-specific components**, OR
- Components are **reused across multiple routes** in the module, OR
- Route views become noisy with UI detail

**Characteristics:**

- Components may know about the module's domain
- Components may accept domain-specific props
- Components may use module-specific styles
- Components must not fetch data directly
- Components must not import other modules

**Example:**

```
modules/products/
├── product-handle.route.tsx
├── product-handle.view.tsx
├── product-handle.view.module.css
└── components/
    ├── AddToCartButton.tsx
    ├── ProductForm.tsx
    ├── product-form.module.css
    ├── ProductImage.tsx
    └── product-image.module.css
```

**Don't promote to `app/components/` unless truly domain-agnostic.**

---

## Module Import Rules

### What Modules CAN Import

- ✅ Local module files (same module subtree)
- ✅ `app/components/*` - Shared UI primitives
- ✅ `app/layout/components/*` - App shell (Header, Footer, etc.)
- ✅ `app/platform/*` - Infrastructure
- ✅ `app/hooks/*` - Generic UI hooks only
- ✅ `app/utils/*` - Tiny generic utilities only
- ✅ `@shoppy/*` - Pure logic packages

### What Modules CANNOT Import

- ❌ `app/modules/<other>/*` - **Any other module**
- ❌ Other module's GraphQL, components, or utilities

**This is non-negotiable. Zero cross-module imports.**

### Cross-Module Reuse Ladder

When you need to share code between modules, follow this order:

1. **Duplicate intentionally** (< 50 lines, unstable)
2. **Promote to `app/components/`** (shared UI, 2+ modules OR used in layout)
3. **Promote to `app/hooks/` or `app/utils/`** (generic, domain-agnostic only)
4. **Extract to `@shoppy/*`** (pure business logic, reusable across storefronts)
5. **Create platform utility** (infrastructure helpers)

**Never import directly from another module.**

### When to Add `graphql/` Folder

Add when:

- More than **one query or mutation** is required, OR
- **Fragments are shared** across routes in the module

**Default structure (consolidated):**

```
modules/products/
└── graphql/
    ├── queries.ts      # All queries
    ├── fragments.ts    # All reusable fragments
    └── mutations.ts    # All mutations (only if needed)
```

**Rules:**

- GraphQL files are scoped to module's domain
- Must not be imported by other modules
- Start consolidated, split only when > 250-400 LOC

**See:** [graphql.md](graphql.md) for detailed GraphQL organization rules.

### When to Add `hooks/` Folder

Add when:

- Module has **domain-specific React hooks**, OR
- Hooks are **reused across routes** in the module

**Examples:**

```
modules/products/hooks/
├── useDefaultVariant.ts
├── useSelectedOptions.ts
├── useVariantUrl.ts
└── useVariantUrlSync.ts
```

**Important:** These are **domain-specific** hooks that stay in the module.

Generic hooks like `useDebounce` belong in `app/hooks/`.

### When to Add `utils/` Folder

Add when:

- Helpers exceed roughly **200 lines total**, OR
- Helpers are **reused across multiple files** in the module

**Characteristics:**

- May contain domain logic
- May import shared components or external utilities
- Must not import other modules

**Example:**

```
modules/search/utils/
└── search.ts    # Search-specific helpers
```

**Don't add utils for generic helpers** - those belong in `app/utils/` or `@shoppy/*`.

---

## CSS Colocation

CSS modules are **colocated directly** with their components/views.

### Correct Structure

```
components/
├── Button.tsx
├── button.module.css           ✓ colocated
├── ProductCard.tsx
└── product-card.module.css     ✓ colocated

modules/products/
├── product-handle.view.tsx
├── product-handle.view.module.css     ✓ colocated
└── components/
    ├── ProductForm.tsx
    └── product-form.module.css        ✓ colocated
```

### Rules

- **NO `styles/` subfolders** - Keep flat
- CSS file must be in **same directory** as component/view
- **Naming:** PascalCase component → kebab-case CSS
  - `Button.tsx` → `button.module.css`
  - `ProductCard.tsx` → `product-card.module.css`

### Global Styles

Global styles live in `app/styles/`:

- `tokens.css` - Design tokens (CSS variables)
- `reset.css` - Element resets
- `base.css` - Base styles

---

## Shared Components vs Module Components

### Shared Components (`app/components/`)

**Purpose:** Primitive UI building blocks

**Characteristics:**

- Domain-agnostic and reusable
- Must not contain business logic
- Can be used across any module

**Examples:**

- Button, Input, Loading, Price
- ProductCard (if used in 3+ modules)

### Layout Components (`app/layout/components/`)

**Purpose:** Application shell

**Characteristics:**

- Provide global chrome (header, footer, navigation)
- Shared across entire application
- May use routing and global state

**Examples:**

- Header, Footer, Aside

### Module Components

**Purpose:** Domain-specific UI

**Characteristics:**

- Owned by their module
- May assume specific data shapes for their domain
- Not shared between modules

**Rule of thumb:**
If a component mentions a domain concept (product, cart, order), it belongs in a module.

---

## Module Growth Strategy

Modules are expected to evolve over time.

### Recommended Growth Pattern

1. **Start flat** - Route + view files
2. **Add components/** when UI complexity grows
3. **Add graphql/** when data access grows
4. **Add routes/** only when routing complexity requires it
5. **Add hooks/** when domain-specific React hooks appear
6. **Add utils/** when helpers are reused or exceed 200 LOC

**Avoid reorganizing purely for symmetry or aesthetics.**

### Module Maturity Levels

Modules evolve based on complexity:

| Maturity     | Characteristics              | When to Introduce Folders            |
| ------------ | ---------------------------- | ------------------------------------ |
| **Minimal**  | 1 route, flat structure      | None - keep flat                     |
| **Simple**   | 2-3 routes, flat structure   | Consider `graphql/` if queries exist |
| **Moderate** | 3-5 routes, some complexity  | Add `components/` if UI is reused    |
| **Complex**  | 5+ routes, rich domain logic | Add `hooks/`, `utils/` as needed     |

**Examples from this boilerplate:**

- Minimal: home, pages
- Simple: blogs, policies, cart (after promotion)
- Moderate: search, collections
- Complex: products (has hooks for variant selection)

**Growth should follow friction, not convention.**

---

## Deleting or Refactoring Modules

Modules should be **deletable without affecting unrelated features.**

### To Achieve Deletability

- Keep imports explicit
- Avoid cross-module references
- Avoid global singletons tied to a module

**If deleting a module requires widespread changes, the boundary is too weak.**

### Safe Deletion Checklist

1. Remove routes from `app/routes.ts`
2. Delete module folder
3. Run TypeScript check - should only fail in expected places
4. No runtime errors outside module's domain

---

## Module Naming Conventions

### Module Folder Names

Use lowercase, hyphenated names:

- `products/` ✅
- `cart/` ✅
- `customer-account/` ✅
- `Products/` ❌
- `customerAccount/` ❌

### Route File Naming

Pattern: `{resource}-{action}.route.tsx`

**Examples:**

- `product-handle.route.tsx` - Individual product page
- `products-index.route.tsx` - Products listing
- `cart.route.tsx` - Cart page
- `account-login.route.tsx` - Login page
- `collection-handle.route.tsx` - Collection page

### View File Naming

Pattern: `{resource}-{action}.view.tsx`

**Examples:**

- `product-handle.view.tsx`
- `cart.view.tsx`
- `account-login.view.tsx`

**Important:** View filename should match route filename.

---

## Summary

**Modules are the primary unit of ownership.**

They:

- Start flat
- Grow incrementally
- Remain isolated by default

These rules exist to support:

- **Scalability** - Modules can grow independently
- **Refactor safety** - Changes are localized
- **Developer comprehension** - Clear ownership
- **Clean boundaries** - Modules are deletable
