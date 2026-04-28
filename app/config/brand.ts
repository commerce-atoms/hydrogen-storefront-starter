// Per-store brand configuration.
//
// Per `rules/stores.md` (in @commerce-atoms/agents), 100% of per-store
// divergence in copy, identity, palette, and typography lives here and in
// `app/assets/brand/`. No hardcoded brand strings outside these two locations.
//
// Forks customise this file freely. Upstream PRs into the starter MUST keep
// values neutral / placeholder so forks always inherit a clean baseline.

export interface BrandConfig {
  /** Display name. Used in title tags, footer, OG defaults. */
  name: string;
  /** Short tagline. Used in OG description, footer, hero fallbacks. */
  slogan: string;
  /** Customer-facing contact email. */
  contactEmail: string;
  /** Default locale (BCP-47). */
  defaultLocale: string;
  /** All locales the storefront serves. Used by the locale prefix in routes.ts. */
  supportedLocales: string[];
  /** Theme colour tokens. Mirrored in app/assets/brand/tokens.css for runtime CSS variables. */
  colours: {
    primary: string;
    accent: string;
    background: string;
    foreground: string;
  };
  /** Font stacks. Reference web fonts loaded by the app shell. */
  fonts: {
    heading: string;
    body: string;
  };
  /** Social handles (without `@`). Used in OG metadata and footer links. */
  social: {
    twitter?: string;
    instagram?: string;
    tiktok?: string;
  };
}

export const brand: BrandConfig = {
  name: 'Hydrogen Storefront',
  slogan: 'A scalable, module-driven Shopify storefront.',
  contactEmail: 'hello@example.com',
  defaultLocale: 'en-US',
  supportedLocales: ['en-US'],
  colours: {
    primary: '#000000',
    accent: '#ff3366',
    background: '#ffffff',
    foreground: '#0a0a0a',
  },
  fonts: {
    heading: 'system-ui, -apple-system, sans-serif',
    body: 'system-ui, -apple-system, sans-serif',
  },
  social: {},
};
