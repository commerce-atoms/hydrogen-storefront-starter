# Metaobjects Architecture

This document defines how metaobjects fit into the module-driven architecture.

**Single Responsibility**: Establish the mental model for metaobjects as external structured content that must be transformed before use.

**See Also:**

- [modules.md](modules.md) - Module structure and boundaries
- [modules.md#generated-query-types-vs-domain-types](modules.md#generated-query-types-vs-domain-types) - When to use generated types vs domain types
- [graphql.md](graphql.md) - GraphQL query organization

---

## What Is a Metaobject

A metaobject is a Shopify content type that stores structured data outside the core product/cart/collection domain.

**Characteristics:**

- Defined in Shopify admin (not in code)
- Accessed via Storefront API GraphQL queries
- Returns raw GraphQL types (`Metaobject`, `MetaobjectField`)
- Contains structured fields (text, number, file, reference, etc.)

Metaobjects are **not domain models**. They are external data sources that must be transformed into domain types before use.

---

## Metaobjects in the Architecture

Metaobjects exist **outside the application's domain boundaries**.

### The Flow

```text
GraphQL Query → Raw Metaobject Data → Transformer → Domain Type → View/Component
```

**Enforced separation:**

1. **GraphQL fetches raw metaobject data** (in route loaders)
2. **Transformers inside modules** convert that data into domain types
3. **Views and components** only ever consume domain types

**Rule:** Raw metaobjects never reach views or components.

---

## Metaobjects and Modules

Modules own metaobject transformation logic.

### Ownership

**The module that uses the metaobject owns its transformation.**

```text
app/modules/works/
├── work-handle.route.tsx    # Fetches metaobject via GraphQL
├── work-handle.view.tsx     # Consumes transformed domain type
├── types/
│   └── work.ts               # Work domain type
└── transformers/
    └── work.ts               # toWork() transformer
```

### Transformation Location

Transformers live in module `transformers/` folders (or inline in route files if trivial).

**Naming Convention:**

- Transformers export functions named `toX()` where `X` is the domain type
- File names match the domain type (e.g., `work.ts` exports `toWork()`)
- Domain types live in `types/` folder, not in transformer files

**When to extract:**

- Transformation logic exceeds ~50 LOC
- Transformation is reused within the module
- Transformation has non-trivial validation or parsing

**When to inline:**

- Simple field extraction (1-3 fields)
- One-time use in a single route

### Example

```typescript
// app/modules/works/types/work.ts
export interface Work {
  title: string;
  description: string;
  image: string | null;
}
```

```typescript
// app/modules/works/transformers/work.ts
import type {Metaobject} from '@shopify/hydrogen/storefront-api-types';
import type {Work} from '../types/work';

export function toWork(metaobject: Metaobject | null): Work | null {
  if (!metaobject) return null;

  return {
    title: metaobject.field('title')?.value || '',
    description: metaobject.field('description')?.value || '',
    image: metaobject.field('image')?.value || null,
  };
}
```

```typescript
// app/modules/works/work-handle.route.tsx
import {toWork} from './transformers/work';

export async function loader({params, context}: LoaderFunctionArgs) {
  const {metaobject} = await storefront.query(QUERY, {
    variables: {handle: params.handle},
  });

  const work = toWork(metaobject);

  return {
    work, // Domain type, not raw metaobject
  };
}
```

---

## Metaobjects and GraphQL

Metaobject queries belong in module `graphql/` folders.

### Query Ownership

**The module that uses the metaobject owns its GraphQL query.**

```typescript
// app/modules/works/graphql/queries.ts
export const WORK_QUERY = `#graphql
  query Work($handle: String!) {
    metaobject(handle: {handle: $handle, type: "work"}) {
      id
      type
      fields {
        key
        value
      }
    }
  }
` as const;
```

### Fragment Organization

If a metaobject query is reused, extract to `fragments.ts`:

```typescript
// app/modules/works/graphql/fragments.ts
export const WORK_METAOBJECT = `#graphql
  fragment WorkMetaobject on Metaobject {
    id
    type
    fields {
      key
      value
    }
  }
` as const;
```

**Rule:** Metaobject fragments are module-scoped. No cross-module sharing.

---

## Transforming Metaobjects

Transformers convert raw GraphQL metaobject data into domain types.

### Transformation Rules

1. **Always transform** - Never pass raw metaobjects to views
2. **Validate and normalize** - Handle missing fields, type coercion, defaults
3. **Return null for missing** - If metaobject doesn't exist, return `null`
4. **Type safety** - Use TypeScript interfaces for domain types

### Transformation Pattern

```typescript
// ✅ GOOD: Transform to domain type using toX() naming
export function toWork(metaobject: Metaobject | null): Work | null {
  if (!metaobject) return null;

  return {
    title: metaobject.field('title')?.value || '',
    description: metaobject.field('description')?.value || '',
    image: metaobject.field('image')?.value || null,
  };
}

// ❌ BAD: Return raw metaobject
export function getWork(metaobject: Metaobject | null) {
  return metaobject; // Never do this
}
```

### Field Extraction

Use `@commerce-atoms/metafield` for field extraction:

```typescript
import {extractString} from '@commerce-atoms/metafield';
import type {Work} from '../types/work';

export function toWork(metaobject: Metaobject | null): Work | null {
  if (!metaobject) return null;

  return {
    title: extractString(metaobject, 'title') || '',
    description: extractString(metaobject, 'description') || '',
    image: extractString(metaobject, 'image') || null,
  };
}
```

---

## Role of @commerce-atoms/metafield

`@commerce-atoms/metafield` provides **pure, structural helpers** for extraction and parsing.

### What It Is

- Field extraction utilities (`extractString`, `extractNumber`, `extractFile`, etc.)
- Type-safe field access
- No knowledge of GraphQL, routes, or modules
- Pure functions with no side effects

### What It Is Not

- ❌ **Not a data layer** - Does not fetch or query
- ❌ **Not a transformer** - Does not convert to domain types
- ❌ **Not module-aware** - Does not know about modules or routes
- ❌ **Not GraphQL-aware** - Works with any metaobject structure

### Usage Pattern

```typescript
import {extractString} from '@commerce-atoms/metafield';
import type {Work} from '../types/work';

// Use in module transformers with toX() naming
export function toWork(metaobject: Metaobject | null): Work | null {
  if (!metaobject) return null;

  return {
    title: extractString(metaobject, 'title') || '',
    description: extractString(metaobject, 'description') || '',
    image: extractString(metaobject, 'image') || null,
  };
}
```

**Rule:** Use `@commerce-atoms/metafield` for field extraction, not for transformation or data access.

---

## What Not To Do

### ❌ Leak Raw Metaobjects into Views

```typescript
// ❌ BAD
export async function loader({params, context}: LoaderFunctionArgs) {
  const {metaobject} = await storefront.query(QUERY);
  return {metaobject}; // Raw metaobject
}

// ✅ GOOD
export async function loader({params, context}: LoaderFunctionArgs) {
  const {metaobject} = await storefront.query(QUERY);
  const work = toWork(metaobject);
  return {work}; // Domain type
}
```

### ❌ Misuse @commerce-atoms/metafield as Data Layer

```typescript
// ❌ BAD: Using metafield package to query
import {fetchMetaobject} from '@commerce-atoms/metafield'; // Doesn't exist

// ✅ GOOD: Use in transformers only
import {extractString} from '@commerce-atoms/metafield';
```

### ❌ Introduce Adapters or Services

```typescript
// ❌ BAD: CMS-style abstraction
class MetaobjectService {
  async getWork(handle: string) {
    // ...
  }
}

// ✅ GOOD: Direct transformation in module with toX() naming
export function toWork(metaobject: Metaobject | null) {
  // ...
}
```

### ❌ Couple Modules to Shopify/GraphQL Concepts

```typescript
// ❌ BAD: Module knows about GraphQL types
import type {Metaobject} from '@shopify/hydrogen/storefront-api-types';

export function WorkInfo({metaobject}: {metaobject: Metaobject}) {
  // ...
}

// ✅ GOOD: Module uses domain types from types/ folder
import type {Work} from './types/work';

export function WorkInfo({work}: {work: Work | null}) {
  // ...
}
```

---

## Mental Model

**Metaobjects are external structured content, not domain models.**

Think of metaobjects like:

- **API responses** - Raw data that needs parsing
- **Database rows** - Structured but not domain-typed
- **Config files** - External data sources

**The transformation boundary:**

```text
External (Shopify)          Internal (Application)
─────────────────           ─────────────────────
Metaobject          →       Domain Type
(GraphQL type)              (TypeScript interface)
```

**Flow:**

1. Route loader fetches metaobject via GraphQL
2. Transformer converts metaobject to domain type
3. View receives domain type (never raw metaobject)

**Key principle:** Views and components are decoupled from Shopify's data structures.

---

## Why This Matters

### Maintainability

- **Clear boundaries** - External data stays external
- **Type safety** - Domain types are explicit and validated
- **Testability** - Transformers are pure functions

### Flexibility

- **Shopify changes** - Only transformers need updates
- **Multiple sources** - Can swap metaobjects for other data sources
- **Module independence** - Modules don't leak Shopify concepts

### Scalability

- **No coupling** - Views don't depend on GraphQL types
- **Clear ownership** - Each module owns its transformations
- **Predictable patterns** - Same transformation pattern everywhere

**Enforcement:** This mental model prevents architectural drift and keeps the codebase maintainable as it scales.
