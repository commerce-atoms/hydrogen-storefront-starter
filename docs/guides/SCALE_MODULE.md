# Scaling Modules

Step-by-step guide for refactoring and evolving modules as they grow.

**Use this guide when:**

- A module gains multiple routes
- Files become hard to scan
- Responsibilities start to blur
- Refactors are needed to maintain clarity

**See Also:**

- [../reference/MODULES.md](../reference/MODULES.md) - Module structure and import rules
- [../governance/GOVERNANCE.md](../governance/GOVERNANCE.md) - Review checklist

---

## When to Scale a Module

Scaling is driven by **friction**, not symmetry.

### Signals That Refactoring is Needed

- ⚠️ Route files exceed roughly 3 files
- ⚠️ Route files are difficult to scan quickly
- ⚠️ View files grow large and noisy (>300 LOC)
- ⚠️ Logic is repeated across multiple files
- ⚠️ GraphQL queries and fragments multiply
- ⚠️ Helpers exceed 200 LOC total

**Do not restructure a module purely for aesthetics or consistency with other modules.**

---

## Introducing a `routes/` Folder

### When to Add

- Module has **more than 3 routes**, OR
- **Nested routing** is required, OR
- Route files dominate the module root

### Refactor Pattern

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

### Migration Steps

1. **Create `routes/` folder:**

   ```bash
   mkdir -p app/modules/account/routes
   ```

2. **Move route files:**

   ```bash
   mv app/modules/account/account-*.route.tsx app/modules/account/routes/
   ```

3. **Rename files (optional but cleaner):**

   ```bash
   # account-index.route.tsx → index.route.tsx
   # account-login.route.tsx → login.route.tsx
   ```

4. **Update route manifest:**

   ```typescript
   // app/routes.ts - Update paths
   route('account', 'modules/account/routes/index.route.tsx'),
   route('account/login', 'modules/account/routes/login.route.tsx'),
   ```

5. **Update view imports:**
   ```typescript
   // If views are in different location, update imports
   import {AccountIndexView} from '../account-index.view';
   ```

### Guidelines

- Route filenames should remain **explicit and descriptive**
- URL patterns should remain **stable** unless strong reason to change
- Update the **central route manifest explicitly**

---

## Extracting Module Components

### When to Add `components/` Folder

- UI is **reused across multiple routes**, OR
- Route view files **exceed reasonable size** (>300 LOC), OR
- UI complexity **obscures the intent** of the route

### Component Characteristics

**Module components MAY:**

- ✅ Know about the module's domain
- ✅ Assume module-specific data shapes
- ✅ Use module-specific styles

**Module components MUST NOT:**

- ❌ Fetch data directly
- ❌ Import other modules

### Example Extraction

**Before (Large View):**

```typescript
// product-handle.view.tsx (500 LOC - too large)
export function ProductView() {
  const {product} = useLoaderData<typeof loader>();

  return (
    <div>
      {/* 100 LOC of product image logic */}
      {/* 200 LOC of variant selection form */}
      {/* 100 LOC of add to cart button */}
      {/* 100 LOC of product details */}
    </div>
  );
}
```

**After (Extracted Components):**

```
modules/products/
├── product-handle.route.tsx
├── product-handle.view.tsx (50 LOC - cleaner)
└── components/
    ├── ProductImage.tsx
    ├── product-image.module.css
    ├── ProductForm.tsx
    ├── product-form.module.css
    ├── AddToCartButton.tsx
    └── ProductDetails.tsx
```

```typescript
// product-handle.view.tsx (now readable)
import {ProductImage} from './components/ProductImage';
import {ProductForm} from './components/ProductForm';
import {ProductDetails} from './components/ProductDetails';

export function ProductView() {
  const {product} = useLoaderData<typeof loader>();

  return (
    <div>
      <ProductImage image={product.featuredImage} />
      <ProductForm product={product} />
      <ProductDetails product={product} />
    </div>
  );
}
```

### Don't Promote Prematurely

**Avoid moving to `app/components/` unless:**

- Component is **truly domain-agnostic**
- Used in **2+ different modules**
- Has **no module-specific assumptions**

---

## Organizing GraphQL Access

### When to Expand `graphql/` Folder

- More than **one query or mutation** exists, OR
- **Fragments are shared** across routes, OR
- Queries become **large or complex** (>250 LOC total)

### Structure Rules

**Start consolidated:**

```
modules/products/graphql/
├── queries.ts        # All queries
├── fragments.ts      # All fragments
└── mutations.ts      # All mutations (if needed)
```

**Split when large:**

```
modules/products/graphql/
├── queries/
│   ├── detail.ts
│   ├── list.ts
│   └── recommendations.ts
├── fragments/
│   ├── base.ts
│   ├── variant.ts
│   └── media.ts
└── mutations/
    └── review.ts
```

**See:** [SCALE_GRAPHQL.md](SCALE_GRAPHQL.md) for detailed GraphQL scaling guide.

---

## Introducing Module Utilities

### When to Add `utils/` Folder

- Non-UI logic is **reused across multiple files**, OR
- Helpers **exceed roughly 200 lines total**, OR
- Responsibilities are **clearly not presentation-related**

### Rules

**Utilities MAY:**

- ✅ Contain domain logic
- ✅ Import shared components or external utilities

**Utilities MUST NOT:**

- ❌ Import other modules
- ❌ Mutate global state
- ❌ Become internal mini-libraries (>500 LOC)

### Example

```
modules/search/utils/
└── search.ts    # Search-specific formatting, parsing, etc.
```

```typescript
// utils/search.ts
export function parseSearchQuery(query: string) {
  // Domain-specific search parsing logic
  return {
    terms: query.split(' '),
    filters: extractFilters(query),
  };
}
```

**Avoid turning module utils into libraries.**

If utilities grow beyond 500 LOC, consider:

- Extracting to `@shoppy/*` package
- Breaking into more granular modules

---

## Handling Cross-Module Reuse Pressure

When you feel pressure to import from another module, **STOP and evaluate.**

### Options (in order of preference)

1. **Duplicate intentionally**
   - For small, unstable pieces (< 50 LOC)
   - Wait until it stabilizes before abstracting

2. **Promote to `app/components/`**
   - For domain-agnostic UI components
   - Used by 2+ modules

3. **Promote to `app/hooks/` or `app/utils/`**
   - For truly generic, cross-domain utilities
   - Not domain-specific

4. **Extract to `@shoppy/*` package**
   - For reusable business logic
   - Pure functions, no React hooks
   - Can be used across different storefronts

5. **Create platform utility**
   - For infrastructure helpers
   - Needs Request/Response/env access

**Do NOT import module internals directly.**

Cross-module imports are a strong signal of boundary erosion.

---

## Refactoring Safely

### Best Practices

1. **Refactor structure before behavior**
   - Move files first, change logic later
   - Easier to review and debug

2. **Keep route URLs stable**
   - Don't change user-facing URLs during refactoring
   - Update route manifest carefully

3. **Update the route manifest explicitly**
   - Don't rely on auto-discovery
   - Verify all routes still work

4. **Verify no new cross-module imports**
   - Run TypeScript check
   - Review import statements

5. **Test critical paths**
   - Navigate through refactored routes
   - Verify data still loads correctly

### Refactoring Checklist

- [ ] ✅ Did this change reduce scanning or navigation friction?
- [ ] ✅ Are responsibilities clearer than before?
- [ ] ✅ Are module boundaries still enforced?
- [ ] ✅ Was any new global or shared code introduced?
- [ ] ✅ Is routing still explicit and centralized?
- [ ] ✅ Do all routes still work?
- [ ] ✅ TypeScript compiles without new errors?

**If any answer is "no", reconsider the change.**

---

## Splitting or Removing a Module

### When to Split a Module

If a module grows too large (>2000 LOC, >10 routes):

**Split by domain boundary, not by technical concern.**

**Good split:**

```
modules/products/        → modules/products/        (product pages)
                         → modules/product-reviews/  (review functionality)
```

**Bad split:**

```
modules/products/        → modules/products-ui/      (components)
                         → modules/products-data/    (GraphQL)
```

### Splitting Steps

1. **Identify domain boundary**
   - What naturally separates?
   - What can stand alone?

2. **Create new module**
   - Start flat (no premature structure)

3. **Move related files**
   - Routes, views, components, GraphQL

4. **Update route manifest**
   - Wire new module routes

5. **Verify independence**
   - No cross-module imports
   - Module can be deleted cleanly

### When to Remove a Module

If a module is no longer needed:

**It should be removable with minimal impact.**

**Deletion checklist:**

1. Remove routes from `app/routes.ts`
2. Delete module folder
3. Run TypeScript check
4. Fix only expected errors (direct usages)

**Widespread breakage indicates weak boundaries.**

---

## Summary

Modules are expected to scale over time.

**Scaling should:**

- ✅ Be incremental - Add structure only when needed
- ✅ Respond to real complexity - Not premature organization
- ✅ Preserve ownership boundaries - No cross-module imports
- ✅ Avoid hidden coupling - Explicit dependencies

**This playbook exists to keep modules maintainable as the codebase grows.**
