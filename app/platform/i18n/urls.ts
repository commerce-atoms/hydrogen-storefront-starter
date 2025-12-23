import {selectedOptionsToUrlParams} from '@shoppy/variants/selectedOptionsToUrlParams';

import type {SelectedOption} from '@shopify/hydrogen/storefront-api-types';

/**
 * Builds a product URL with optional variant selection parameters.
 * Preserves locale prefix from pathname if present.
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
  const match = /(\/[a-zA-Z]{2}-[a-zA-Z]{2}\/)/g.exec(pathname);
  const isLocalePathname = match && match.length > 0;

  const path = isLocalePathname
    ? `${match![0]}products/${handle}`
    : `/products/${handle}`;

  // Use @shoppy/variants for URL serialization
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
