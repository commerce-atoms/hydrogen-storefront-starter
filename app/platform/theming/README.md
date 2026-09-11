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
identity. But some stores need per-collection palettes without forking the
layout or duplicating components (e.g. "Bees" is yellow/black/green, "Labs" is
cold blue/cyan, "Halloween" is pumpkin orange). This module scopes a small
subset of colour tokens per collection while keeping typography, spacing,
components, and interactions identical.

## Shape

- `types.ts` — `CollectionTheme`, `THEME_TOKEN_MAP`, `THEME_METAFIELD_KEYS`.
- `collectionThemeFragment.ts` — `CollectionThemeMetafields` GraphQL fragment.
- `parseCollectionTheme.ts` — validates and normalises Storefront API
  metafields into a typed `CollectionTheme | null`.
- `ThemeStyle.tsx` — SSR-safe wrapper that renders `data-collection-theme` on
  the wrapper element and, when a theme is present, a scoped `<style>` block.
  Uses a plain `<style>{css}</style>` — no `dangerouslySetInnerHTML`, because
  the CSS is fully controlled and pre-validated.

## How it wires in

1. Include `COLLECTION_THEME_FRAGMENT` in your collection query and spread
   `...CollectionThemeMetafields` on the `Collection` selection.
2. In the loader, call `parseCollectionTheme(collection.themeMetafields)`.
3. In the view, wrap output in `<ThemeStyle theme={theme} handle={collection.handle}>…</ThemeStyle>`.

Fallback: when a collection has no metafields, `theme` is `null` and the page
inherits the global tokens with zero DOM overhead.

## Adding a new themed collection

No code change. In Shopify admin, set the `theme.*` metafields on the
collection (see `docs/reference/collection-theming.md` for the metafield
definitions and CSV shortcut).

## Adding a new theme token

1. Add the field to `CollectionTheme` and both `THEME_TOKEN_MAP` and
   `THEME_METAFIELD_KEYS` in `types.ts`.
2. Add the matching `{namespace, key}` to `COLLECTION_THEME_FRAGMENT`.
3. Run `npm run codegen` so `themeMetafields` is retyped in
   `storefrontapi.generated.d.ts`.

## Non-goals

- No JS theme provider / context. The theme is CSS custom properties, applied
  by a single SSR-rendered `<style>` block. No re-renders, no hydration mismatch.
- No per-collection layout / typography / spacing overrides — those stay
  global on purpose.
- No dark-mode toggling. If you need runtime switching, layer it on top of
  these tokens; do not push it into this module.
