# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- Optional per-collection **theming module** (`app/platform/theming/`).
  Data-driven from Shopify collection metafields (`theme.*` namespace),
  applies scoped `--color-*` overrides via an SSR-rendered `<style>` block.
  New docs: `docs/reference/collection-theming.md`. Adds
  `@commerce-atoms/metafield@^0.4.1` as a runtime dependency.
- Brand meta helper `app/platform/seo/brandMeta.ts` — emits `og:site_name`,
  `og:locale`, and (when set) `twitter:site` from `brand.ts` at the root
  route; cascades to every page.
- Footer brand mark: `© <year> <brand.name>` sourced from `brand.ts`.
- `<main data-layout-variant="…">` — the resolved `layoutVariant` is now
  exposed on the DOM so CSS in forks can target
  `main[data-layout-variant='shop'] { … }` without JSX branching.

### Changed

- `app/config/features.ts` **wired into `app/routes.ts`**: flipping a
  flag now removes the corresponding routes from the build. Docstring
  documents the required 3-step disable flow (flag → delete module folder
  → prune UI touchpoints) to avoid the typecheck trap.
- `<html lang>` now derives from `brand.defaultLocale` instead of the
  hardcoded `"en"`.
- `@commerce-atoms/agents` dependency range widened `^0.1.2 → ^0.3.0` so
  it matches the pinned `agents.config.json#agentsVersion`.
- `package.json` `repository` / `homepage` / `bugs` retargeted from
  `doctor-undefined/hydrogen-storefront-base` to
  `commerce-atoms/hydrogen-storefront-starter`.
- `app/assets/favicon.svg` moved to `app/assets/brand/favicon.svg` so the
  code matches every agent-kit rule that already references
  `assets/brand/favicon.svg`. Root import updated.
- `app/assets/brand/README.md` rewritten. No longer claims the starter
  wires `tokens.css` / `logo.svg` / `og-default.png`; describes the one
  slot the starter ships (favicon) and the drop-in slots forks add
  themselves.
- `docs/reference/layout.md`: `layoutVariant` section now documents the
  `data-layout-variant` CSS hook and the (still-optional) JSX branching
  path.
- `docs/reference/metaobjects.md`: rewrote three example blocks that
  imported the non-existent `extractString` from
  `@commerce-atoms/metafield` (there is no barrel export) to use the
  shipping per-file entries (`getMetaobjectString`,
  `getMetaobjectMediaImage`).

### Fixed

- `.env.example` `PUBLIC_STOREFRONT_API_VERSION` bumped `2024-10 → 2026-04`
  to match every other reference in the repo and agent kit.
- Docs-code drift for `@commerce-atoms/metafield` — examples now compile
  against the shipping API surface.

## [0.0.1] - Initial Release
