import {useMemo} from 'react';
import {useLocation} from 'react-router';

import {buildProductUrl} from '@platform/i18n/urls';

import type {SelectedOption} from '@shopify/hydrogen/storefront-api-types';

/**
 * Product-specific hook for building variant URLs with current pathname
 * Uses platform utility for the core logic
 */
export function useVariantUrl(
  handle: string,
  selectedOptions?: SelectedOption[],
) {
  const {pathname} = useLocation();

  return useMemo(() => {
    return buildProductUrl({
      handle,
      pathname,
      selectedOptions,
    });
  }, [handle, selectedOptions, pathname]);
}
