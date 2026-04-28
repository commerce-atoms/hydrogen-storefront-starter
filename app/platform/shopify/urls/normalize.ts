/**
 * Normalizes URLs from Shopify Storefront API for Hydrogen routing.
 *
 * Handles:
 * - Stripping `.myshopify.com` domains from internal URLs
 * - Mapping `/pages/*` routes to clean paths (e.g., `/pages/about` → `/en-gb/about`)
 * - Preserving locale prefixes if present
 * - Prepending locale to paths without locale (for canonical locale-prefixed URLs)
 * - Preserving external URLs
 *
 * Reusable for:
 * - Menu items (header, footer)
 * - CMS content links
 * - Metaobject links
 * - Rich text editor links
 *
 * @param url - The URL from Shopify (menu item, CMS, metaobject, etc.)
 * @param storeDomain - The store domain (e.g., "doctor-undefined-dev.myshopify.com")
 * @param locale - Optional locale (e.g., "en-gb"). If provided, prepends to paths without locale.
 * @returns Normalized URL path for Hydrogen routing, or original URL if external
 */
export function normalizeShopifyUrl(
  url: string,
  storeDomain: string,
  locale?: string,
): string {
  if (!url) return url;

  // Handle relative paths (already clean)
  if (url.startsWith('/') && !url.startsWith('//')) {
    return mapPagePath(url, locale);
  }

  try {
    const parsedUrl = new URL(url);

    // Check if URL is from the same store domain
    if (parsedUrl.hostname.includes(storeDomain)) {
      // Extract path and normalize
      const path = `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
      return mapPagePath(path, locale);
    }

    // External URL - return as-is
    return url;
  } catch {
    // If URL parsing fails, assume it's already a relative path
    return mapPagePath(url, locale);
  }
}

/**
 * Maps Shopify page paths to clean Hydrogen routes.
 *
 * Examples:
 * - `/pages/about` → `/en-gb/about` (with locale prepended if provided)
 * - `/en-gb/pages/about` → `/en-gb/about` (locale preserved)
 * - `/en-gb/products/snowboard` → `/en-gb/products/snowboard` (unchanged)
 * - `/about` → `/en-gb/about` (locale prepended if provided and path has no locale)
 *
 * Note: Locale prefixes are preserved if present. If locale is provided and path has no locale,
 * it will be prepended to ensure canonical locale-prefixed URLs.
 *
 * @param path - The path to map
 * @param locale - Optional locale to prepend if path has no locale (e.g., "en-gb")
 * @returns Mapped path with pages normalized and locale ensured
 */
function mapPagePath(path: string, locale?: string): string {
  // Check if path already has a locale prefix (including just locale like /en-gb)
  const hasLocale = /^\/[a-z]{2}(-[a-z]{2})?(\/|$)/i.test(path);
  const localePrefix = hasLocale ? '' : locale ? `/${locale}` : '';

  // Map /pages/* to clean paths
  const pageMatch = path.match(/^(\/[a-z]{2}(-[a-z]{2})?)?\/pages\/([^/?]+)/i);
  if (pageMatch) {
    const existingLocalePrefix = pageMatch[1] || ''; // e.g., '/en-gb' or ''
    const pageHandle = pageMatch[3];
    // Extract query string and hash if present
    const rest = path.slice(
      (existingLocalePrefix + `/pages/${pageHandle}`).length,
    );
    const finalLocalePrefix = existingLocalePrefix || localePrefix;
    return `${finalLocalePrefix}/${pageHandle}${rest}`;
  }

  // If path has no locale and locale is provided, prepend it
  if (!hasLocale && locale) {
    // Handle home path specially
    if (path === '/') {
      return `/${locale}`;
    }
    return `${localePrefix}${path}`;
  }

  // Return path as-is (locale already present or no locale needed)
  return path;
}
