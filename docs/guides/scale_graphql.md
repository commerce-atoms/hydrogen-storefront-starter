# Scaling GraphQL Files

Step-by-step guide for organizing GraphQL queries as they grow.

**Use this guide when:**

- GraphQL files exceed 250-400 LOC
- Hard to find specific queries
- Multiple routes need different query subsets

**See Also:**

- [../reference/graphql.md](../reference/graphql.md) - GraphQL rules and caching
- [../reference/modules.md](../reference/modules.md) - Module structure

---

## The Default (Start Here)

Every module starts with **consolidated GraphQL files:**

```
app/modules/products/graphql/
├── queries.ts     # All queries
├── fragments.ts   # All fragments (only if reusable)
└── mutations.ts   # All mutations (only if exist)
```

**This is not temporary scaffolding. This is the target for most modules.**

---

## Why Start Consolidated?

1. **Navigation is faster** - One file to find all queries
2. **Less overhead** - No need to jump between files
3. **Clear ownership** - All domain queries in one place
4. **Easier to scan** - See all GraphQL documents at once
5. **No premature optimization** - Split only when painful

**Most modules will never need to split GraphQL files.**

---

## When to Split

Split **only** when you experience real friction:

| Signal                 | Threshold                            | Action             |
| ---------------------- | ------------------------------------ | ------------------ |
| File length            | `queries.ts` > 250-400 LOC           | Consider splitting |
| Scanning difficulty    | Hard to find specific queries        | Split by concern   |
| Import noise           | Many routes import different subsets | Split by usage     |
| Fragment proliferation | Unclear which fragment owns what     | Split by domain    |

### Example: When NOT to Split

```typescript
// app/modules/products/graphql/queries.ts - 150 LOC
// 3 queries, well organized
```

**Action:** Keep consolidated. Still manageable.

### Example: When to Split

```typescript
// app/modules/search/graphql/queries.ts - 450 LOC
// 8 different queries for predictive search, regular search, filters
```

**Action:** Consider splitting by search type.

---

## Splitting Strategy

### Good: Structured Folders

```
app/modules/products/graphql/
├── queries/
│   ├── detail.ts          # Product detail page
│   ├── list.ts            # Collection listings
│   └── recommendations.ts # Related products
├── mutations/
│   ├── review-create.ts
│   └── review-delete.ts
└── fragments/
    ├── base.ts            # Core fields
    ├── variant.ts         # Variant-specific
    └── media.ts           # Images/videos
```

**Benefits:**

- Clear organization by concern
- Easy to find specific query
- Natural grouping

### Bad: Verbose Root Files

```
app/modules/products/graphql/
├── product-detail.query.graphql.ts       ❌ Too verbose
├── product-list.query.graphql.ts         ❌ Clutters directory
├── product-recommendations.query.graphql.ts ❌ Hard to scan
├── create-review.mutation.graphql.ts     ❌ Unnecessary ceremony
└── product-base.fragment.graphql.ts      ❌ Pattern doesn't scale
```

**Problems:**

- Too many files at root level
- Overly verbose naming
- Hard to see groupings

---

## Migration Steps

### Step 1: Create Subfolders

```bash
cd app/modules/products/graphql
mkdir -p queries fragments mutations
```

### Step 2: Move by Concern

Split existing files by logical grouping:

```bash
# Example: Split queries.ts by page/feature
# - Detail page queries → queries/detail.ts
# - List page queries → queries/list.ts
# - Recommendation queries → queries/recommendations.ts
```

### Step 3: Update Imports

**Before:**

```typescript
import {PRODUCT_QUERY} from './graphql/queries';
```

**After:**

```typescript
import {PRODUCT_DETAIL_QUERY} from './graphql/queries/detail';
import {PRODUCT_LIST_QUERY} from './graphql/queries/list';
```

### Step 4: Optional Index File

**Only if it reduces import noise:**

```typescript
// graphql/queries/index.ts (ONLY inside graphql/ folder)
export * from './detail';
export * from './list';
export * from './recommendations';
```

**Then imports become:**

```typescript
import {PRODUCT_DETAIL_QUERY, PRODUCT_LIST_QUERY} from './graphql/queries';
```

**Important:** Barrel files (`index.ts`) are **only allowed inside `graphql/`**. Never at module or app root.

---

## Fragment Guidelines

### Extract Sparingly

**Only extract fragments if:**

1. **Reused across 2+ queries** in the same module, OR
2. **Query is huge** (> 100 LOC) and needs chunking

### Example: Good Fragment Usage

**Single file, reused fragments:**

```typescript
// fragments.ts
export const MONEY_FRAGMENT = `#graphql
  fragment Money on MoneyV2 {
    currencyCode
    amount
  }
` as const;

export const PRODUCT_CARD_FRAGMENT = `#graphql
  fragment ProductCard on Product {
    id
    title
    handle
    featuredImage {
      url
      altText
    }
    priceRange {
      minVariantPrice {
        ...Money
      }
    }
  }
  ${MONEY_FRAGMENT}
` as const;

// Used in multiple queries
export const VARIANT_FRAGMENT = `#graphql
  fragment Variant on ProductVariant {
    id
    title
    price { ...Money }
    availableForSale
  }
  ${MONEY_FRAGMENT}
` as const;
```

### Example: Over-Fragmentation (Bad)

**Don't do this:**

```typescript
// fragments/product-id.ts
export const PRODUCT_ID_FRAGMENT = `#graphql
  fragment ProductId on Product { id }
`;

// fragments/product-title.ts
export const PRODUCT_TITLE_FRAGMENT = `#graphql
  fragment ProductTitle on Product { title }
`;

// fragments/product-handle.ts
export const PRODUCT_HANDLE_FRAGMENT = `#graphql
  fragment ProductHandle on Product { handle }
`;
```

**Problems:**

- Too granular
- Makes debugging hard
- Import noise
- No real benefit

**Fix:** Combine into meaningful units like `ProductCard`, `ProductDetail`.

---

## Duplicate Small Primitives

For tiny universal fragments used across modules:

**Prefer duplication over centralization.**

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

**❌ Don't create:**

- `app/graphql/` folder
- Central fragment repository
- Cross-module GraphQL sharing

---

## Real-World Examples

### Example 1: Cart Module (Stay Consolidated)

```typescript
// app/modules/cart/graphql/fragments.ts - ~100 LOC
// 3-4 fragments, well organized
```

**Action:** Keep consolidated. No need to split.

### Example 2: Search Module (Consider Splitting)

```typescript
// app/modules/search/graphql/fragments.ts - 150 LOC
// app/modules/search/graphql/queries.ts - 200 LOC
// Total: 350 LOC
```

**Action:** Approaching threshold, but still manageable.

**If splitting:**

```
graphql/
├── queries/
│   ├── predictive.ts      # Predictive search
│   └── regular.ts         # Regular search
└── fragments/
    ├── product-result.ts
    ├── article-result.ts
    └── page-result.ts
```

### Example 3: Products Module (Stay Consolidated)

```typescript
// app/modules/products/graphql/fragments.ts - 60 LOC
// app/modules/products/graphql/queries.ts - 40 LOC
// Total: 100 LOC
```

**Action:** Perfect as-is. No split needed.

---

## File Naming Conventions

When split into subfolders, use descriptive names:

### Queries

```
queries/
├── detail.ts          ✅ Clear purpose
├── list.ts            ✅ Clear purpose
├── recommendations.ts ✅ Clear purpose
```

**Not:**

```
queries/
├── get-product.ts     ❌ Verbose
├── productList.ts     ❌ Inconsistent casing
├── RECOMMENDATIONS.ts ❌ All caps
```

### Fragments

```
fragments/
├── base.ts            ✅ Core fields
├── variant.ts         ✅ Domain entity
├── media.ts           ✅ Logical grouping
```

### Mutations

```
mutations/
├── review-create.ts   ✅ Action-based
├── review-delete.ts   ✅ Action-based
├── cart-add.ts        ✅ Action-based
```

---

## Anti-Patterns to Avoid

### ❌ Splitting Too Early

```
app/modules/blog/graphql/
├── queries/
│   └── articles.ts        # Only one query
└── fragments/
    └── article.ts         # Only one fragment
```

**Fix:** Keep in `queries.ts` and `fragments.ts` until you have multiple.

### ❌ Cross-Module GraphQL Sharing

```typescript
// ❌ BAD
import {PRODUCT_FRAGMENT} from '@modules/products/graphql/fragments';
// in cart module
```

**Fix:** Duplicate the fields or extract to platform if truly infrastructure.

### ❌ Inconsistent File Structure

```
app/modules/products/graphql/
├── queries.ts             ❌ Consolidated
└── fragments/             ❌ Split
    ├── base.ts
    └── variant.ts
```

**Fix:** Either consolidate everything or split everything.

---

## Decision Matrix

| Module State | File Count   | Total LOC | Action                   |
| ------------ | ------------ | --------- | ------------------------ |
| New module   | 0-1 queries  | < 50      | Single `queries.ts` file |
| Growing      | 2-5 queries  | 50-150    | Keep consolidated        |
| Mature       | 5-10 queries | 150-250   | Still consolidated       |
| Large        | 10+ queries  | 250-400   | Consider splitting       |
| Very large   | 15+ queries  | 400+      | Split into subfolders    |

**Default Answer:** Keep it consolidated.

**Split Answer:** Only when painful, and use structured folders.

---

## Summary

**The goal is pragmatism, not perfection.**

- ✅ Start with consolidated files (`queries.ts`, `fragments.ts`)
- ✅ Split only when friction appears (>250-400 LOC)
- ✅ Use structured folders when splitting
- ✅ Duplicate small primitives across modules
- ✅ Extract fragments sparingly
- ❌ Don't split prematurely
- ❌ Don't over-fragment
- ❌ Don't share GraphQL across modules

**Most modules will stay consolidated forever. That's a good thing.**
