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
// Disabling a flag requires three edits so the pruning is consistent:
//   1. Set the flag to `false` here.
//   2. Delete the module folder (e.g. `app/modules/search/`). Leaving it
//      in place fails typecheck because `react-router typegen` no longer
//      emits the module's route types, but its source files still import
//      them (e.g. `./+types/search.route`).
//   3. Remove UI entry points for the disabled feature (header/footer
//      links, aside components, etc.).

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
