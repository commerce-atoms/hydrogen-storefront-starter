# `app/platform/theming/`

Optional, data-driven **per-collection theming**. One recognisable storefront,
different art direction per collection.

Lives in `platform/` — not `modules/` — because it is a *cross-cutting
service* (any module can consume it) rather than a vertical-slice module.
Sibling to `platform/seo/` and `platform/i18n/`. This placement also keeps
the architecture validator happy: modules cannot import from other modules,
but they can freely import from `platform/`.

## Why this exists

The global brand tokens in `app/styles/tokens.css` define the storefront's
identity. Some stores need per-collection palettes without forking the
layout or duplicating components. This module scopes a small subset of
colour tokens per collection while keeping typography, spacing, components,
and interactions identical.

## Shape

- `types.ts` — `CollectionTheme`, `THEME_TOKEN_MAP`, `THEME_PALETTE_FIELD_MAP`,
  `THEME_METAOBJECT_TYPE`, `THEME_PRESET_METAFIELD`.
- `collectionThemeFragment.ts` — `CollectionThemeReference` GraphQL fragment;
  resolves the `theme.preset` metafield to its `theme_palette` metaobject.
- `parseCollectionTheme.ts` — validates the metaobject fields and returns a
  typed `CollectionTheme | null`.
- `ThemeStyle.tsx` — SSR-safe wrapper that renders `data-collection-theme`
  on the element and, when a theme is present, a scoped `<style>` block
  built from pre-validated `parseCollectionTheme` output.

## Data model

- **Metaobject** `theme_palette` — a reusable palette (10 optional `color`
  fields). Marketing / design creates as many as they want in Shopify admin.
- **Metafield** on Collection: `theme.preset`, a `metaobject_reference` to a
  `theme_palette` entry. Each collection either picks a palette from a
  dropdown or leaves it blank.

Both definitions are provisioned by `npm run setup:theming` (see
`scripts/setup-theming.mjs`). The script is idempotent.

## How it wires in

1. Include `COLLECTION_THEME_FRAGMENT` in your collection query and spread
   `...CollectionThemeReference` on the `Collection` selection.
2. In the loader, call `parseCollectionTheme(collection.themePreset)`.
3. In the view, wrap output in
   `<ThemeStyle theme={theme} handle={collection.handle}>…</ThemeStyle>`.

Fallback: when a collection has no palette (or the assigned palette has no
usable values), `theme` is `null` and the page inherits the global tokens.

## Adding a new themed collection

No code. In Shopify admin: **Collection → Metafields → Theme preset → pick a
palette**. That's the whole workflow.

## Adding a new palette

No code. **Content → Metaobjects → Theme palette → Add entry.** Fill the
color fields, save. Any collection can now select it.

## Adding a new theme token

See "Extending" in `docs/reference/collection-theming.md`. Requires updating
`types.ts` + `scripts/setup-theming.mjs` + re-running `npm run setup:theming`
+ `npm run codegen`.

## Non-goals

- No JS theme provider / context. The theme is CSS custom properties applied
  by a single SSR-rendered `<style>` block. No re-renders, no hydration
  mismatch.
- No per-collection layout / typography / spacing overrides — those stay
  global on purpose.
- No dark-mode toggling. If you need runtime switching, layer it on top of
  these tokens; do not push it into this module.
