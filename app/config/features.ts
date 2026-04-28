// Feature flags for optional storefront modules.
//
// Per `rules/stores.md` in @commerce-atoms/agents, optional modules are gated
// behind a flag here. When a flag is `false`, the corresponding routes in
// `app/routes.ts` are not registered and the build excludes the module's code.
//
// Flags are static (compile-time). Do not flip them at runtime — the goal is
// build-time pruning, not feature-gating live traffic.

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
