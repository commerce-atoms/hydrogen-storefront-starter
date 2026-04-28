import * as React from 'react';

import {useNavigate} from 'react-router';

import {Pagination} from '@shopify/hydrogen';

import {useInfiniteScroll} from '@hooks/catalog/useInfiniteScroll';
import {Loading} from '@components/primitives/Loading';

interface PaginatedResourceSectionProps<NodesType> {
  connection: React.ComponentProps<typeof Pagination<NodesType>>['connection'];
  children: React.FunctionComponent<{node: NodesType; index: number}>;
  resourcesClassName?: string;
  /**
   * When true, the next-page link auto-loads as it enters the viewport.
   * Defaults to false — explicit pagination remains the baseline behaviour
   * so existing callers are unaffected.
   *
   * Implements the "Infinite scroll for collections" Shopify Hydrogen
   * cookbook recipe in the modular shape — see
   * `docs/cookbook-ports/infinite-scroll.md`.
   */
  infinite?: boolean;
}

/**
 * Encapsulates pagination markup and the optional infinite-scroll variant.
 * Pure presentational; behaviour is delegated to `useInfiniteScroll` from
 * `@hooks/catalog/useInfiniteScroll`.
 */
export function PaginatedResourceSection<NodesType>({
  connection,
  children,
  resourcesClassName,
  infinite = false,
}: PaginatedResourceSectionProps<NodesType>) {
  return (
    <Pagination connection={connection}>
      {(pagination) => (
        <PaginatedResourceSectionInner
          pagination={pagination}
          children={children}
          resourcesClassName={resourcesClassName}
          infinite={infinite}
        />
      )}
    </Pagination>
  );
}

interface PaginatedResourceSectionInnerProps<NodesType> {
  pagination: React.ComponentProps<
    typeof Pagination<NodesType>
  >['children'] extends (props: infer P) => unknown
    ? P
    : never;
  children: React.FunctionComponent<{node: NodesType; index: number}>;
  resourcesClassName?: string;
  infinite: boolean;
}

function PaginatedResourceSectionInner<NodesType>({
  pagination,
  children,
  resourcesClassName,
  infinite,
}: PaginatedResourceSectionInnerProps<NodesType>) {
  const {
    nodes,
    isLoading,
    PreviousLink,
    NextLink,
    state,
    nextPageUrl,
    hasNextPage,
  } = pagination;

  const navigate = useNavigate();
  const {ref: sentinelRef} = useInfiniteScroll({
    enabled: infinite,
    hasNextPage,
    loadMore: React.useCallback(() => {
      void navigate(nextPageUrl, {
        replace: true,
        preventScrollReset: true,
        state,
      });
    }, [navigate, nextPageUrl, state]),
  });

  const resourcesMarkup = nodes.map((node, index) =>
    children({node, index}),
  );

  return (
    <div>
      <PreviousLink>
        {isLoading ? (
          <Loading size="sm" text="" />
        ) : (
          <span>↑ Load previous</span>
        )}
      </PreviousLink>
      {resourcesClassName ? (
        <div className={resourcesClassName}>{resourcesMarkup}</div>
      ) : (
        resourcesMarkup
      )}
      <NextLink ref={infinite ? sentinelRef : undefined}>
        {isLoading ? <Loading size="sm" text="" /> : <span>Load more ↓</span>}
      </NextLink>
    </div>
  );
}
