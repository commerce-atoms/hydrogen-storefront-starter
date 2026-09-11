import {useNavigate, useSearchParams, useLocation} from 'react-router';

import {patchSearchParams} from '@commerce-atoms/urlstate/patchSearchParams';

import type {SearchSchema} from '@commerce-atoms/urlstate/types/schema';
import type {SearchState} from '@commerce-atoms/urlstate/types/searchState';

/**
 * Update the URL search state and navigate in one call.
 *
 * Wraps the common pattern of patching the current search params against a
 * `SearchSchema` and pushing the result via `useNavigate`. Unknown params
 * are preserved.
 *
 * @example
 * const updateSearchState = useSearchStateNavigation(schema);
 * updateSearchState({page: 2});
 */
export function useSearchStateNavigation(schema: SearchSchema) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  return (newState: SearchState) => {
    const updatedParams = patchSearchParams(searchParams, newState, schema, {
      preserveUnknownParams: true,
    });
    void navigate(
      {
        pathname: location.pathname,
        search: updatedParams.toString(),
      },
      {replace: false},
    );
  };
}
