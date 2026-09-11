// SYNCED FROM @commerce-atoms/hydrogen-storefront-starter — modify upstream, never in this fork.
// See docs/core-vs-app.md.

import {
  type RouteConfig,
  type RouteConfigEntry,
  route,
  layout,
  index,
  prefix,
} from '@react-router/dev/routes';

import {hydrogenRoutes} from '@shopify/hydrogen';

import {features} from './config/features';

/**
 * Explicit route manifest for hydrogen-storefront-base
 *
 * All routes are defined explicitly here. No filesystem-based route discovery.
 * Layout routes nest UI pages. Resource routes (robots, sitemap, api) are outside layout.
 *
 * Route inclusion is gated by `app/config/features.ts`. Flipping a flag to
 * `false` prunes the corresponding routes from the build. Note that UI entry
 * points (header search icon, footer menu items, etc.) are NOT auto-pruned —
 * remove those from the layout components in your fork when you disable a
 * feature.
 */
function optional<T>(enabled: boolean, entries: T[]): T[] {
  return enabled ? entries : [];
}

const siteRoutes: RouteConfigEntry[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // HOME
  // ─────────────────────────────────────────────────────────────────────────
  index('modules/home/home.route.tsx'),

  // ─────────────────────────────────────────────────────────────────────────
  // PRODUCTS
  // ─────────────────────────────────────────────────────────────────────────
  route('products/:handle', 'modules/products/product-handle.route.tsx'),

  // ─────────────────────────────────────────────────────────────────────────
  // COLLECTIONS (features.enableCollections)
  // ─────────────────────────────────────────────────────────────────────────
  ...optional(features.enableCollections, [
    route('collections', 'modules/collections/collections-index.route.tsx'),
    route('collections/all', 'modules/collections/collections-all.route.tsx'),
    route(
      'collections/:handle',
      'modules/collections/collection-handle.route.tsx',
    ),
  ]),

  // ─────────────────────────────────────────────────────────────────────────
  // CART
  // ─────────────────────────────────────────────────────────────────────────
  route('cart', 'modules/cart/cart.route.tsx'),
  route('cart/:lines', 'modules/cart/cart-lines.route.tsx'),

  // ─────────────────────────────────────────────────────────────────────────
  // SEARCH (features.enableSearch)
  // ─────────────────────────────────────────────────────────────────────────
  ...optional(features.enableSearch, [
    route('search', 'modules/search/search.route.tsx'),
  ]),

  // ─────────────────────────────────────────────────────────────────────────
  // POLICIES (features.enablePolicies)
  // ─────────────────────────────────────────────────────────────────────────
  ...optional(features.enablePolicies, [
    route('policies', 'modules/policies/policies-index.route.tsx'),
    route('policies/:handle', 'modules/policies/policy-handle.route.tsx'),
  ]),

  // ─────────────────────────────────────────────────────────────────────────
  // PAGES
  // ─────────────────────────────────────────────────────────────────────────
  route('pages/:handle', 'modules/pages/page-handle.route.tsx'),

  // ─────────────────────────────────────────────────────────────────────────
  // BLOGS (features.enableBlog)
  // ─────────────────────────────────────────────────────────────────────────
  ...optional(features.enableBlog, [
    route('blogs', 'modules/blogs/blogs-index.route.tsx'),
    route('blogs/:blogHandle', 'modules/blogs/blog-handle.route.tsx'),
    route(
      'blogs/:blogHandle/:articleHandle',
      'modules/blogs/article-handle.route.tsx',
    ),
  ]),

  // ─────────────────────────────────────────────────────────────────────────
  // DISCOUNT
  // ─────────────────────────────────────────────────────────────────────────
  route('discount/:code', 'modules/cart/discount.route.tsx'),

  // ─────────────────────────────────────────────────────────────────────────
  // ACCOUNT ROUTES (features.enableAccount) — Not implemented yet
  // Requires Customer Account API setup:
  // https://shopify.dev/docs/custom-storefronts/building-with-the-customer-account-api/hydrogen
  // ─────────────────────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────────────────────
  // CATCH-ALL (404)
  // ─────────────────────────────────────────────────────────────────────────
  route('*', 'platform/routing/catchall.route.tsx'),
];

export default hydrogenRoutes([
  // ═══════════════════════════════════════════════════════════════════════════
  // RESOURCE ROUTES (outside layout - no shell chrome)
  // ═══════════════════════════════════════════════════════════════════════════

  // robots.txt
  route('robots.txt', 'platform/routing/robots.route.tsx'),

  // sitemap index
  route('sitemap.xml', 'platform/routing/sitemap-index.route.tsx'),

  // sitemap pages
  route('sitemap/:type/:page.xml', 'platform/routing/sitemap.route.tsx'),

  // GraphQL API proxy
  route('api/:version/graphql.json', 'platform/routing/graphql-api.route.tsx'),

  // Predictive search endpoint (gated by features.enableSearch)
  ...optional(features.enableSearch, [
    route('api/search-suggest', 'modules/search/search-suggest.route.tsx'),
  ]),

  // ═══════════════════════════════════════════════════════════════════════════
  // LOCALE-PREFIXED ROUTES
  // ═══════════════════════════════════════════════════════════════════════════

  // Optional locale prefix (e.g., /en-us/products/...)
  ...prefix(':locale?', [
    // Locale validation layout wraps all site routes
    layout('platform/routing/locale.route.tsx', siteRoutes),
  ]),
]) satisfies RouteConfig;
