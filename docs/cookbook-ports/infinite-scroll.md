# Cookbook port — Infinite scroll for collections

> **Goal of this doc.** Capture the actual experience of porting a single Shopify Hydrogen cookbook recipe ([`infinite-scroll`](https://github.com/Shopify/hydrogen/tree/main/cookbook/recipes/infinite-scroll)) into the modular shape. Surface friction, repeated operations, decisions, and gaps. Seed the upcoming `port-hydrogen-cookbook-recipe` skill in `@commerce-atoms/agents` ([`PLAN.md` §1.4](../../review/PLAN.md)).

## Recipe summary

Infinite scroll on collection pages: sentinel-based auto-load of the next page when the "Load more" link enters the viewport. Replaces history-clutter pagination with continuous loading. Eager loading for the first 8 products; lazy for the rest.

Upstream source: [`Shopify/hydrogen/cookbook/recipes/infinite-scroll`](https://github.com/Shopify/hydrogen/tree/main/cookbook/recipes/infinite-scroll).

## Adapter-layer translation matrix

The skeleton template the recipe targets uses different conventions than this starter. Every line of the recipe diff required a translation step:

| Recipe assumes (skeleton) | This starter (modular) | Friction |
|---|---|---|
| `app/routes/collections.$handle.tsx` (filesystem routing) | `app/modules/collections/collection-handle.{route,view}.tsx` (module + route/view split) | None — the route mapping was already in `app/routes.ts`. |
| `~/components/PaginatedResourceSection` | `@components/pagination/PaginatedResourceSection` | Path-alias rewrite. Mechanical. |
| `~/components/ProductItem` | `@components/commerce/ProductCard` | Renamed in the modular shape. Trivial. |
| `~/lib/redirect` | `@platform/i18n/redirects` | The starter pulls i18n logic into platform; the recipe assumes a flat `lib/`. Trivial. |
| Inline `LoadMoreProductsGrid` component | `app/hooks/catalog/useInfiniteScroll` | **Architectural decision** — see "Decisions" below. |
| `useInView` from `react-intersection-observer` | Same; new `package.json` dependency | None. |
| `loading={index < 8 ? 'eager' : 'lazy'}` | Already present in `collection-handle.view.tsx` | The eager-loading optimisation was already done in this starter. |

## Decisions

### 1. Hook vs. inline component vs. component prop

The recipe inlines a new `LoadMoreProductsGrid` component into the route file. Three viable shapes for this starter:

| Option | Pros | Cons |
|---|---|---|
| A — Inline in `collection-handle.view.tsx` | Smallest diff. | Not reusable in `app/modules/search`. Couples scroll behaviour to one view. |
| B — Hook in `app/hooks/catalog/useInfiniteScroll` | Reusable across catalog modules. Hook policy already documented in `architecture.md` §2. | Each caller has to wire the sentinel `ref`. |
| C — `infinite` prop on `PaginatedResourceSection` | Most ergonomic — opt-in by one prop. | Behaviour creeps into a presentational primitive. |

**Chosen: B + C.** The hook is the reusable atom; `PaginatedResourceSection` opts into the hook when `infinite={true}`. This:

- Keeps the hook independently consumable from any catalog module that does NOT use `<Pagination>` (e.g. search — see "Gaps" below).
- Concentrates the "load more on scroll" wiring in one shared component so every caller benefits with `infinite` rather than each duplicating the sentinel ref / `loadMore` plumbing.
- Preserves backward compatibility — `infinite` defaults to `false`, existing call sites are unaffected.

### 2. URL state policy

Recipe uses `navigate(nextPageUrl, {replace: true, preventScrollReset: true, state})`. We adopt verbatim. `replace: true` avoids history clutter; `preventScrollReset` stops jumping back to the top.

### 3. Where the sentinel attaches

Recipe attaches the `useInView` ref to `<NextLink ref={...}>`. We do the same — the existing "Load more" link is the natural sentinel. No new DOM element needed.

### 4. New dependency (`react-intersection-observer`)

The recipe pins `^8.34.0`; we pin `^9.10.3` (current major). React 18-compatible. ~3 kB bundle impact.

## Steps actually taken

The literal sequence — captures repeated operations a future skill would automate.

1. **Read the upstream recipe** ([`README.md`](https://raw.githubusercontent.com/Shopify/hydrogen/main/cookbook/recipes/infinite-scroll/README.md)). Identify the diff scope: 1 route file + 1 dependency.
2. **Map skeleton paths to modular paths** (the table above). This step is mechanical but unavoidable on every port.
3. **Decide on the hook vs. inline trade-off** (above). Required reading: `rules/core/architecture.md` §2 (cross-module reuse ladder) and §2 again (hooks policy).
4. **Write the hook** at `app/hooks/catalog/useInfiniteScroll.ts`. Generic over `loadMore` so it doesn't assume Hydrogen `Pagination`.
5. **Modify `PaginatedResourceSection.tsx`** to expose an `infinite` prop. Wrap the inner render in a sub-component so we can use hooks against the `Pagination` render-prop value.
6. **Add `react-intersection-observer` to `package.json#dependencies`**. Pin to current major.
7. **Opt collection-handle in** by passing `infinite` to the existing `<PaginatedResourceSection>`.
8. **Run `validate-architecture`** — clean. No new boundary violations.
9. **Document the port** (this file).

## Friction observed

A future `port-hydrogen-cookbook-recipe` skill needs to handle these explicitly:

### F1 — Path-alias drift

Every `~/components/*` and `~/lib/*` reference needs rewriting. The skill should map the canonical aliases (`@components/*`, `@platform/*`, `@hooks/*`, `@modules/*`) and rewrite imports automatically.

### F2 — Skeleton-style filesystem routing

The recipe diffs against `app/routes/collections.$handle.tsx` — a filesystem route. In this starter, that file does not exist; the equivalent route module is `app/modules/collections/collection-handle.route.tsx`. The skill must resolve the route name from `app/routes.ts` rather than assuming filesystem layout.

### F3 — Route/view split unawareness

Recipes intermix loaders and UI in one file. The starter splits them. The skill must know that JSX changes belong in `*.view.tsx` and loader/meta changes belong in `*.route.tsx`.

### F4 — Reuse opportunities the recipe doesn't surface

The recipe targets exactly one route. But the underlying behaviour (intersection-observer-driven load more) is useful in any catalog surface. The skill should ask: *"Are there sibling modules that would benefit from this?"* and propose promotion to `app/hooks/<scope>/` per the cross-module reuse ladder.

### F5 — Component-shape creep

The recipe's `LoadMoreProductsGrid` is a new component that combines product card rendering with intersection-observer wiring. In the modular shape we separate the two — rendering stays where it was, behaviour goes into a hook. The skill needs a heuristic: *"if the new component is a thin wrapper around an existing one + behaviour, prefer extracting the behaviour."*

### F6 — Overlap with starter-specific optimisations

The recipe re-introduces `loading={index < 8 ? 'eager' : 'lazy'}`. This optimisation was already present in the starter. Re-applying the diff would have no effect, but a careless port could double-handle it. The skill should diff first against the starter's existing state and skip changes that are already applied.

## Gaps — the recipe doesn't ship

### G1 — Search

`app/modules/search` does NOT use Hydrogen's `<Pagination>` — it builds its own pagination URLs and uses `<Link prefetch="intent">`. The cookbook recipe assumes `<Pagination>`, so applying it to search would require a deeper refactor of search's pagination shape (or duplication of the hook with a search-specific `loadMore`). For S3 we surface this as a gap rather than fix it; the hook is generic enough that a future search-pagination refactor can adopt it without changes.

### G2 — Loading sentinel UX

The recipe relies on the existing "Load more ↓" link as the sentinel. When infinite scroll is enabled, that affordance becomes invisible / redundant. A future iteration could:

- Hide the link visually but keep it for accessibility / no-JS fallback.
- Replace the spinner with a skeleton row.
- Add an "End of results" sentinel for clarity.

Out of scope here.

### G3 — Tests

The recipe ships no tests for the new behaviour. The starter has Vitest; a follow-up should add a smoke test that asserts the hook fires `loadMore` exactly once when the sentinel intersects.

## Recommendations for the `port-hydrogen-cookbook-recipe` skill

Drawing from F1–F6 and G1–G3, the skill should:

1. **Pre-flight diff.** Compare every file the recipe touches against this starter's current state; flag already-applied chunks (F6).
2. **Path-alias rewrite step.** Map skeleton paths to modular aliases automatically (F1, F2).
3. **Route/view split awareness.** Route the JSX delta into `*.view.tsx`, loader/meta into `*.route.tsx` (F3).
4. **Cross-module promotion check.** After applying the recipe, prompt: *"Does this behaviour belong in `app/hooks/<scope>/` for sibling modules?"* (F4).
5. **Behaviour vs. presentation extraction.** Heuristic for inline component → hook + prop (F5).
6. **Sibling-module survey.** Enumerate other modules that would benefit; surface gaps (G1).
7. **Post-apply validation.** Always invoke `validate-architecture` after the patch lands. Block PR readiness on violations.
8. **Tests scaffolding.** Generate at least one Vitest smoke test per added behaviour, with a failing default that the operator fills in (G3).

## Validator output

```text
$ npx commerce-atoms validate-architecture --out .
commerce-atoms validate-architecture
  root: /…/hydrogen-storefront-starter
  result: PASS — no violations found.
```

## Files touched

| File | Change |
|---|---|
| `app/hooks/catalog/useInfiniteScroll.ts` | New. Generic intersection-observer-driven `loadMore` trigger. |
| `app/components/pagination/PaginatedResourceSection.tsx` | Added `infinite` prop; internally invokes the hook against `Pagination`'s render-prop values. |
| `app/modules/collections/collection-handle.view.tsx` | Opts into `infinite`. |
| `package.json` | Added `react-intersection-observer@^9.10.3` to `dependencies`. |
| `docs/cookbook-ports/infinite-scroll.md` | This document. |

## Conclusion

The doctrine in `AGENTS.md` §0 (`commerce-atoms` ports cookbook recipes; it does not write its own implementations) holds for this recipe. The port took roughly 30 minutes of focused work plus 30 minutes to write the learnings doc, of which the actual *adaptation* is small — a hook extraction and a prop on a shared component. Most of the time was spent in the translation matrix (F1–F3) and surfacing reuse opportunities (F4).

The skill, when it lands, can compress the translation matrix to seconds. The cross-module promotion check (F4) is the part that needs human judgement — and is exactly where the starter's architectural rules become valuable: they make the right answer obvious. *Promote the hook to `app/hooks/catalog/` because that's where the rules say catalog-shared hooks live.*

The doctrine survives this test.
