import {selectedOptionsToUrlParams} from '@commerce-atoms/variants/selectedOptionsToUrlParams';

import type {SelectedOption} from '@shopify/hydrogen/storefront-api-types';

/**
 * Returns the canonical storefront origin for absolute URLs.
 * - Prefers PUBLIC_STORE_FRONTEND_DOMAIN when set (for SEO correctness)
 * - Falls back to the request origin (local dev / preview)
 *
 * Used for canonical URLs, sitemaps, robots.txt, and Open Graph/Twitter card URLs.
 * This function is server-only (Request objects don't serialize to client).
 */
export function getStorefrontOrigin(request: Request, env: Env): string {
  const configured = env.PUBLIC_STORE_FRONTEND_DOMAIN?.trim();

  if (configured) {
    const withScheme =
      configured.startsWith('http://') || configured.startsWith('https://')
        ? configured
        : `https://${configured}`;

    return withScheme.replace(/\/+$/, '');
  }

  // Fallback: derive from request URL (server-side only)
  return new URL(request.url).origin;
}

/**
 * Builds an absolute URL from a relative path (e.g. /en-us/products/x).
 * Uses getStorefrontOrigin() to ensure SEO-correct canonical URLs.
 * Normalizes paths to ensure they start with `/`.
 */
export function toAbsoluteUrl(
  path: string,
  request: Request,
  env: Env,
): string {
  const origin = getStorefrontOrigin(request, env);
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalized, origin).toString();
}

/**
 * Builds a product URL with optional variant selection parameters.
 * Preserves locale prefix from pathname if present.
 * Returns a relative path (for internal navigation).
 */
export function buildProductUrl({
  handle,
  pathname,
  selectedOptions,
}: {
  handle: string;
  pathname: string;
  selectedOptions?: SelectedOption[];
}): string {
  // Match locale prefix at start of pathname (with or without trailing slash)
  const match = /^\/([a-zA-Z]{2}-[a-zA-Z]{2})(\/|$)/.exec(pathname);
  const pathPrefix = match ? `/${match[1]}` : '';

  const path = pathPrefix
    ? `${pathPrefix}/products/${handle}`
    : `/products/${handle}`;

  // Use @commerce-atoms/variants for URL serialization
  const params = selectedOptions
    ? selectedOptionsToUrlParams(selectedOptions)
    : new URLSearchParams();

  const searchString = params.toString();

  return path + (searchString ? '?' + searchString : '');
}

/**
 * Get a simple product URL without variant selection
 * For use in components that don't need variant-specific URLs
 */
export function getProductUrl(handle: string, pathname = ''): string {
  return buildProductUrl({handle, pathname, selectedOptions: undefined});
}
