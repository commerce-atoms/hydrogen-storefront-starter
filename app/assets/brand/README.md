# Brand assets

> Per-store visual assets. Drop your real assets into this directory; the storefront reads from them by convention. Pair with `app/config/brand.ts` for typed identity values (name, locales, colours, fonts).

## Required assets

| File | Purpose | Notes |
|---|---|---|
| `logo.svg` | Primary logo. Rendered in the header, footer, and OG fallback. | SVG strongly preferred; falls back to PNG if absent. |
| `favicon.svg` | Browser favicon. | Use a square crop of the logo with no padding. |
| `og-default.png` | Default OpenGraph image used when a page has no specific OG image. | 1200 × 630 px. |
| `tokens.css` | CSS custom properties for runtime theming. Mirrors values in `app/config/brand.ts#colours`. | See "Token mirroring" below. |

## Token mirroring

`app/config/brand.ts` is the source of truth for colour and font values; `tokens.css` exposes the same values as CSS custom properties so non-component CSS (the global stylesheet, third-party widgets) can reference them. Keep the two in sync — when you change a colour in `brand.ts`, update the matching `--brand-colour-primary` etc. in `tokens.css`.

A future codegen step in `@commerce-atoms/agents` will generate `tokens.css` from `brand.ts` automatically; until then it is hand-maintained.

## What does NOT belong here

- Product images — those live on Shopify CDN.
- UI icons used inside components — colocate with the component.
- Per-page OG images — use the page's own meta override, not this default.

## Forks

Each store fork replaces these placeholders with real assets. The starter ships with neutral / placeholder values so forks always start from a clean baseline.
