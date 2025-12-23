import {
  type RouteConfig,
  route,
  layout,
  index,
  prefix,
} from '@react-router/dev/routes';

import {hydrogenRoutes} from '@shopify/hydrogen';

/**
 * Explicit route manifest for hydrogen-storefront-base
 *
 * All routes are defined explicitly here. No filesystem-based route discovery.
 * Layout routes nest UI pages. Resource routes (robots, sitemap, api) are outside layout.
 */
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

  // Predictive search endpoint
  route('api/search-suggest', 'platform/routing/search-suggest.route.tsx'),

  // ═══════════════════════════════════════════════════════════════════════════
  // LOCALE-PREFIXED ROUTES
  // ═══════════════════════════════════════════════════════════════════════════

  // Optional locale prefix (e.g., /en-us/products/...)
  ...prefix(':locale?', [
    // Locale validation layout
    layout('platform/routing/locale.route.tsx', [
      // ─────────────────────────────────────────────────────────────────────────
      // HOME
      // ─────────────────────────────────────────────────────────────────────────
      index('modules/home/home.route.tsx'),

      // ─────────────────────────────────────────────────────────────────────────
      // PRODUCTS
      // ─────────────────────────────────────────────────────────────────────────
      route('products/:handle', 'modules/products/product-handle.route.tsx'),

      // ─────────────────────────────────────────────────────────────────────────
      // COLLECTIONS
      // ─────────────────────────────────────────────────────────────────────────
      route('collections', 'modules/collections/collections-index.route.tsx'),
      route('collections/all', 'modules/collections/collections-all.route.tsx'),
      route(
        'collections/:handle',
        'modules/collections/collection-handle.route.tsx',
      ),

      // ─────────────────────────────────────────────────────────────────────────
      // CART
      // ─────────────────────────────────────────────────────────────────────────
      route('cart', 'modules/cart/cart.route.tsx'),
      route('cart/:lines', 'modules/cart/cart-lines.route.tsx'),

      // ─────────────────────────────────────────────────────────────────────────
      // SEARCH
      // ─────────────────────────────────────────────────────────────────────────
      route('search', 'modules/search/search.route.tsx'),

      // ─────────────────────────────────────────────────────────────────────────
      // POLICIES
      // ─────────────────────────────────────────────────────────────────────────
      route('policies', 'modules/policies/policies-index.route.tsx'),
      route('policies/:handle', 'modules/policies/policy-handle.route.tsx'),

      // ─────────────────────────────────────────────────────────────────────────
      // PAGES
      // ─────────────────────────────────────────────────────────────────────────
      route('pages/:handle', 'modules/pages/page-handle.route.tsx'),

      // ─────────────────────────────────────────────────────────────────────────
      // BLOGS
      // ─────────────────────────────────────────────────────────────────────────
      route('blogs', 'modules/blogs/blogs-index.route.tsx'),
      route('blogs/:blogHandle', 'modules/blogs/blog-handle.route.tsx'),
      route(
        'blogs/:blogHandle/:articleHandle',
        'modules/blogs/article-handle.route.tsx',
      ),

      // ─────────────────────────────────────────────────────────────────────────
      // DISCOUNT
      // ─────────────────────────────────────────────────────────────────────────
      route('discount/:code', 'modules/cart/discount.route.tsx'),

      // ─────────────────────────────────────────────────────────────────────────
      // ACCOUNT ROUTES - Not implemented (requires Customer Account API setup)
      // To add account functionality, follow Shopify's Customer Account API docs:
      // https://shopify.dev/docs/custom-storefronts/building-with-the-customer-account-api/hydrogen
      // ─────────────────────────────────────────────────────────────────────────

      // ─────────────────────────────────────────────────────────────────────────
      // CATCH-ALL (404)
      // ─────────────────────────────────────────────────────────────────────────
      route('*', 'platform/routing/catchall.route.tsx'),
    ]),
  ]),
]) satisfies RouteConfig;
