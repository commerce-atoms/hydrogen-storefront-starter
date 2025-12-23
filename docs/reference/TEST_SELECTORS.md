# Test Selectors Convention

Use `data-testid` as the **single, stable attribute** for E2E and component testing. Stable, explicit, and framework-agnostic.

## Naming Convention

**Format:** kebab-case, domain-prefixed, UI role-based (not content-based)

```tsx
// Global layout
<header data-testid="layout-header">...</header>
<nav data-testid="nav-primary">...</nav>

// Domain-specific
<div data-testid="cart-drawer">...</div>
<button data-testid="cart-open">Open Cart</button>
<li data-testid="cart-line">...</li>
<button data-testid="cart-line-remove">Remove</button>

// Product pages - use container + role pattern for lists
<div data-testid="product-variant-selector">
  <button data-testid="product-variant-option" data-option-value="red">Red</button>
</div>
<button data-testid="product-add-to-cart">Add to Cart</button>

// Catalog/search
<div data-testid="filters-panel">...</div>
<select data-testid="sort-select">...</select>
```

**Domain prefixes:** `cart-*`, `product-*`, `layout-*`, `nav-*`

## Where Required

**Required on:** `<button>`, `<a>`, `<input>`, `<select>`, `<textarea>`, elements with `role="button"`/`role="link"`, key containers (cart drawer, product form, filters, navigation)

**Not required on:** Presentational elements, text/typography, icons (unless interactive), route files unless they contain significant UI

## Anti-Patterns

**❌ Don't encode business data in test IDs** (critical anti-pattern):

```tsx
// ❌ BAD - Test ID changes with content/translations
<button data-testid={`product-variant-option-${option.name}-${optionValue.name}`}>
  {optionValue.name}
</button>

// ✅ GOOD - Role-based selector with data attributes
<div data-testid="product-variant-selector">
  <button data-testid="product-variant-option" data-option-value={optionValue.name}>
    {optionValue.name}
  </button>
</div>
```

**❌ Don't use:** Class names, CSS module hashes, text-based selectors (except accessibility), volatile IDs (numeric IDs, handles)

**Golden Rule:** If a test ID changes when product content changes, it is the wrong test ID. Test IDs identify **UI roles**, not **data values**.

## Exceptions

Opt-out with: `// eslint-disable-next-line require-data-testid -- reason`

**Common exceptions:** Presentational wrappers, third-party components, route files without significant UI

## Enforcement

**ESLint rule** enforces `data-testid` on interactive elements in `app/components/**/*.tsx`, `app/layout/**/*.tsx`, `app/modules/**/*.tsx` (excludes primitives, route files, test files).

**Smoke test** (`app/tests/test-selectors.smoke.test.ts`) validates presence using approximate heuristics.

## Usage

```typescript
// Playwright
const options = page.getByTestId('product-variant-option');
await options.first().click();
await page.getByTestId('product-add-to-cart').click();

// React Testing Library
const button = screen.getByTestId('product-add-to-cart');
expect(button).toBeInTheDocument();
```

**Query strategy:** Prefer `getByTestId`, use `getByRole` for accessibility, avoid `getByText` for E2E.
