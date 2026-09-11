import {
  THEME_METAOBJECT_TYPE,
  THEME_PALETTE_FIELD_MAP,
  type CollectionTheme,
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
 * Resolve a `theme.preset` metafield reference into a typed `CollectionTheme`,
 * or `null` if the collection has no palette assigned (or the assigned
 * palette contains no usable values).
 *
 * A value is included only if:
 *   1. the metaobject field is present and non-empty
 *   2. its value passes `isSafeCssColor`
 *
 * Rejected values are silently dropped — merchants get an unstyled token
 * instead of a broken page.
 */
export function parseCollectionTheme(
  themePreset: ThemePresetSource | null | undefined,
): CollectionTheme | null {
  const metaobject = themePreset?.reference;
  if (!metaobject) return null;

  // Defence-in-depth: the fragment already scopes to `theme_palette`, but if
  // the metafield is repointed at a different metaobject type via admin the
  // parser must still bail cleanly.
  if (metaobject.type && metaobject.type !== THEME_METAOBJECT_TYPE) {
    return null;
  }

  const fields = metaobject.fields;
  if (!fields || fields.length === 0) return null;

  const byKey = new Map<string, string>();
  for (const field of fields) {
    if (!field?.key) continue;
    if (typeof field.value !== 'string') continue;
    byKey.set(field.key, field.value);
  }

  const theme: CollectionTheme = {};
  let matched = 0;

  for (const [themeKey, fieldKey] of Object.entries(
    THEME_PALETTE_FIELD_MAP,
  ) as Array<[keyof CollectionTheme, string]>) {
    const raw = byKey.get(fieldKey);
    if (typeof raw !== 'string') continue;

    const trimmed = raw.trim();
    if (!isSafeCssColor(trimmed)) continue;

    theme[themeKey] = trimmed;
    matched += 1;
  }

  return matched > 0 ? theme : null;
}
