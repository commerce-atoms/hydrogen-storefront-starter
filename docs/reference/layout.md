# Layout & Route Metadata

This document defines how layout behavior is derived from routes via React Router's handle mechanism.

**Single Responsibility**: Define the contract between routes and layout, and how metadata resolution works.

**See Also:**

- [routing.md](routing.md) - Route configuration and URL patterns
- [modules.md](modules.md) - Module structure and ownership

---

## Concept

This starter uses React Router's `handle` mechanism to let routes declare layout metadata (titles, breadcrumbs, layout variants). The application layout derives its behavior from the matched route tree, rather than from props or module coupling.

**Key principle:** Layout code is centralized; routes never import layout components.

---

## Supported Handle Fields

Routes can export a `handle` object with the following fields:

| Handle field | Purpose | Resolution rule |
| --------------- | ----------------------------- | ------------------ |
| `pageTitle` | Document title | deepest route wins |
| `pageHeader` | Page header content | deepest route wins |
| `breadcrumb` | Breadcrumb entries | root → leaf merged |
| `seo` | SEO metadata | deepest route wins |
| `layoutVariant` | Layout mode hint (shop, etc.) | deepest route wins |

**This is important: it defines governance.** Only these fields are supported. Adding new fields requires updating the layout system.

---

## Resolution Rules

Layout metadata is resolved from route matches using a two-pass strategy:

### Breadcrumbs: Root → Leaf (Accumulated)

Breadcrumbs accumulate from root → leaf. All matched routes contribute to the breadcrumb trail, building a complete navigation path.

**Example:**

- Root route: `breadcrumb: {label: 'Home', href: '/'}`
- Collection route: `breadcrumb: {label: 'Products', href: '/collections'}`
- Product route: `breadcrumb: {label: 'Snowboard', href: '/products/snowboard'}`

**Result:** `[{label: 'Home', href: '/'}, {label: 'Products', href: '/collections'}, {label: 'Snowboard', href: '/products/snowboard'}]`

### All Other Metadata: Leaf → Root (Deepest Wins)

All other layout metadata (`pageTitle`, `pageHeader`, `seo`, `layoutVariant`) is resolved leaf → root. The deepest route's value takes precedence.

**Example:**

- Root route: `pageTitle: 'Store'`
- Collection route: `pageTitle: 'Products'`
- Product route: `pageTitle: 'Snowboard'`

**Result:** `pageTitle: 'Snowboard'` (product route wins)

**Why?** This allows nested routes to override parent route metadata while breadcrumbs build a complete trail.

---

## Example

```typescript
// shop.route.tsx
export const handle = {
  pageTitle: 'Shop',
  layoutVariant: 'shop',
};
```

**No UI code. No CSS. No marketing.** Routes only declare intent; layout interprets it.

---

## What NOT to Do

❌ **Don't prop-drill layout flags** - Use handle instead

❌ **Don't import layout components into routes** - Routes provide metadata, layout consumes it

❌ **Don't infer layout from URL strings** - Use explicit handle fields

❌ **Don't special-case modules in layout** - All modules use the same handle contract

This prevents entropy and keeps the system maintainable.

---

## Implementation Details

The layout system uses `useMatches()` to access all matched routes and resolves metadata via `getLayoutData()` in `app/layout/utils/layout.ts`.

**Layout code location:** `app/layout/`

**Resolution logic:** Two-pass algorithm:

1. Pass 1: Accumulate breadcrumbs (root → leaf)
2. Pass 2: Resolve other metadata (leaf → root, deepest wins)

---

## Layout variants

The resolved `layoutVariant` is emitted on the `<main>` element as
`data-layout-variant="<value>"` (defaulting to `"default"`). That means CSS
in your fork can target it without touching `PageLayout` at all:

```css
main[data-layout-variant='shop'] {
  padding-inline: 0;
}
```

**To add a new variant:**

1. Add it to the `LayoutHandle` type union (`app/layout/types/handle.ts`).
2. Update `ResolvedLayoutData` (`app/layout/types/resolvedLayout.ts`).
3. Set `layoutVariant: '<value>'` in the target route's `handle` export.
4. Style it via `main[data-layout-variant='<value>']` or, if you need
   different JSX / different components, branch on
   `layoutData.layoutVariant` inside `PageLayout`.

**Do not add JSX branches until there is a concrete need. The CSS hook
covers most cases without further wiring.**

---

## Summary

- Routes declare layout intent via `handle` export
- Layout resolves metadata from matched routes using `useMatches()`
- Breadcrumbs accumulate; other metadata uses deepest route wins
- Layout code is centralized; routes never import layout components
- Only supported handle fields should be used

**This contract prevents coupling between routes and layout while enabling flexible layout behavior.**
