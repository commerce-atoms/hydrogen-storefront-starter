# Collection theming

Per-collection art direction, layered on top of the global brand tokens.
One storefront, many palettes — no forked templates, no per-collection code.

- **Where it lives:** `app/platform/theming/` (see [module README](../../app/platform/theming/README.md)).
- **How it's wired:** `app/modules/collections/collection-handle.route.tsx`
  parses metafields via `parseCollectionTheme` and the view wraps its output
  in `<ThemeStyle>`.
- **Where the data comes from:** Shopify collection metafields in the
  `theme` namespace.

## Metafield definitions (Shopify admin)

Create these on **Settings → Custom data → Collections** (all optional):

| Namespace and key           | Type                     | Example value          | Overrides            |
|-----------------------------|--------------------------|------------------------|----------------------|
| `theme.background`          | `color` or single-line   | `#0b0b0d`              | `--color-background` |
| `theme.surface`             | `color` or single-line   | `#14141a`              | `--color-surface`    |
| `theme.surface_secondary`   | `color` or single-line   | `#0f0f13`              | `--color-surface-secondary` |
| `theme.text_primary`        | `color` or single-line   | `#ededf2`              | `--color-text-primary` |
| `theme.text_secondary`      | `color` or single-line   | `#b7b7c5`              | `--color-text-secondary` |
| `theme.border`              | `color` or single-line   | `#2a2a33`              | `--color-border`     |
| `theme.border_light`        | `color` or single-line   | `#23232c`              | `--color-border-light` |
| `theme.accent`              | `color` or single-line   | `#7a0800`              | `--color-accent`     |
| `theme.accent_hover`        | `color` or single-line   | `#9a0a02`              | `--color-accent-hover` |
| `theme.accent_secondary`    | `color` or single-line   | `#4aa3ff`              | `--color-accent-secondary` |

Both Shopify's built-in `color` type and `single_line_text_field` are
accepted. Values are validated against a strict CSS-colour regex — anything
that could break out of a CSS declaration is dropped silently, so the theme
falls back to the global token instead of shipping a broken page.

Accepted value shapes:

- Hex: `#0b0b0d`, `#0bf`, `#0b0b0dcc`
- Functional: `rgb(...)`, `rgba(...)`, `hsl(...)`, `hsla(...)`,
  `oklch(...)`, `oklab(...)`, `color(...)`
- Named CSS colours (letters only): `black`, `tomato`, `currentColor`

Anything else, or anything containing `;`, `{`, `}`, `<`, `>`, `@`, backticks,
or line breaks, is rejected.

## Sample palettes

Illustrative only. Copy the values into a collection's metafields to see
the wiring end-to-end.

### Dark / industrial

```
theme.background       = #0b0b0d
theme.surface          = #14141a
theme.surface_secondary= #0f0f13
theme.text_primary     = #ededf2
theme.text_secondary   = #b7b7c5
theme.border           = #2a2a33
theme.border_light     = #23232c
theme.accent           = #7a0800
theme.accent_hover     = #9a0a02
```

### Bees (yellow / black / green)

```
theme.background   = #0d0d0a
theme.surface      = #171612
theme.text_primary = #f7e26a
theme.accent       = #f7c40d
theme.accent_hover = #d9a800
theme.border       = #2a2721
theme.accent_secondary = #2f7d3a
```

### Halloween (pumpkin / carmine / bone)

```
theme.background   = #0a0808
theme.surface      = #17110b
theme.text_primary = #efe6d3
theme.accent       = #ff6a00
theme.accent_hover = #d95700
theme.accent_secondary = #a4001f
```

### Labs (cold blue / cyan)

```
theme.background   = #06090d
theme.surface      = #0d141c
theme.text_primary = #dbeaf6
theme.accent       = #4aa3ff
theme.accent_hover = #2a86e8
theme.accent_secondary = #1fd0d0
```

## How it renders

For collections **with** metafields:

```html
<div data-collection-theme="halloween">
  <style>
    [data-collection-theme] {
      --color-background: #0a0808;
      --color-accent:     #ff6a00;
      /* … */
    }
  </style>
  <!-- collection page -->
</div>
```

For collections **without** metafields (no `<style>` block emitted):

```html
<div data-collection-theme="new-arrivals">
  <!-- collection page — inherits global tokens -->
</div>
```

The style block is emitted at SSR time; nothing runs client-side. Components
inside the wrapper consume `var(--color-*)` and pick up the overrides
automatically. No context, no provider, no re-render, no hydration mismatch.

## Fallback semantics

| Situation                                    | Result                                     |
|----------------------------------------------|--------------------------------------------|
| No metafields set on the collection          | Global tokens; no `<style>` block emitted  |
| Some metafields set, some empty              | Empty ones fall back to the global token   |
| A value fails validation                     | That single token falls back; others apply |
| **All** values fail validation               | Treated as "no theme"                      |

## Extending

To add a new theme token (say `--color-button-bg`):

1. Add `buttonBg?: string` to `CollectionTheme` in `app/platform/theming/types.ts`.
2. Add the mappings to `THEME_TOKEN_MAP` and `THEME_METAFIELD_KEYS`.
3. Add `{namespace: "theme", key: "button_bg"}` to `COLLECTION_THEME_FRAGMENT`.
4. `npm run codegen` to refresh generated types.
5. Update the metafield table in this doc.

## Product pages

Product pages linked from a collection do **not** inherit the collection
theme by default. Adding this cleanly requires either a `?from=<handle>`
query param on the product link plus a second theme lookup in the product
route, or a "primary collection" metafield on the product. Both are cheap
per-store additions; they're intentionally not in the starter because there
is no single-obviously-right answer for every fork.

If you add it: reuse `COLLECTION_THEME_FRAGMENT`, `parseCollectionTheme`,
and `<ThemeStyle>` — the module is designed to be dropped in anywhere.

## Non-goals

- Not a design-system replacement. Typography, spacing, radii, motion, and
  layout stay global. Themes touch colour tokens only, on purpose.
- Not a runtime toggle. Themes are resolved at SSR from server data.
- Not a dark-mode system. If you need one, layer it on top of these tokens
  (e.g. `@media (prefers-color-scheme: dark)` in `tokens.css`).
