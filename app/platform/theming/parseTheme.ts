import {getMetaobjectString} from '@commerce-atoms/metafield/metaobjects/getMetaobjectString';

import {
  THEME_METAOBJECT_TYPE,
  THEME_PALETTE_FIELD_MAP,
  type Theme,
  type ThemePresetSource,
} from './types';

/**
 * Values reach the parser through the Storefront API and are
 * merchant-authored, therefore untrusted. They are inlined into an
 * SSR-rendered `<style>` block, so anything that could break out of a CSS
 * declaration must be refused.
 *
 * Accepted forms:
 *   - Hex:               `#rgb`, `#rrggbb`, `#rrggbbaa`
 *   - Functional:        `rgb(...)`, `rgba(...)`, `hsl(...)`, `hsla(...)`,
 *                        `oklab(...)`, `oklch(...)`, `color(...)`
 *   - Named CSS colours: `black`, `tomato`, `rebeccapurple`, `currentColor`
 *
 * Anything containing `;`, `{`, `}`, `<`, `>`, `@`, backticks, or newlines
 * is rejected outright even if it also matches one of the shapes above.
 */
const CSS_COLOR_RE =
  /^(#[0-9a-fA-F]{3,8}|(?:rgba?|hsla?|oklab|oklch|color)\([^;{}<>@`\r\n]*\)|[a-zA-Z]{2,32})$/;

const DANGEROUS_CHARS_RE = /[;{}<>@`\r\n]/;

function isSafeCssColor(value: string): boolean {
  if (DANGEROUS_CHARS_RE.test(value)) return false;
  if (value.length > 128) return false;
  return CSS_COLOR_RE.test(value.trim());
}

/**
 * Resolve a `theme.preset` metafield reference into a typed `Theme`, or
 * `null` when no palette is assigned or none of its values are safe.
 *
 * Owner-agnostic. Rejected values are dropped silently.
 */
export function parseTheme(
  themePreset: ThemePresetSource | null | undefined,
): Theme | null {
  const metaobject = themePreset?.reference;
  if (!metaobject) return null;

  // Bail if the metafield points at a different metaobject type. Accepts
  // both the bare merchant-owned form (`store_theme_preset`) and the
  // app-owned expansion Shopify returns for `$app:`-prefixed types
  // (`app--<client-id>--store_theme_preset`).
  if (
    metaobject.type &&
    metaobject.type !== THEME_METAOBJECT_TYPE &&
    !metaobject.type.endsWith(`--${THEME_METAOBJECT_TYPE}`)
  ) {
    return null;
  }

  const theme: Theme = {};
  let matched = 0;

  for (const [themeKey, fieldKey] of Object.entries(
    THEME_PALETTE_FIELD_MAP,
  ) as Array<[keyof Theme, string]>) {
    const value = getMetaobjectString(metaobject, fieldKey);
    if (value === null) continue;
    if (!isSafeCssColor(value)) continue;

    theme[themeKey] = value;
    matched += 1;
  }

  return matched > 0 ? theme : null;
}
