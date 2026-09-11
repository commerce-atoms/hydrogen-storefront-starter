# Collection theming

Per-collection art direction, layered on top of the global brand tokens.
One storefront, many palettes — no forked templates, no per-collection code.

- **Where it lives:** `app/platform/theming/` (see [module README](../../app/platform/theming/README.md)).
- **How it's wired:** `app/modules/collections/collection-handle.route.tsx`
  reads the `themePreset` reference via `parseCollectionTheme` and the view
  wraps its output in `<ThemeStyle>`.
- **Where the data comes from:** a Shopify **Metaobject** of type
  `theme_palette` referenced by the `theme.preset` metafield on the
  Collection.

## Data model

Two custom-data definitions in Shopify:

1. **Metaobject definition** `theme_palette` — a reusable palette. 10 optional
   `color` fields covering surfaces, text, borders, and accents. Marketing /
   design can create as many palette entries as they want.
2. **Metafield definition** on Collection: namespace `theme`, key `preset`,
   type `metaobject_reference` (constrained to `theme_palette`). Each
   collection either points at a palette entry, or leaves it blank to inherit
   the global tokens.

Both are created for you by `npm run setup:theming` (see below). You can
also create them by hand in Shopify admin.

## Setup

### One-time, per store: provision the definitions

```bash
# .env must contain PUBLIC_STORE_DOMAIN and PRIVATE_ADMIN_API_ACCESS_TOKEN
# (the admin token needs write_metaobject_definitions + write_metaobjects)
npm run setup:theming
```

The script is idempotent — re-running it is safe. If the `theme_palette`
metaobject already exists but is missing fields you have since added to
`THEME_PALETTE_FIELD_MAP`, the script will extend it in place.

If you would rather not run a script:

- **Settings → Custom data → Metaobjects → Add definition**
  Type `theme_palette`, add 10 fields of type `Color` with the snake_case
  keys listed in `THEME_PALETTE_FIELD_MAP` (`background`, `surface`,
  `surface_secondary`, `text_primary`, `text_secondary`, `border`,
  `border_light`, `accent`, `accent_hover`, `accent_secondary`).
- **Settings → Custom data → Collections → Add definition**
  Name `Theme preset`, namespace `theme`, key `preset`, type
  `metaobject_reference`, validated against `theme_palette`, storefront
  access `PUBLIC_READ`.

### Per palette

**Content → Metaobjects → Theme palette → Add entry.** Pick a handle
(`dark-industrial`, `bees`, `halloween`, `labs`, whatever), fill in whichever
color fields matter for that palette. Leave unused fields empty — they will
fall back to the global tokens.

Palettes are reusable across collections. Change a palette once and every
collection using it updates.

### Per themed collection

Open the collection in admin → **Metafields → Theme preset** → pick a palette
from the dropdown. Done. No deploy, no code change.

Leave `Theme preset` empty on collections that should stay on the default
brand.

## Sample palettes

Illustrative only. Copy the values into a palette entry to see the wiring
end-to-end.

### Dark / industrial

```
background        = #0b0b0d
surface           = #14141a
surface_secondary = #0f0f13
text_primary      = #ededf2
text_secondary    = #b7b7c5
border            = #2a2a33
border_light      = #23232c
accent            = #7a0800
accent_hover      = #9a0a02
```

### Bees (yellow / black / green)

```
background        = #0d0d0a
surface           = #171612
text_primary      = #f7e26a
accent            = #f7c40d
accent_hover      = #d9a800
border            = #2a2721
accent_secondary  = #2f7d3a
```

### Halloween (pumpkin / carmine / bone)

```
background        = #0a0808
surface           = #17110b
text_primary      = #efe6d3
accent            = #ff6a00
accent_hover      = #d95700
accent_secondary  = #a4001f
```

### Labs (cold blue / cyan)

```
background        = #06090d
surface           = #0d141c
text_primary      = #dbeaf6
accent            = #4aa3ff
accent_hover      = #2a86e8
accent_secondary  = #1fd0d0
```

## How it renders

For collections **with** a palette:

```html
<div data-collection-theme="new-arrivals">
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

For collections **without** a palette assigned (no `<style>` block emitted):

```html
<div data-collection-theme="clearance">
  <!-- collection page — inherits global tokens -->
</div>
```

The style block is emitted at SSR time; nothing runs client-side. Components
inside the wrapper consume `var(--color-*)` and pick up the overrides
automatically. No context, no provider, no re-render, no hydration mismatch.

## Security

Palette values are attacker-controlled from the merchant admin's perspective.
`parseCollectionTheme` runs each value through a strict CSS-colour regex
(hex, `rgb`/`rgba`/`hsl`/`hsla`/`oklab`/`oklch`/`color(...)`, or named
colours) and rejects anything containing `;`, `{`, `}`, `<`, `>`, `@`,
backticks, or newlines. Rejected values are silently dropped — the token
falls back to the global default rather than shipping a broken page.

## Fallback semantics

| Situation                                                       | Result                                     |
|-----------------------------------------------------------------|--------------------------------------------|
| No `theme.preset` set on the collection                         | Global tokens; no `<style>` block emitted  |
| `theme.preset` points at a metaobject of a different type       | Treated as "no theme"                      |
| The palette exists but has no fields set                        | Treated as "no theme"                      |
| Some fields set, some empty                                     | Empty ones fall back to the global token   |
| A single field fails validation                                 | That token falls back; others apply        |
| **All** fields fail validation                                  | Treated as "no theme"                      |

## Extending

To add a new theme token (say `--color-button-bg`):

1. Add `buttonBg?: string` to `CollectionTheme` in `app/platform/theming/types.ts`.
2. Add mappings for it to `THEME_TOKEN_MAP` and `THEME_PALETTE_FIELD_MAP`
   (both in the same file).
3. Add `{key: 'button_bg', name: 'Button bg'}` to `PALETTE_FIELDS` in
   `scripts/setup-theming.mjs`.
4. Re-run `npm run setup:theming` — it extends the metaobject definition in place.
5. `npm run codegen` to refresh generated types.

## Product pages

Product pages linked from a collection do **not** inherit the collection
theme by default. Two paths for a per-store extension:

- A `?from=<collection-handle>` query param on the product link, plus a
  second theme lookup in the product route.
- A "primary collection" metafield on the product.

Both reuse `COLLECTION_THEME_FRAGMENT`, `parseCollectionTheme`, and
`<ThemeStyle>` — the module is deliberately designed to be dropped in
anywhere a page needs a theme.

## Non-goals

- Not a design-system replacement. Typography, spacing, radii, motion, and
  layout stay global. Themes touch colour tokens only, on purpose.
- Not a runtime toggle. Themes are resolved at SSR from server data.
- Not a dark-mode system. If you need one, layer it on top of these tokens
  (e.g. `@media (prefers-color-scheme: dark)` in `tokens.css`).
