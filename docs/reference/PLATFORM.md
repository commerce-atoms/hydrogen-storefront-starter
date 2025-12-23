# Platform Layer

## What Belongs in `app/platform/*`

Platform is **infrastructure glue only**. It handles request/response boundaries, runtime setup, and environment wiring.

### ✅ Allowed in Platform

Only things **inherently tied** to:

- **Shopify/Hydrogen runtime**
  - Storefront client setup
  - Customer account API wiring
  - Hydrogen context creation

- **Request/Response boundaries**
  - Cookies and sessions
  - Headers manipulation
  - Caching strategies
  - Network boundary helpers

- **i18n routing**
  - Locale detection from URL/headers
  - Locale path prefix handling

- **Redirects & canonicalization**
  - SEO canonical redirects
  - Localized handle redirects

- **Environment config wiring**
  - Env variable access patterns
  - Runtime configuration

- **GraphQL client setup only**
  - NO GraphQL documents (queries/fragments)
  - Documents live in modules/layout that use them

### ❌ NOT Allowed in Platform

- **Generic helpers** → Move to `app/utils/*` or `@shoppy/*`
  - String formatting
  - Object shaping
  - Date/number formatting

- **Domain logic** → Move to modules
  - Product mappers (GraphQL → UI model)
  - Cart calculations
  - Customer data shaping

- **Business rules** → Move to modules or `@shoppy/*`
  - Variant selection logic
  - Pricing rules
  - Availability checks

- **"Build a URL" helpers** → Depends
  - If needs locale/env/request → platform
  - If pure string building → module utils

## Current Platform Structure

```
app/platform/
├── i18n/
│   ├── i18n.ts              ✅ Locale detection from request
│   ├── urls.ts              ✅ Locale-aware URL building
│   └── redirects.ts         ✅ Localized handle redirects
├── routing/
│   ├── catchall.route.tsx   ✅ 404 catch-all route
│   ├── locale.route.tsx     ✅ Locale validation layout
│   ├── robots.route.tsx     ✅ robots.txt endpoint
│   ├── robots.queries.ts    ✅ Robots GraphQL query
│   ├── sitemap-index.route.tsx ✅ Sitemap index
│   ├── sitemap.route.tsx    ✅ Individual sitemap pages
│   └── graphql-api.route.tsx ✅ GraphQL API proxy (dev-only)
├── session/
│   └── session.ts           ✅ Cookie session management
└── shopify/
    └── context.ts           ✅ Hydrogen context + client setup
```

### File-by-File Justification

#### ✅ `shopify/context.ts`

**Why platform:** Creates Hydrogen context, wires Storefront client, manages sessions, injects env. Touches Request, Response, env, and runtime setup.

#### ✅ `session/session.ts`

**Why platform:** Cookie-based session storage. Touches Request headers and Response Set-Cookie.

#### ✅ `i18n/i18n.ts`

**Why platform:** Detects locale from URL pathname. Needs Request to parse URL.

#### ✅ `i18n/redirects.ts`

**Why platform:** Handles localized handle redirects for SEO. Needs Request URL and throws Response redirects. Grouped with i18n concerns (locale-based routing).

#### ✅ `i18n/urls.ts`

**Why platform:** Builds locale-aware URLs (products, collections, etc.). Needs pathname to detect locale pattern `/(\/[a-zA-Z]{2}-[a-zA-Z]{2}\/)/`.

#### ✅ `routing/*.route.tsx`

**Why platform:** Infrastructure endpoints that handle routing concerns, not domain logic:

- `catchall.route.tsx` - 404 handler (infrastructure)
- `locale.route.tsx` - Locale validation layout (infrastructure)
- `robots.route.tsx` - robots.txt endpoint (SEO infrastructure)
- `sitemap-index.route.tsx` / `sitemap.route.tsx` - Sitemap endpoints (SEO infrastructure)
- `graphql-api.route.tsx` - Dev-only GraphQL proxy (infrastructure)

**GraphQL queries:** Queries used only by a route live beside that route (e.g., `robots.queries.ts`). No shared `platform/graphql/` folder.

## Routing Ownership Rules

**Platform owns infrastructure endpoints and router-adjacent routes:**

- ✅ Locale validation route (`locale.route.tsx`)
- ✅ Catchall 404 route (`catchall.route.tsx`)
- ✅ robots.txt endpoint (`robots.route.tsx`)
- ✅ Sitemap endpoints (`sitemap-index.route.tsx`, `sitemap.route.tsx`)
- ✅ Internal/dev-only GraphQL proxy route (`graphql-api.route.tsx` - guarded and documented)

**Layout owns UI shell only:**

- ✅ Header, Footer, Aside components
- ✅ PageLayout component
- ✅ Layout GraphQL queries (header, footer menus)

**Modules own user-facing page routes + domain logic:**

- ✅ Product pages, collection pages, cart, search, etc.
- ✅ Domain-specific GraphQL queries
- ✅ Module-specific components and hooks

**GraphQL query co-location:**

- Queries used only by a route live beside that route (e.g., `robots.queries.ts`, `sitemap.queries.ts`)
- No shared `platform/graphql/` folder
- No barrel exports, explicit imports only

## Rules for Adding to Platform

### The Test

Ask these questions:

1. **Does it touch Request, Response, headers, cookies, or env?**
   - Yes → Likely platform
   - No → Likely NOT platform

2. **Is it runtime/client setup?**
   - Yes → Platform
   - No → NOT platform

3. **Is it domain-specific?**
   - Yes → Module or `@shoppy/*`
   - No → Continue...

4. **Is it reusable pure logic?**
   - Yes → `@shoppy/*` or `app/utils/*`
   - No → Continue...

5. **Is it a tiny app-local helper?**
   - Yes → `app/utils/*`
   - No → Reconsider the abstraction

### Examples

**❌ BAD: Generic helper in platform**

```typescript
// app/platform/utils/formatPrice.ts
export function formatPrice(amount: number) {
  return `$${amount.toFixed(2)}`;
}
```

**Fix:** Move to `app/utils/formatPrice.ts` or inline it.

**❌ BAD: Domain logic in platform**

```typescript
// app/platform/shopify/product-mapper.ts
export function mapProductToCard(product: Product) {
  return {
    /* ... */
  };
}
```

**Fix:** Move to `modules/products/utils/mappers.ts`.

**✅ GOOD: Session/Cookie helper**

```typescript
// app/platform/session/session.ts
export class AppSession implements HydrogenSession {
  static async init(request: Request, secrets: string[]) {
    // Touches Request headers for cookies
    const storage = createCookieSessionStorage({...});
    const session = await storage.getSession(
      request.headers.get('Cookie')
    );
    return new this(storage, session);
  }
}
```

## Platform Import Rules

### Platform CAN import:

- ✅ Other platform files
- ✅ `@shoppy/*` (pure utilities)
- ✅ Framework/vendor libs

### Platform CANNOT import:

- ❌ `app/modules/*` (enforced by tests)
- ❌ `app/components/*` (no UI in platform)
- ❌ `app/layout/*` (no UI in platform)

### Exception: Dependency Injection

If platform needs module-specific data (like cart fragments), use dependency injection:

```typescript
// ✅ GOOD: Platform accepts fragment as parameter
export async function createHydrogenRouterContext(
  request: Request,
  env: Env,
  executionContext: ExecutionContext,
  cartQueryFragment: string, // Injected from outside
) {
  // ...
}

// server.ts (entry point)
import {CART_API_QUERY_FRAGMENT} from './app/modules/cart/graphql/fragments';

const context = await createHydrogenRouterContext(
  request,
  env,
  executionContext,
  CART_API_QUERY_FRAGMENT,
);
```

## Summary

**Platform = Boundary + Wiring**

If it doesn't touch the request/response boundary or runtime setup, it doesn't belong in platform.

Keep platform thin. Most logic belongs in modules or `@shoppy/*`.
