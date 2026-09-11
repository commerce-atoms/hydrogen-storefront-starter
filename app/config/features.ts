// Feature flags for optional storefront modules.
//
// Per `rules/stores.md` in @commerce-atoms/agents, optional modules are gated
// behind a flag here. When a flag is `false`, the corresponding routes in
// `app/routes.ts` are not registered and Vite tree-shakes the module's code
// out of the build.
//
// Flags are static (compile-time). Do not flip them at runtime — the goal is
// build-time pruning, not feature-gating live traffic.
//
// ⚠️ Turning a flag off is NOT a one-line change. It requires three edits in
//    the fork so the pruning is consistent end-to-end:
//
//    1. Set the flag to `false` here. Routes stop registering.
//    2. **Delete the module folder** (e.g. `app/modules/search/`). Leaving
//       it in place fails typecheck because `react-router typegen` no longer
//       emits the module's route types, but its source files still import
//       them (e.g. `./+types/search.route`).
//    3. Remove the UI entry points that point at the disabled feature:
//       - enableSearch → `Header` search icon, `SearchAside`, footer search links
//       - enableBlog → any blog links in menus / footers
//       - enableCollections → collection nav, "Shop all" links
//       - enablePolicies → footer policy links
//       - enableAccount → header "Account" CTA (not yet implemented)

export interface FeatureFlags {
  /** Search module — `/search` + predictive search endpoint. */
  enableSearch: boolean;
  /** Blog module — `/blogs/*`. */
  enableBlog: boolean;
  /** Collections module — `/collections/*`. */
  enableCollections: boolean;
  /** Policies module — `/policies/*`. */
  enablePolicies: boolean;
  /** Customer Account routes — `/account/*`. */
  enableAccount: boolean;
}

export const features: FeatureFlags = {
  enableSearch: true,
  enableBlog: true,
  enableCollections: true,
  enablePolicies: true,
  enableAccount: true,
};
