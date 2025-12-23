import {useEffect} from 'react';
import {useSearchParams} from 'react-router';

import {selectedOptionsToUrlParams} from '@commerce-atoms/variants/selectedOptionsToUrlParams';

import type {ProductVariantFragment} from 'storefrontapi.generated';

export function useVariantUrlSync(
  selectedVariant: ProductVariantFragment | null | undefined,
  optionNames: string[],
) {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    // Only sync once on mount if no search params exist
    if (searchParams.toString() === '' && selectedVariant) {
      const params = selectedOptionsToUrlParams(
        selectedVariant.selectedOptions,
        optionNames,
      );
      setSearchParams(params, {replace: true});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount
}
