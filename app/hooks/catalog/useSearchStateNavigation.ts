import {useNavigate, useSearchParams, useLocation} from 'react-router';

import {patchSearchParams} from '@commerce-atoms/urlstate/patchSearchParams';

import type {SearchSchema} from '@commerce-atoms/urlstate/types/schema';
import type {SearchState} from '@commerce-atoms/urlstate/types/searchState';

/**
 * Hook to simplify the common pattern of updating search state and navigating.
 * Reduces boilerplate: update state -> patch params -> navigate
 *
 * @example
 * ```ts
 * const updateSearchState = useSearchStateNavigation(schema);
 * updateSearchState(newState);
 * ```
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
