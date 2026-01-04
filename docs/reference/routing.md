# Routing

This document defines how routing works and the constraints that apply to route definitions.

**Single Responsibility**: Explicit route configuration and URL conventions.

**See Also:**

- [modules.md](modules.md) - Module structure and route file responsibilities
- [../guides/add_feature.md](../guides/add_feature.md) - How to add new routes

---

## Routing Model

Routing is **explicit and centralized** to support large, long-lived e-commerce applications.

### Core Principles

- **Single route manifest** - All routes in `app/routes.ts`
- **No filesystem-based route discovery** - Routes are not derived from folder structure
- **No automatic route generation** - Every route is explicitly mapped
- **Configuration-based** - Routes are wired declaratively

**Why?** Routing is treated as infrastructure, not feature logic.

---

## Route Manifest

All routes are declared in **one file:**

**`app/routes.ts`**

This file is the **single source of truth** for:

- URL patterns
- Layout nesting
- Module ownership

**There must never be multiple route manifests.**

### Example Structure

```typescript
import {
  type RouteConfig,
  route,
  layout,
  index,
  prefix,
} from '@react-router/dev/routes';
import {hydrogenRoutes} from '@shopify/hydrogen';

export default hydrogenRoutes([
  // Resource routes (outside layout)
  route('robots.txt', 'platform/routing/robots.route.tsx'),
  route('sitemap.xml', 'platform/routing/sitemap-index.route.tsx'),

  // Locale-prefixed routes
  ...prefix(':locale?', [
    layout('platform/routing/locale.route.tsx', [
      // UI routes (inside layout)
      index('modules/home/home.route.tsx'),
      route('products/:handle', 'modules/products/product-handle.route.tsx'),
      route(
        'collections/:handle',
        'modules/collections/collection-handle.route.tsx',
      ),
      route('cart', 'modules/cart/cart.route.tsx'),
      route('search', 'modules/search/search.route.tsx'),

      // Catch-all (404)
      route('*', 'platform/routing/catchall.route.tsx'),
    ]),
  ]),
]) satisfies RouteConfig;
```

---

## Route Entries

Each route entry maps:

- A **URL path pattern**
- To a **route module file**
- Optionally **nested under a layout route**

### Route Module Exports

A route module file exports:

- `loader` - Data fetching function
- `action` - Form submission handler (optional)
- `headers` - HTTP headers (optional)
- `meta` - SEO metadata (optional)
- `handle` - Layout metadata (optional)
- Default export - View component

**Example:**

```typescript
// product-handle.route.tsx
import type {LoaderFunctionArgs} from 'react-router';

export async function loader({params, context}: LoaderFunctionArgs) {
  const {product} = await context.storefront.query(PRODUCT_QUERY, {
    variables: {handle: params.handle},
  });

  if (!product) {
    throw new Response('Not Found', {status: 404});
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

---

## Layout Routing

The application shell is implemented as a **layout route**.

### Characteristics

- Layout route has **no URL of its own**
- All user-facing pages are **nested under it**
- Layout renders **global chrome** (header, footer, navigation)
- Layout metadata is **derived from child routes**

**Layout file:** `app/platform/routing/locale.route.tsx`

### Layout vs Resource Routes

**UI Routes** (inside layout):

- Home, products, collections, cart, search, etc.
- Render application shell
- Use layout metadata

**Resource Routes** (outside layout):

- `robots.txt`, `sitemap.xml`, API endpoints
- Do not render application shell
- Return raw data or text

---

## URL Conventions

The boilerplate follows **standard commerce URL patterns.**

### Recommended Patterns

| Route             | URL Pattern                         | Purpose                             |
| ----------------- | ----------------------------------- | ----------------------------------- |
| Home              | `/`                                 | Homepage                            |
| Product Detail    | `/products/:handle`                 | Individual product                  |
| Collection        | `/collections/:handle`              | Collection page                     |
| Collections Index | `/collections`                      | All collections                     |
| Cart              | `/cart`                             | Shopping cart                       |
| Search            | `/search`                           | Search results                      |
| Policies          | `/policies/:handle`                 | Policy pages (privacy, terms, etc.) |
| Pages             | `/pages/:handle`                    | CMS pages                           |
| Blogs             | `/blogs`                            | Blog index                          |
| Blog              | `/blogs/:blogHandle`                | Individual blog                     |
| Article           | `/blogs/:blogHandle/:articleHandle` | Individual article                  |

### Locale-Prefixed Routes (Optional)

For multi-language storefronts:

- `/en-us/products/:handle`
- `/fr-ca/products/:handle`
- `/de-de/products/:handle`

**Locale pattern:** `/:locale?` where locale is optional (e.g., `en-us`, `fr-ca`)

---

## Route File Naming

Route filenames inside modules are **explicit and descriptive.**

### Naming Conventions

**Pattern:** `{resource}-{action}.route.tsx`

| Pattern                           | Example                       | Purpose                    |
| --------------------------------- | ----------------------------- | -------------------------- |
| `{resource}-handle.route.tsx`     | `product-handle.route.tsx`    | Dynamic handle-based route |
| `{resource}-index.route.tsx`      | `collections-index.route.tsx` | List/index page            |
| `{resource}.route.tsx`            | `cart.route.tsx`              | Single resource page       |
| `{resource}-{modifier}.route.tsx` | `collections-all.route.tsx`   | Variation                  |

### Route Parameters

Use **descriptive parameter names** in URLs:

| Parameter | Use Case                   | Example                       |
| --------- | -------------------------- | ----------------------------- |
| `:handle` | SEO-friendly identifiers   | Products, collections, blogs  |
| `:id`     | Internal identifiers       | When handles aren't available |
| `:slug`   | Human-readable identifiers | Custom pages                  |

**Important:** Filenames do not need to mirror URL structure. The route manifest maps URLs to files.

---

## Nested Routing

Nested routes are allowed but should be introduced **deliberately.**

### Guidelines

- Avoid deep nesting unless it reflects a real domain hierarchy
- Prefer **shallow, explicit routes** for commerce pages
- Nested routing is most appropriate for **account and settings areas**

### Example: Account Routes

```typescript
layout('account', 'modules/account/account.route.tsx', [
  index('modules/account/routes/index.route.tsx'),
  route('profile', 'modules/account/routes/profile.route.tsx'),
  route('orders', 'modules/account/routes/orders.route.tsx'),
  route('orders/:id', 'modules/account/routes/order-detail.route.tsx'),
  route('addresses', 'modules/account/routes/addresses.route.tsx'),
]),
```

When nested routing is used:

- Group related route modules inside a **module-specific `routes/` folder**
- Keep nesting **consistent within the module**

---

## Infrastructure Routes

Infrastructure routes are routes that **do not render UI** and handle routing/infrastructure concerns.

### Examples

- `robots.txt` - Search engine directives
- `sitemap.xml` - Sitemap index
- `sitemap/:type/:page.xml` - Individual sitemaps
- `api/:version/graphql.json` - GraphQL API endpoint (dev-only)
- `*` (catchall) - 404 handler
- `:locale?` (layout) - Locale validation

### Infrastructure Route Policy

**Placement:** `app/platform/routing/`

**Files:**

- `catchall.route.tsx` - 404 catch-all handler
- `locale.route.tsx` - Locale validation layout
- `robots.route.tsx` - robots.txt endpoint
- `robots.queries.ts` - Robots GraphQL query (co-located)
- `sitemap-index.route.tsx` - Sitemap index
- `sitemap.route.tsx` - Individual sitemap pages
- `graphql-api.route.tsx` - GraphQL API proxy (dev-only, guarded)

**Rules:**

- Infrastructure routes live **outside the layout route** (except locale validation which is a layout)
- Do not render the application shell (except locale validation)
- Defined explicitly in the route manifest
- Should not throw errors that render UI - use HTTP status codes
- Should be minimal and focused on data delivery
- GraphQL queries used only by a route live beside that route (no shared `platform/graphql/` folder)

---

## Error Handling Routes

Error handling follows **standard React Router patterns.**

### Guidelines

- **404 handling** should be centralized and consistent
- Module-level errors should not leak into unrelated modules
- The layout should handle global error presentation when appropriate

### Catch-All Route

```typescript
route('*', 'platform/routing/catchall.route.tsx'),
```

Placed at the end of route list to catch unmatched URLs.

**Avoid creating feature-specific global error routes.**

---

## Locale and Internationalization

Locale-based routing is **intentionally not enforced by default.**

### Reasons

- Locale strategies vary significantly between stores
- Premature locale abstraction complicates routing

### If Locale Routing is Introduced

- Must be handled **explicitly in the route manifest**
- Must not rely on filesystem naming conventions
- Locale concerns must remain **orthogonal to module ownership**

**Example:**

```typescript
...prefix(':locale?', [
  layout('platform/routing/locale.route.tsx', [
    // Routes here are locale-aware
  ]),
]),
```

---

## Route Manifest Constraints

The following constraints are **non-negotiable:**

1. ✅ **One route manifest only** - No multiple routing files
2. ✅ **No filesystem-based route discovery** - Explicit mapping only
3. ✅ **No dynamic route generation** - No runtime route registration
4. ✅ **No route builder utilities** - Keep routing simple
5. ✅ **No cross-module route imports** - Routes reference modules, not vice versa

**If any constraint is violated, routing clarity degrades quickly.**

---

## Route Metadata (Layout Integration)

Routes can export **metadata** for the layout to consume.

### Handle Export

```typescript
export const handle = {
  breadcrumb: (data) => data.product.title,
  pageHeader: (data) => ({
    title: data.product.title,
    subtitle: data.product.vendor,
  }),
};
```

**Layout responsibility:** Interpret handle metadata and render chrome.

**Route responsibility:** Provide metadata, not render chrome.

---

## Routing Ownership

**Final ownership model:**

- `app/routes.ts` - Single route manifest (infrastructure)
- `app/platform/routing/*` - Infrastructure endpoints (robots, sitemap, catchall, locale validation, GraphQL proxy)
- `app/layout/*` - UI shell only (Header, Footer, PageLayout components)
- `app/modules/*` - User-facing page routes + domain logic

**Rules:**

- Platform owns routing infrastructure endpoints
- Layout owns UI shell only (must not own resource endpoints)
- Modules own user-facing page routes + domain logic
- GraphQL queries used only by a route live beside that route
- No barrel exports, explicit imports only

## Summary

Routing in this boilerplate is **explicit, centralized, and boring by design.**

This approach:

- ✅ Improves auditability - All routes visible in one file
- ✅ Simplifies refactoring - Change URL without moving files
- ✅ Scales to large route counts - No filesystem magic
- ✅ Aligns with modern React Router - Configuration-based routing

**The route manifest is infrastructure.** Treat it with care.
