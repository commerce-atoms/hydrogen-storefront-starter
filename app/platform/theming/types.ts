/**
 * Optional per-collection theming.
 *
 * A `CollectionTheme` is a bag of CSS custom property overrides that scope
 * to a single collection page. When present, it re-declares a subset of the
 * global tokens in `app/styles/tokens.css` under the `[data-collection-theme]`
 * attribute selector. When absent, pages render with the global brand tokens.
 *
 * Adding a new themed collection is a Shopify metafield edit — no code change.
 * See `docs/reference/collection-theming.md`.
 */

/**
 * Design tokens that a collection is allowed to override.
 *
 * This list is intentionally a *subset* of the global tokens:
 * we override colours only. Typography, spacing, radii, motion, and layout
 * stay consistent across the whole storefront so navigation, cards, and
 * interactions remain recognisably "one storefront".
 */
export interface CollectionTheme {
  /** Page background — maps to `--color-background`. */
  background?: string;
  /** Card / panel surface — maps to `--color-surface`. */
  surface?: string;
  /** Secondary surface (inputs, alt panels) — maps to `--color-surface-secondary`. */
  surfaceSecondary?: string;
  /** Primary readable text — maps to `--color-text-primary`. */
  textPrimary?: string;
  /** Muted / caption text — maps to `--color-text-secondary`. */
  textSecondary?: string;
  /** Default border — maps to `--color-border`. */
  border?: string;
  /** Hairline / subtle divider — maps to `--color-border-light`. */
  borderLight?: string;
  /** Primary accent (CTAs, focus ring source) — maps to `--color-accent`. */
  accent?: string;
  /** Accent hover / active state — maps to `--color-accent-hover`. */
  accentHover?: string;
  /**
   * Secondary accent (badges, highlights, secondary CTAs) —
   * exposed as `--color-accent-secondary`. Not currently used by any
   * built-in component, but reserved so per-store CSS can consume it
   * without needing another round-trip.
   */
  accentSecondary?: string;
}

/**
 * Mapping from `CollectionTheme` field → CSS custom property name.
 *
 * Kept as data (not string interpolation in the renderer) so it is trivial
 * to grep, extend, and validate against `tokens.css`.
 */
export const THEME_TOKEN_MAP: Readonly<Record<keyof CollectionTheme, string>> =
  {
    background: '--color-background',
    surface: '--color-surface',
    surfaceSecondary: '--color-surface-secondary',
    textPrimary: '--color-text-primary',
    textSecondary: '--color-text-secondary',
    border: '--color-border',
    borderLight: '--color-border-light',
    accent: '--color-accent',
    accentHover: '--color-accent-hover',
    accentSecondary: '--color-accent-secondary',
  };

/**
 * Metafield namespace + keys the storefront reads from Shopify.
 *
 * The `key` is the underscored form of the `CollectionTheme` field name.
 * Keeping the mapping declarative lets the fragment + parser share one source
 * of truth.
 */
export const THEME_METAFIELD_NAMESPACE = 'theme' as const;

export const THEME_METAFIELD_KEYS: Readonly<
  Record<keyof CollectionTheme, string>
> = {
  background: 'background',
  surface: 'surface',
  surfaceSecondary: 'surface_secondary',
  textPrimary: 'text_primary',
  textSecondary: 'text_secondary',
  border: 'border',
  borderLight: 'border_light',
  accent: 'accent',
  accentHover: 'accent_hover',
  accentSecondary: 'accent_secondary',
};

/**
 * Minimal shape of a metafield value returned by the Storefront API.
 * We depend only on `namespace`, `key`, and `value` so the parser stays
 * decoupled from generated GraphQL types.
 */
export interface ThemeMetafieldSource {
  namespace: string;
  key: string;
  value: string;
}
