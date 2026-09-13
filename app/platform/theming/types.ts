/**
 * Optional storefront theming.
 *
 * A `Theme` is a bag of CSS custom property overrides. Any owner type that
 * carries a `theme.preset` metafield can select a palette (Shopify
 * Metaobject of type `theme_palette`); adding a themed entity is a dropdown
 * change in admin, no code change.
 *
 * Today only Collections consume this module. The metaobject, parser, and
 * `Theme` type are owner-agnostic. When PDPs, Pages, or the Shop default
 * need theming, add the matching per-owner fragment (see
 * `collectionThemeFragment.ts` for the template) and a resolution helper.
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
export interface Theme {
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
 * Mapping from `Theme` field to CSS custom property name.
 *
 * Kept as data (not string interpolation in the renderer) so it is trivial
 * to grep, extend, and validate against `tokens.css`.
 */
export const THEME_TOKEN_MAP: Readonly<Record<keyof Theme, string>> =
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
 * Metafield identifiers for the palette reference. Currently only used on
 * `Collection`; the same namespace and key work on any owner type when we
 * add per-owner fragments.
 */
export const THEME_PRESET_METAFIELD = {
  namespace: 'theme',
  key: 'preset',
} as const;

/**
 * Mapping from `Theme` field to metaobject field key (snake_case matches
 * Shopify's convention for metaobject field keys). Both the setup script
 * and the parser use this list, so palette schema stays in one place.
 */
export const THEME_PALETTE_FIELD_MAP: Readonly<
  Record<keyof Theme, string>
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
    fields?: ReadonlyArray<MetaobjectFieldSource | null> | null;
  } | null;
}
