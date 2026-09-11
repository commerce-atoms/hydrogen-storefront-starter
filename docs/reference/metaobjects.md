# Metaobjects Architecture

This document defines how metaobjects fit into the module-driven architecture.

**Single Responsibility**: Establish the mental model for metaobjects as external structured content that must be transformed before use.

**See Also:**

- [modules.md](modules.md) - Module structure and boundaries
- [modules.md#generated-query-types-vs-domain-types](modules.md#generated-query-types-vs-domain-types) - When to use generated types vs domain types
- [graphql.md](graphql.md) - GraphQL query organization
- [setup-scripts.md](setup-scripts.md) - Provisioning schema via idempotent Admin API scripts
- [collection-theming.md](collection-theming.md) - Reference implementation of the pattern below

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

Use `@commerce-atoms/metafield` for field extraction. The package ships as
**per-file entry points** — there is no barrel export. Import the exact helper
you need.

```typescript
import {getMetaobjectString} from '@commerce-atoms/metafield/metaobjects/getMetaobjectString';
import {getMetaobjectMediaImage} from '@commerce-atoms/metafield/metaobjects/getMetaobjectMediaImage';
import type {Work} from '../types/work';

export function toWork(metaobject: Metaobject | null): Work | null {
  if (!metaobject) return null;

  return {
    title: getMetaobjectString(metaobject, 'title') ?? '',
    description: getMetaobjectString(metaobject, 'description') ?? '',
    image: getMetaobjectMediaImage(metaobject, 'image'),
  };
}
```

---

## Role of @commerce-atoms/metafield

`@commerce-atoms/metafield` provides **pure, structural helpers** for extraction and parsing.

### What It Is

- Per-file field extraction utilities exposed as subpath imports, e.g.
  `@commerce-atoms/metafield/metafields/getMetafield`,
  `@commerce-atoms/metafield/metafields/getMetafieldValue`,
  `@commerce-atoms/metafield/metaobjects/getMetaobjectString`,
  `@commerce-atoms/metafield/metaobjects/getMetaobjectStringList`,
  `@commerce-atoms/metafield/metaobjects/getMetaobjectMediaImage`,
  `@commerce-atoms/metafield/metaobjects/getMetaobjectMediaImageList`,
  `@commerce-atoms/metafield/metaobjects/getMetaobjectReferenceFromMetafield`,
  `@commerce-atoms/metafield/parse/parseMetafieldValue`.
- Type-safe field access
- No knowledge of GraphQL, routes, or modules
- Pure functions with no side effects

> There is intentionally **no root barrel** (`from '@commerce-atoms/metafield'`).
> Import the exact helper to keep tree-shaking honest.

### What It Is Not

- ❌ **Not a data layer** - Does not fetch or query
- ❌ **Not a transformer** - Does not convert to domain types
- ❌ **Not module-aware** - Does not know about modules or routes
- ❌ **Not GraphQL-aware** - Works with any metaobject structure

### Usage Pattern

```typescript
import {getMetaobjectString} from '@commerce-atoms/metafield/metaobjects/getMetaobjectString';
import {getMetaobjectMediaImage} from '@commerce-atoms/metafield/metaobjects/getMetaobjectMediaImage';
import type {Work} from '../types/work';

// Use in module transformers with toX() naming
export function toWork(metaobject: Metaobject | null): Work | null {
  if (!metaobject) return null;

  return {
    title: getMetaobjectString(metaobject, 'title') ?? '',
    description: getMetaobjectString(metaobject, 'description') ?? '',
    image: getMetaobjectMediaImage(metaobject, 'image'),
  };
}
```

**Rule:** Use `@commerce-atoms/metafield` for field extraction, not for transformation or data access.

For non-string, non-media fields (rich text, integers, dates, booleans, JSON, references, lists), pair extraction with Hydrogen's `parseMetafield` for typed value coercion — see [Using Hydrogen's `parseMetafield`](#using-hydrogens-parsemetafield).

---

## The Metafield-Backed Feature Pattern

Adding a new metafield-driven capability (per-collection theming, per-product structured data, shop-level singletons, etc.) follows one repeatable pattern. Reference implementation: [`app/platform/theming/`](../../app/platform/theming/README.md).

### Five steps

1. **Declare the schema** in `scripts/setup-<feature>.mjs` using the shared Admin API helpers.
2. **Own the GraphQL fragment** in the consuming module's `graphql/` folder. Every metafield node must select `key + value + type` (or `jsonValue`).
3. **Parse into a domain type** using `@commerce-atoms/metafield` for extraction and `parseMetafield<ParsedMetafields[T]>` from `@shopify/hydrogen` for typed value coercion.
4. **Ship a domain type** in the module's `types/` folder.
5. **Consume the domain type** in views. Raw metaobjects never leave the parser.

### Step 1 — Declare the schema

Setup scripts live in `scripts/setup-<feature>.mjs` and use the shared helpers from `scripts/shared/admin-schema.mjs`. See [setup-scripts.md](setup-scripts.md).

```javascript
import {
  requireEnv,
  createAdminClient,
  ensureMetaobjectDefinition,
  ensureMetafieldDefinition,
} from './shared/admin-schema.mjs';

const {shop, endpoint, token} = requireEnv();
const admin = createAdminClient({endpoint, token});

const defId = await ensureMetaobjectDefinition({
  admin,
  type: 'my_feature',
  name: 'My feature',
  fields: [
    {key: 'title', name: 'Title', type: 'single_line_text_field'},
    {key: 'body', name: 'Body', type: 'rich_text_field'},
  ],
});

await ensureMetafieldDefinition({
  admin,
  ownerType: 'PRODUCT',
  namespace: 'my_feature',
  key: 'config',
  name: 'My feature config',
  type: 'metaobject_reference',
  validations: [{name: 'metaobject_definition_id', value: defId}],
});
```

The helpers are idempotent and additive. Re-running is safe. New fields extend existing definitions in place; existing fields are never modified by the script (merchant admin is the source of truth for label / description edits).

### Step 2 — Own the GraphQL fragment

Fragments live in the module's `graphql/` folder. Aliased selections (`myFeature: metafield(...)`) keep response shapes predictable and decoupled from admin key naming.

```graphql
fragment MyFeatureReference on Product {
  myFeature: metafield(namespace: "my_feature", key: "config") {
    type
    value
    reference {
      ... on Metaobject {
        type
        handle
        fields {
          key
          value
          type
        }
      }
    }
  }
}
```

`type` on every metafield / metaobject-field node is not optional — `parseMetafield` (below) needs it to dispatch. Fragments that select only `value` silently break the parser. Enforce `type + value` at fragment level, not per-caller.

### Step 3 — Parse into a domain type

Two layers, each with a Shopify-standard tool:

- **Field extraction** (finding a field by key on a metaobject): use `@commerce-atoms/metafield` per-file helpers, or `metaobject.field(key)` for the raw node.
- **Value coercion** (turning a raw string / JSON into a typed value): use `parseMetafield<ParsedMetafields[T]>` from `@shopify/hydrogen`.

```typescript
import type {ParsedMetafields, Metaobject} from '@shopify/hydrogen';
import {parseMetafield} from '@shopify/hydrogen';
import {getMetaobjectString} from '@commerce-atoms/metafield/metaobjects/getMetaobjectString';
import type {MyFeature} from '../types/my-feature';

export function toMyFeature(metaobject: Metaobject | null): MyFeature | null {
  if (!metaobject) return null;

  const bodyField = metaobject.field('body');
  const body = bodyField
    ? parseMetafield<ParsedMetafields['rich_text_field']>(bodyField).parsedValue
    : null;

  return {
    title: getMetaobjectString(metaobject, 'title') ?? '',
    body,
  };
}
```

Bespoke parser instead when the field carries security implications — see the theming module for a worked example (values inlined into an SSR `<style>` block; every value passes through a CSS-injection guard before it reaches the DOM).

### Step 4 — Ship a domain type

```typescript
// app/platform/my-feature/types.ts
import type {ParsedMetafields} from '@shopify/hydrogen';

export interface MyFeature {
  title: string;
  body: ParsedMetafields['rich_text_field']['parsedValue'] | null;
}
```

Domain types may reference `ParsedMetafields[T]['parsedValue']` for standard Shopify types to stay aligned with Hydrogen's parsing output. For primitive types (strings, numbers, booleans), plain TypeScript primitives are cleaner.

### Step 5 — Consume the domain type

Views and components see the domain type only. Raw metaobjects never leave the parser.

```typescript
import type {MyFeature} from './types/my-feature';

export function MyFeatureBlock({feature}: {feature: MyFeature | null}) {
  if (!feature) return null;
  return <section>{feature.title}</section>;
}
```

---

## Using Hydrogen's `parseMetafield`

`@shopify/hydrogen` ships `parseMetafield<T>` plus a `ParsedMetafields` type map — Shopify's own coercion primitive for standard metafield types. Use it in transformers whenever a field's type appears in the table below.

### Standard Shopify types covered

| Metafield type | Parsed shape (`ParsedMetafields[T]['parsedValue']`) |
|---|---|
| `single_line_text_field` / `multi_line_text_field` | `string` |
| `integer` / `number_decimal` | `number` |
| `boolean` | `boolean` |
| `date` / `date_time` | `Date` |
| `color` | color object |
| `dimension` / `weight` | measured-value object |
| `rating` | rating object |
| `rich_text_field` | Rich Text AST |
| `json` | parsed JSON |
| `*_reference` (product, collection, variant, file, page, metaobject) | reference node |
| `list.*` | array of the above |

### When to skip `parseMetafield`

- **Security-sensitive interpolation** — values injected into `<style>`, `<script>`, `dangerouslySetInnerHTML`, URLs, or shell contexts. Wrap coercion with a domain-specific guard. Example: `parseCollectionTheme`.
- **Domain-shape validation** — enums backed by `single_line_text_field`, integers in a specific range, etc. Coerce with `parseMetafield`, then guard.
- **Types outside the `ParsedMetafields` map** — fall back to `parseMetafieldValue` from `@commerce-atoms/metafield/parse/parseMetafieldValue`.

### Fragment shape requirement

`parseMetafield` reads `type + value` on every node. Fragment selections must include both (or `jsonValue` for JSON-ish types). Do not omit `type` — the parser silently returns the raw shape when it cannot dispatch, which shows up as runtime type errors far from the source.

---

## What Shopify ships vs What this starter adds

Being explicit about the boundary avoids reinventing Shopify's primitives and stops the starter drifting into a private mini-framework.

| Concern | Shopify ships | This starter adds |
|---|---|---|
| **Schema declaration** | `metafieldDefinitionCreate` / `metaobjectDefinitionCreate` (Admin API GraphQL). Docs recommend the admin UI for one-off setup. | Idempotent, version-controlled `scripts/setup-*.mjs` wrappers via `scripts/shared/admin-schema.mjs` — schema lives in code, reproducible across environments. |
| **Value coercion** | `parseMetafield<ParsedMetafields[T]>` in `@shopify/hydrogen`. | Nothing — use Shopify's directly. |
| **Metaobject field lookup** | Nothing purpose-built. | `@commerce-atoms/metafield` per-file helpers (`getMetaobjectString`, `getMetaobjectMediaImage`, `getMetaobjectReferenceFromMetafield`, `getMetaobjectStringList`, `getMetaobjectMediaImageList`, `parseMetafieldValue`). |
| **Module placement** | No opinion. | `platform/*` for cross-cutting features, module-owned for feature-specific data. Enforced by the architecture validator. |
| **Type boundary** | No opinion. | Enforced transformer boundary — views consume domain types, never raw metaobjects. |
| **Fragment shape** | No opinion. | Requires `key + value + type` selection on metafield nodes so `parseMetafield` can work. |
| **App-owned schema (`shopify.app.toml`)** | For Shopify Apps only. | N/A. A Hydrogen storefront is not a Shopify App — there is no `shopify.app.toml` to write into. |

### Why not `shopify.app.toml`

`shopify.app.toml` declares metafield / metaobject definitions **for Shopify Apps**. Those definitions are app-owned, prefixed `$app:`, and auto-installed by `shopify app deploy`. A Hydrogen storefront is not a Shopify App: it has no `shopify.app.toml`, does not deploy via the App CLI, and its metafields are merchant-owned. The Admin API definition mutations are the canonical path for merchant-owned schema, and the setup scripts wrap them.

---

## Compatibility with Shopify Hydrogen cookbook recipes

The [Shopify Hydrogen cookbook](https://shopify.dev/docs/storefronts/headless/hydrogen/cookbook) ships recipes that touch metaobjects — most notably **Dynamic Content with Metaobjects**. That recipe is complementary to this starter, not in conflict, but there are two adaptation points to be aware of when porting a recipe in.

### File placement

Recipes are written against the default Hydrogen skeleton (`app/components/`, `app/sections/`, `app/utils/`, `app/routes/` — flat). This starter enforces `app/modules/<module>/` and `app/platform/<module>/`. When adopting a recipe:

| Recipe location | This starter's location |
|---|---|
| `app/utils/parseSection.ts` | `app/platform/metaobjects/parseSection.ts` |
| `app/sections/Section*.tsx` | `app/modules/sections/` (or per-page modules) |
| Inline GraphQL fragments in component files | Module `graphql/fragments.ts` |
| `app/components/EditRoute.tsx` | `app/platform/metaobjects/EditRoute.tsx` |

Move files, do not rewrite them. The recipe code itself is fine.

### Parsing location: cookbook `parseSection` vs the transformer boundary

The **Dynamic Content with Metaobjects** recipe parses metafields **inside the section component** via `parseSection<Fragment, Overrides>(props)`. That is legitimate for **section-based CMS content** — many parallel shapes rendered by a dispatch component, each section a self-contained view over one metaobject. Do not fight it. Adopt the recipe's pattern as-is for section systems:

```typescript
// app/modules/sections/SectionHero.tsx
import type {ParsedMetafields} from '@shopify/hydrogen';
import {parseSection} from '~/platform/metaobjects/parseSection';
import type {SectionHeroFragment} from 'storefrontapi.generated';

export function SectionHero(props: SectionHeroFragment) {
  const section = parseSection<
    SectionHeroFragment,
    {heading?: ParsedMetafields['single_line_text_field']}
  >(props);
  return <h1>{section.heading?.parsedValue}</h1>;
}
```

For **domain data on core entities** (Product, Collection, Cart, Customer), keep the transformer boundary described above:

- Loader calls `toX(rawMetaobject)`.
- Component receives the domain type; never the raw fragment.

The distinction: section CMS content is a one-off view shell over one shape; domain data crosses modules and needs a stable typed contract. Two patterns, two use cases.

### What the cookbook does not provide (and this starter adds)

- **Idempotent, code-driven schema provisioning.** Recipes assume manual admin UI setup. Our `scripts/setup-*.mjs` provision the same definitions from code — see [setup-scripts.md](setup-scripts.md).
- **Module boundaries.** Recipes are flat; this starter enforces vertical slices.
- **Domain-type discipline for core entities.** Recipes optimise for section-render loops; this starter's transformer boundary protects long-lived domain data from Shopify schema drift.

These additions do not require a recipe to change. They pick up whatever pattern the recipe brings.

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
import {fetchMetaobject} from '@commerce-atoms/metafield/metafields/fetchMetaobject'; // Doesn't exist

// ✅ GOOD: Use in transformers only, import from a per-file entry
import {getMetaobjectString} from '@commerce-atoms/metafield/metaobjects/getMetaobjectString';
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
