# GraphQL Organization & Caching

This document defines how GraphQL queries are organized and cached.

**Single Responsibility**: Module-owned queries, caching strategies, and type safety.

**See Also:**

- [modules.md](modules.md) - When to add graphql/ folder
- [../guides/scale_graphql.md](../guides/scale_graphql.md) - How to split large GraphQL files

---

## Module-Owned Queries

Each module **owns its GraphQL queries, fragments, and mutations.**

### Ownership Rule

**GraphQL files are scoped to modules.** No cross-module GraphQL sharing.

```
app/modules/products/graphql/     ✅ Products module owns these
app/modules/cart/graphql/          ✅ Cart module owns these
app/modules/collections/graphql/   ✅ Collections module owns these
```

**Forbidden:**

```typescript
// ❌ NEVER do this
import {PRODUCT_FRAGMENT} from '@modules/products/graphql/fragments';
// in cart module
```

**Why?** Cross-module GraphQL imports create hidden coupling.

---

## File Structure (Default)

### Start Consolidated

Every module starts with **consolidated GraphQL files:**

```
app/modules/products/graphql/
├── queries.ts        # ALL query documents
├── fragments.ts      # ALL reusable fragments (only if needed)
└── mutations.ts      # ALL mutations (only if needed)
```

**This is not temporary scaffolding. This is the target for most modules.**

### Rules

1. **Only create `fragments.ts` if you have reusable fragments**
2. **Only create `mutations.ts` if your module has mutations**
3. **Start with `queries.ts` only**

### When to Split

Split **only** when you experience real friction:

| Signal              | Threshold                            | Action             |
| ------------------- | ------------------------------------ | ------------------ |
| File length         | `queries.ts` > 250-400 LOC           | Consider splitting |
| Scanning difficulty | Hard to find specific queries        | Split by concern   |
| Import noise        | Many routes import different subsets | Split by usage     |

**See:** [../guides/scale_graphql.md](../guides/scale_graphql.md) for step-by-step splitting guide.

---

## Naming Conventions

### Fragments

**Pattern:** `{TypeName}Fragment` or `{Purpose}Fragment`

```typescript
export const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    handle
  }
` as const;

export const PRODUCT_CARD_FRAGMENT = `#graphql
  fragment ProductCard on Product {
    id
    title
    featuredImage { url altText }
  }
` as const;
```

### Queries

**Pattern:** `{OperationName}Query`

```typescript
export const PRODUCT_QUERY = `#graphql
  query Product($handle: String!) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;
```

### Mutations

**Pattern:** `{OperationName}Mutation`

```typescript
export const CART_LINES_ADD_MUTATION = `#graphql
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ...CartApiQuery }
    }
  }
  ${CART_API_QUERY_FRAGMENT}
` as const;
```

---

## Fragment Organization

### Extract Sparingly

**Only extract fragments if:**

1. **Reused across 2+ queries** in the same module, OR
2. **Query is huge** (> 100 LOC) and needs chunking

**Don't extract for:**

- Single-use field groups
- "Organization" or "cleanliness"
- Premature DRY optimization

### Example: Good Fragment Usage

```typescript
// fragments.ts
export const MONEY_FRAGMENT = `#graphql
  fragment Money on MoneyV2 {
    currencyCode
    amount
  }
` as const;

export const CART_LINE_FRAGMENT = `#graphql
  fragment CartLine on CartLine {
    id
    quantity
    merchandise {
      ... on ProductVariant {
        id
        title
        price { ...Money }
      }
    }
  }
  ${MONEY_FRAGMENT}
` as const;

// Used in multiple queries
export const CART_API_QUERY_FRAGMENT = `#graphql
  fragment CartApiQuery on Cart {
    id
    lines(first: 100) {
      nodes { ...CartLine }
    }
  }
  ${CART_LINE_FRAGMENT}
` as const;
```

### Duplicate Small Primitives

For tiny universal fragments like `Money`, `Image`:

**Prefer duplication** over centralization.

```typescript
// ✅ GOOD - Duplicate in each module
// app/modules/cart/graphql/fragments.ts
const MONEY_FRAGMENT = `#graphql
  fragment Money on MoneyV2 {
    currencyCode
    amount
  }
`;

// app/modules/products/graphql/fragments.ts
const MONEY_FRAGMENT = `#graphql
  fragment Money on MoneyV2 {
    currencyCode
    amount
  }
`;
```

**Why?**

- Avoids central coupling
- Modules stay independently evolvable
- 5-10 lines is acceptable duplication

**❌ Don't create `app/graphql/` or centralized GraphQL folders.**

---

## Caching Policy

### Cache by Data Volatility

Match cache duration to how often data changes:

| Data Type           | Cache Strategy | Duration | Reasoning                     |
| ------------------- | -------------- | -------- | ----------------------------- |
| Product catalog     | `CacheLong()`  | 1+ hours | Products change infrequently  |
| Collection listings | `CacheShort()` | 5-15 min | May change with merchandising |
| Individual product  | `CacheShort()` | 5-15 min | Variants/pricing may change   |
| Cart data           | `CacheNone()`  | No cache | User-specific, real-time      |
| Customer data       | `CacheNone()`  | No cache | Private, real-time            |
| Search results      | `CacheNone()`  | No cache | Dynamic, personalized         |
| Policies            | `CacheLong()`  | 1+ hours | Static content                |
| Blog posts          | `CacheLong()`  | 1+ hours | Content rarely changes        |

### Cache Duration Guidelines

```typescript
// CacheLong - 1+ hours
storefront.CacheLong(); // Static content

// CacheShort - 5-15 minutes
storefront.CacheShort(); // Dynamic but stable

// CacheNone - No cache
storefront.CacheNone(); // Real-time data
```

### Implementation Example

```typescript
// Products - CacheShort (may change)
export async function loader({params, context}: LoaderFunctionArgs) {
  const {product} = await context.storefront.query(PRODUCT_QUERY, {
    variables: {handle: params.handle},
    cache: context.storefront.CacheShort(),
  });
  return {product};
}

// Cart - CacheNone (real-time)
export async function loader({context}: LoaderFunctionArgs) {
  const {cart} = await context.storefront.query(CART_QUERY, {
    variables: {cartId: session.get('cartId')},
    cache: context.storefront.CacheNone(),
  });
  return {cart};
}

// Policies - CacheLong (static)
export async function loader({params, context}: LoaderFunctionArgs) {
  const {policy} = await context.storefront.query(POLICY_QUERY, {
    variables: {handle: params.handle},
    cache: context.storefront.CacheLong(),
  });
  return {policy};
}
```

---

## Avoiding Cache Invalidation Issues

### Don't Mix Cache Levels

Mixing cached and uncached data in one query contaminates the entire query cache.

**❌ Bad:**

```typescript
const MIXED_QUERY = `#graphql
  query ProductWithCart($productHandle: String!, $cartId: ID) {
    product(handle: $productHandle) {
      # Cached data (CacheShort)
      id
      title
    }
    cart(id: $cartId) {
      # Uncached data (CacheNone) - contaminates whole query!
      id
      totalQuantity
    }
  }
`;
```

**✅ Good:**

```typescript
// Separate queries for different cache needs
const PRODUCT_QUERY = `#graphql
  query Product($handle: String!) {
    product(handle: $handle) { id title }
  }
`;

const CART_QUERY = `#graphql
  query Cart($cartId: ID!) {
    cart(id: $cartId) { id totalQuantity }
  }
`;

// In loader - two separate queries
const [{product}, {cart}] = await Promise.all([
  storefront.query(PRODUCT_QUERY, {
    variables: {handle},
    cache: storefront.CacheShort(),
  }),
  storefront.query(CART_QUERY, {
    variables: {cartId},
    cache: storefront.CacheNone(),
  }),
]);
```

### Cache Key Considerations

Cache varies by:

- Query variables (handle, ID, etc.)
- Country/market
- Language
- Currency

**Example:**

```typescript
// Cached separately for each handle + locale
storefront.query(PRODUCT_QUERY, {
  variables: {handle: 'snowboard'},
  cache: storefront.CacheShort(),
});
```

---

## Error Handling

### GraphQL Errors vs Network Errors

**GraphQL errors** - Data validation or business logic issues

```typescript
const {data, errors} = await storefront.query(PRODUCT_QUERY, {
  variables: {handle: 'invalid-handle'},
});

if (errors) {
  // GraphQL returned errors (e.g., product not found)
  console.error('GraphQL errors:', errors);
  throw new Response('Product not found', {status: 404});
}
```

**Network errors** - Connectivity or infrastructure issues

```typescript
try {
  const {product} = await storefront.query(PRODUCT_QUERY, {
    variables: {handle},
  });
  return {product};
} catch (error) {
  // Network/storefront errors
  console.error('Failed to fetch product:', error);
  throw new Response('Service unavailable', {status: 503});
}
```

### Error Handling Pattern

```typescript
export async function loader({params, context}: LoaderFunctionArgs) {
  const {handle} = params;
  const {storefront} = context;

  try {
    const {data, errors} = await storefront.query(PRODUCT_QUERY, {
      variables: {handle},
    });

    // Handle GraphQL errors
    if (errors) {
      console.error('GraphQL errors:', errors);
      throw new Response('Not Found', {status: 404});
    }

    // Handle missing data
    if (!data?.product) {
      throw new Response('Product not found', {status: 404});
    }

    return {product: data.product};
  } catch (error) {
    // Handle network errors
    if (error instanceof Response) throw error;
    console.error('Storefront error:', error);
    throw new Response('Service unavailable', {status: 503});
  }
}
```

---

## Type Safety

### Use Generated Types

Generated types come from `storefrontapi.generated.d.ts`.

```typescript
import type {ProductQuery} from 'storefrontapi.generated';

export async function loader({params, context}: LoaderFunctionArgs) {
  const {product} = await context.storefront.query<ProductQuery>(
    PRODUCT_QUERY,
    {variables: {handle: params.handle}},
  );

  return {product};
}
```

### Typed Loader Data

```typescript
import {useLoaderData} from 'react-router';
import type {loader} from './product-handle.route';

export function ProductView() {
  const {product} = useLoaderData<typeof loader>();

  // product is fully typed
  return <h1>{product.title}</h1>;
}
```

### Avoid `any` Types

**❌ Bad:**

```typescript
const product = data as any; // Type unsafe
```

**✅ Good:**

```typescript
import type {ProductQuery} from 'storefrontapi.generated';

const product: ProductQuery['product'] = data.product;
```

---

## Performance Optimization

### Query Optimization Checklist

1. ✅ **Only fetch what's needed** - Use fragments strategically
2. ✅ **Avoid over-fetching** - Don't include unused fields
3. ✅ **Use connections** - For paginated data (products, articles)
4. ✅ **Batch requests** - Use `Promise.all()` for parallel queries
5. ✅ **Cache appropriately** - Match cache to data volatility

### Example: Parallel Queries

```typescript
export async function loader({context}: LoaderFunctionArgs) {
  const {storefront} = context;

  // Fetch multiple resources in parallel
  const [{featuredProducts}, {featuredCollections}] = await Promise.all([
    storefront.query(FEATURED_PRODUCTS_QUERY, {
      cache: storefront.CacheShort(),
    }),
    storefront.query(FEATURED_COLLECTIONS_QUERY, {
      cache: storefront.CacheShort(),
    }),
  ]);

  return {featuredProducts, featuredCollections};
}
```

---

## Testing GraphQL

### Mock Data Strategy

Use real GraphQL response shapes for testing:

```typescript
// test-utils/mocks.ts
import type {ProductQuery} from 'storefrontapi.generated';

export const mockProduct: ProductQuery['product'] = {
  id: 'gid://shopify/Product/1',
  title: 'Test Product',
  handle: 'test-product',
  featuredImage: {
    url: 'https://cdn.shopify.com/test.jpg',
    altText: 'Test product',
  },
  priceRange: {
    minVariantPrice: {
      amount: '99.99',
      currencyCode: 'USD',
    },
  },
};
```

### Test at Storefront Boundary

```typescript
// Mock the storefront.query method
const mockStorefront = {
  query: vi.fn().mockResolvedValue({
    product: mockProduct,
  }),
};
```

---

## Summary

**Module ownership** - Each module manages its GraphQL
**Cache strategically** - Match duration to data volatility
**Avoid coupling** - Don't mix cache levels or cross-module imports
**Type safety** - Use generated types, avoid `any`
**Error handling** - Distinguish GraphQL errors from network errors
**Performance** - Fetch only what's needed, batch requests
