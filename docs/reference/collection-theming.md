# Collection theming

Per-collection colour palette. Data-driven, no template forks.

Lives in `app/platform/theming/`.

## Data model

- Metaobject `theme_palette`. 10 optional colour fields. Reusable across collections.
- Metafield `theme.preset` on `Collection`. `metaobject_reference` -> `theme_palette`.

Both provisioned by `npm run setup:theming`. Idempotent.

## Module files

- `types.ts` — `Theme` domain type, field maps, metaobject identifier.
- `collectionThemeFragment.ts` — GraphQL fragment on `Collection`.
- `parseTheme.ts` — owner-agnostic parser. Returns `Theme | null`.
- `ThemeStyle.tsx` — SSR-safe wrapper. Injects one `<style>` block scoped by `data-collection-theme`.

## Wiring

1. Spread `...CollectionThemeReference` in the collection query.
2. In the loader: `const theme = parseTheme(collection.themePreset);`
3. In the view: `<ThemeStyle theme={theme} handle={collection.handle}>...</ThemeStyle>`.

When a collection has no palette, `theme` is `null` and the page inherits global tokens from `app/styles/tokens.css`.

## Merchant workflow

- Add palette: **Content -> Metaobjects -> Theme palette -> Add entry**.
- Assign palette: **Collection -> Metafields -> Theme preset -> pick**.

Both are dropdown changes in admin. No code.

## Adding a new token

1. Add the field to `Theme`, `THEME_TOKEN_MAP`, and `THEME_PALETTE_FIELD_MAP` in `app/platform/theming/types.ts`.
2. Add the field to `PALETTE_FIELDS` in `scripts/setup-theming.mjs`.
3. Run `npm run setup:theming` then `npm run codegen`.

## Extending to Product / Page / Shop

`parseTheme` is owner-agnostic. To theme another owner:

1. Copy `collectionThemeFragment.ts` to a new file, change `on Collection` to the target owner.
2. Provision the `theme.preset` metafield on that owner in `scripts/setup-theming.mjs`.
3. In the target loader, spread the fragment and call `parseTheme(...)`.

Add a `resolveTheme(...)` helper only when two owners can supply a palette to the same view.

## Security

Values reach the parser from merchant input via the Storefront API and are inlined into an SSR `<style>` block. `parseTheme` runs each value through a strict CSS-colour regex. Anything containing `;`, `{`, `}`, `<`, `>`, `@`, backticks, or newlines is rejected. Rejected values are dropped silently; the merchant gets an unstyled token instead of a broken page.

## Non-goals

- No JS theme provider. SSR only.
- No typography, spacing, or layout overrides.
- No dark-mode toggle. Layer that separately.
