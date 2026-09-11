/**
 * Optional per-collection theming.
 *
 * A `CollectionTheme` is a bag of CSS custom property overrides that scope
 * to a single collection page. When present, it re-declares a subset of the
 * global tokens in `app/styles/tokens.css` under the `[data-collection-theme]`
 * attribute selector. When absent, pages render with the global brand tokens.
 *
 * Palettes are modelled as Shopify Metaobjects of type `theme_palette`, and
 * a Collection selects a palette via the `theme.preset` metafield (a
 * `metaobject_reference`). Adding a new themed collection is a dropdown
 * change in Shopify admin — no code change.
 *
 * See `docs/reference/collection-theming.md`.
 */

/**
 * Design tokens a palette is allowed to override.
 *
 * Intentionally a *subset* of the global tokens: colours only. Typography,
 * spacing, radii, motion, and layout stay consistent across the whole
 * storefront so navigation, cards, and interactions remain recognisably
 * "one storefront".
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
 * Metaobject type the storefront resolves for palettes. Must match the type
 * created by `scripts/setup-theming.mjs` (or provisioned by hand in admin).
 */
export const THEME_METAOBJECT_TYPE = 'theme_palette' as const;

/**
 * Collection metafield identifiers for the palette reference. One value per
 * collection: which palette to apply.
 */
export const THEME_PRESET_METAFIELD = {
  namespace: 'theme',
  key: 'preset',
} as const;

/**
 * Mapping from `CollectionTheme` field → metaobject field key (snake_case
 * matches Shopify's convention for metaobject field keys). Both the setup
 * script and the parser use this list, so palette schema stays in one place.
 */
export const THEME_PALETTE_FIELD_MAP: Readonly<
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
 * Minimal shape of a metaobject field returned by the Storefront API.
 * The parser depends only on `key` and `value`, so it stays decoupled from
 * generated GraphQL types.
 */
export interface MetaobjectFieldSource {
  key: string;
  value?: string | null;
}

/**
 * Minimal shape of the `themePreset` metafield with its resolved
 * `metaobject_reference`.
 */
export interface ThemePresetSource {
  reference?: {
    type?: string | null;
    handle?: string | null;
    fields?: ReadonlyArray<MetaobjectFieldSource | null | undefined>;
  } | null;
}
