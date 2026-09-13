import {THEME_TOKEN_MAP, type Theme} from './types';

/**
 * The attribute used to scope the collection theme.
 *
 * Only Collections use this component today; when PDPs, Pages, or the Shop
 * default need theming, add a matching attribute (e.g. `data-page-theme`)
 * and thread it here rather than repurposing this one.
 *
 * Always present on the wrapper. Exported so store forks can write theme-aware
 * CSS in their own stylesheets, e.g.:
 *
 *   [data-collection-theme="new-arrivals"] .my-hero { ... }
 */
export const COLLECTION_THEME_ATTR = 'data-collection-theme';

interface ThemeStyleProps {
  /** Parsed theme, or `null` for the global default. */
  theme: Theme | null;
  /**
   * Collection handle used as the attribute value. Purely informational for
   * devtools / per-handle store CSS. The scoping mechanism is attribute
   * presence, not value.
   */
  handle: string;
  /** Wrapped page content. Rendered whether or not a theme is present. */
  children: React.ReactNode;
}

/**
 * SSR-safe wrapper that applies a theme via a scoped `<style>` block plus
 * `data-collection-theme` on the wrapper element.
 *
 * When `theme` is `null`, this component still renders the wrapper (so
 * downstream CSS can rely on the attribute being present) but skips the
 * `<style>` block entirely. The page inherits the global tokens from
 * `app/styles/tokens.css`.
 *
 * Values are validated by `parseTheme` before reaching here, so inlining
 * them into a `<style>` cannot be used as a CSS injection vector.
 */
export function ThemeStyle({theme, handle, children}: ThemeStyleProps) {
  const css = theme ? buildThemeCss(theme) : '';

  return (
    <div {...{[COLLECTION_THEME_ATTR]: handle}}>
      {css ? <style>{css}</style> : null}
      {children}
    </div>
  );
}

function buildThemeCss(theme: Theme): string {
  const declarations: string[] = [];

  for (const [field, cssVar] of Object.entries(THEME_TOKEN_MAP) as Array<
    [keyof Theme, string]
  >) {
    const value = theme[field];
    if (!value) continue;
    declarations.push(`  ${cssVar}: ${value};`);
  }

  if (declarations.length === 0) return '';

  return `[${COLLECTION_THEME_ATTR}] {\n${declarations.join('\n')}\n}`;
}
