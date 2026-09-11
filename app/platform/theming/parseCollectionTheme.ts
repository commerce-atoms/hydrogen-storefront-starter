import {getMetafieldValue} from '@commerce-atoms/metafield/metafields/getMetafieldValue';

import {
  THEME_METAFIELD_KEYS,
  THEME_METAFIELD_NAMESPACE,
  type CollectionTheme,
  type ThemeMetafieldSource,
} from './types';

/**
 * Values that come through the Storefront API are attacker-controlled from
 * the merchant admin's perspective. We inline them into a `<style>` block,
 * so we MUST refuse anything that could break out of a CSS declaration.
 *
 * Accepted forms:
 *   - Hex:            `#rgb`, `#rrggbb`, `#rrggbbaa`
 *   - Functional:     `rgb(...)`, `rgba(...)`, `hsl(...)`, `hsla(...)`,
 *                     `oklab(...)`, `oklch(...)`, `color(...)`
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
 * Read `themeMetafields` (the alias created by `COLLECTION_THEME_FRAGMENT`)
 * and produce a strongly typed `CollectionTheme`, or `null` if the collection
 * has no theme configured.
 *
 * A value is included only if:
 *   1. the metafield is present and non-empty
 *   2. its value passes `isSafeCssColor`
 *
 * Rejected values are silently dropped — merchants get an unstyled token
 * instead of a broken page. Consider logging in a store fork if you want
 * feedback in the admin.
 */
export function parseCollectionTheme(
  themeMetafields:
    | ReadonlyArray<ThemeMetafieldSource | null | undefined>
    | null
    | undefined,
): CollectionTheme | null {
  if (!themeMetafields || themeMetafields.length === 0) return null;

  // `getMetafieldValue` from `@commerce-atoms/metafield` expects an owner
  // shape (`{metafields: [...]}`). Normalise `undefined` entries to `null`
  // to satisfy `MetafieldOwnerLike`.
  const owner = {
    metafields: themeMetafields.map((m) => m ?? null),
  };

  const theme: CollectionTheme = {};
  let matched = 0;

  for (const [field, key] of Object.entries(THEME_METAFIELD_KEYS) as Array<
    [keyof CollectionTheme, string]
  >) {
    const raw = getMetafieldValue<string>(
      owner,
      THEME_METAFIELD_NAMESPACE,
      key,
    );
    if (typeof raw !== 'string') continue;

    const trimmed = raw.trim();
    if (!isSafeCssColor(trimmed)) continue;

    theme[field] = trimmed;
    matched += 1;
  }

  return matched > 0 ? theme : null;
}
