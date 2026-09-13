# Brand assets

> Per-store visual assets. Pair with `app/config/brand.ts` for typed identity
> values (name, locales, colours, fonts). Both are the two authoritative
> per-store surfaces. Everything else in the starter stays brand-neutral.

## Ships with the starter

| File | Wired in | Notes |
|---------------|---------------------|-------|
| `favicon.svg` | `app/root.tsx` (`~/assets/brand/favicon.svg`) | Neutral placeholder. Replace with a square crop of your logo. No padding. |

## Drop-in slots for your fork

These are conventional filenames the agent kit and prompts reference. **The
starter does not wire them itself**. Add the file, then wire it in the store
component that consumes it. Delete the row if your fork does not need it.

| File | Suggested use | Wire it from |
|-----------------|-----------------------------------------------------------------|--------------|
| `logo.svg` | Header wordmark / OG fallback | `app/layout/components/Header.tsx`, meta functions |
| `og-default.png`| Default OpenGraph image (1200 × 630) | `app/root.tsx` meta or `@platform/seo/brandMeta.ts` |

## Where colour tokens live

Global colour tokens do **not** live in this directory. They live in
`app/styles/tokens.css` (loaded once from `app/root.tsx`). `brand.ts` holds
the typed identity values; `tokens.css` is the runtime CSS variable surface.
Keep the two in sync when you change a brand colour.

Per-collection overrides layer on top through the optional
[collection theming module](../../../docs/reference/collection-theming.md).

## What does NOT belong here

- Product / campaign imagery. Those live on Shopify CDN.
- UI icons colocated with a specific component. Colocate with the component.
- Per-page OG images. Use the page's own meta override, not the global default.

## Forks

Each store fork replaces `favicon.svg` with a real asset and, if needed, adds
the drop-in slots above. Everything the starter itself imports resolves to a
real file. No dangling paths.
