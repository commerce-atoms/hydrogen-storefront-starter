import {useMemo} from 'react';

import {findVariant} from '@shoppy/variants/findVariant';
import {pickDefaultVariant} from '@shoppy/variants/pickDefaultVariant';

import type {SelectedOption} from '@shopify/hydrogen/storefront-api-types';
import type {ProductFragment} from 'storefrontapi.generated';

export function useDefaultVariant(
  product: ProductFragment,
  selectedOptions: SelectedOption[],
) {
  return useMemo(() => {
    // Find variant based on URL selection or pick default
    const variantResult =
      selectedOptions.length > 0
        ? findVariant(product, selectedOptions)
        : {found: false as const, variant: null, reason: 'INCOMPLETE' as const};

    return variantResult.found
      ? variantResult.variant
      : pickDefaultVariant(product, 'first-available') ||
          product.variants.nodes[0];
  }, [product, selectedOptions]);
}
