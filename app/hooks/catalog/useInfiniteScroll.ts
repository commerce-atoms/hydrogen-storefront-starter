import {useEffect} from 'react';

import {useInView} from 'react-intersection-observer';

interface UseInfiniteScrollOptions {
  /** Whether infinite scroll is currently active. Disable for paged-only mode. */
  enabled: boolean;
  /** Whether the source connection still has more data to load. */
  hasNextPage: boolean;
  /** Invoked when the sentinel comes into view AND `hasNextPage` AND `enabled`. */
  loadMore: () => void;
  /** Override the IntersectionObserver root margin. Default: `'0px'` (fire when sentinel touches the viewport). */
  rootMargin?: string;
  /** Override the threshold (0–1). Default: 0. */
  threshold?: number;
}

/**
 * Catalog-shared infinite-scroll primitive.
 *
 * Returns a `ref` to attach to a sentinel element. When the sentinel enters the
 * viewport and the connection still has a next page, `loadMore()` fires.
 *
 * The caller owns:
 *   - what "load more" means (URL navigation, Hydrogen Pagination NextLink,
 *     manual fetch, etc.) — passed in as `loadMore`.
 *   - where the sentinel sits in the DOM — typically the existing "Load more"
 *     button from `<PaginatedResourceSection>` or a hidden div at the end of
 *     the list.
 *
 * This hook is intentionally **not** tied to Hydrogen's `Pagination` component.
 * Catalog modules with custom pagination (e.g. `app/modules/search`) can reuse
 * it by supplying their own `loadMore`.
 */
export function useInfiniteScroll({
  enabled,
  hasNextPage,
  loadMore,
  rootMargin = '0px',
  threshold = 0,
}: UseInfiniteScrollOptions) {
  const {ref, inView} = useInView({rootMargin, threshold});

  useEffect(() => {
    if (!enabled) return;
    if (!inView) return;
    if (!hasNextPage) return;
    loadMore();
  }, [enabled, inView, hasNextPage, loadMore]);

  return {ref};
}
