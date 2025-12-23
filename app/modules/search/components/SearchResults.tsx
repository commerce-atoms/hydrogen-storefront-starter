import {Link, useSearchParams} from 'react-router';

import {Image} from '@shopify/hydrogen';

import {applyFilters} from '@commerce-atoms/filters/apply/applyFilters';

import {ProductCard} from '@components/commerce/ProductCard';

import styles from './search-results.module.css';

import type {
  SearchProductsQuery,
  SearchPagesQuery,
  SearchArticlesQuery,
} from 'storefrontapi.generated';

export interface SearchResultsData {
  products?: {
    nodes: SearchProductsQuery['products']['nodes'];
    pageInfo: SearchProductsQuery['products']['pageInfo'];
  };
  collections?: {
    nodes: Array<{
      __typename: 'Collection';
      handle: string;
      id: string;
      title: string;
      image?: {
        url: string;
        altText?: string | null;
        width?: number;
        height?: number;
      } | null;
      trackingParameters?: string | null;
    }>;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string | null;
      endCursor: string | null;
    };
  };
  pages?: {
    nodes: SearchPagesQuery['pages']['nodes'];
    pageInfo: SearchPagesQuery['pages']['pageInfo'];
  };
  articles?: {
    nodes: SearchArticlesQuery['articles']['nodes'];
    pageInfo: SearchArticlesQuery['articles']['pageInfo'];
  };
}

type SearchResultsProps = {
  results: SearchResultsData;
  type: 'all' | 'products' | 'collections' | 'pages';
  q: string;
  filters?: {
    available?: boolean;
    minPrice?: number;
    maxPrice?: number;
  };
};

export function SearchResults({results, type, q, filters}: SearchResultsProps) {
  const [searchParams] = useSearchParams();

  // Build filter criteria for client-side filtering
  const filterCriteria =
    filters &&
    (filters.available !== undefined ||
      filters.minPrice !== undefined ||
      filters.maxPrice !== undefined)
      ? {
          priceRange:
            filters.minPrice !== undefined || filters.maxPrice !== undefined
              ? {
                  min: filters.minPrice,
                  max: filters.maxPrice,
                }
              : undefined,
          availability:
            filters.available !== undefined
              ? {
                  inStock: filters.available,
                  outOfStock: !filters.available,
                }
              : undefined,
        }
      : undefined;

  const buildPaginationUrl = (cursor: string | null | undefined) => {
    if (!cursor) return null;
    const params = new URLSearchParams(searchParams);
    params.set('after', cursor);
    return `/search?${params.toString()}`;
  };

  const hasResults =
    (results.products?.nodes && results.products.nodes.length > 0) ||
    (results.collections?.nodes && results.collections.nodes.length > 0) ||
    (results.pages?.nodes && results.pages.nodes.length > 0) ||
    (results.articles?.nodes && results.articles.nodes.length > 0);

  if (!hasResults) {
    return <SearchResults.Empty />;
  }

  return (
    <div className={styles.searchResults}>
      {type === 'all' && (
        <>
          {results.products && results.products.nodes.length > 0 && (
            <div className={styles.section}>
              <h2>Products</h2>
              <div className={styles.grid}>
                {(filterCriteria
                  ? applyFilters(results.products.nodes, filterCriteria)
                  : results.products.nodes
                )
                  .slice(0, 6)
                  .map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
              </div>
              {results.products.nodes.length >= 6 && (
                <Link
                  to={`/search?${new URLSearchParams({
                    q,
                    type: 'products',
                  }).toString()}`}
                  className={styles.viewAll}
                >
                  View all products →
                </Link>
              )}
            </div>
          )}

          {results.collections && results.collections.nodes.length > 0 && (
            <div className={styles.section}>
              <h2>Collections</h2>
              <div className={styles.grid}>
                {results.collections.nodes.slice(0, 6).map((collection) => (
                  <Link
                    key={collection.id}
                    to={`/collections/${collection.handle}`}
                    className={styles.collectionCard}
                  >
                    {collection.image && (
                      <Image
                        data={collection.image}
                        aspectRatio="1/1"
                        sizes="auto"
                      />
                    )}
                    <h3>{collection.title}</h3>
                  </Link>
                ))}
              </div>
              {results.collections.nodes.length >= 6 && (
                <Link
                  to={`/search?${new URLSearchParams({
                    q,
                    type: 'collections',
                  }).toString()}`}
                  className={styles.viewAll}
                >
                  View all collections →
                </Link>
              )}
            </div>
          )}

          {results.pages && results.pages.nodes.length > 0 && (
            <div className={styles.section}>
              <h2>Pages</h2>
              <ul>
                {results.pages.nodes.slice(0, 6).map((page) => (
                  <li key={page.id}>
                    <Link to={`/pages/${page.handle}`}>{page.title}</Link>
                  </li>
                ))}
              </ul>
              {results.pages.nodes.length >= 6 && (
                <Link
                  to={`/search?${new URLSearchParams({
                    q,
                    type: 'pages',
                  }).toString()}`}
                  className={styles.viewAll}
                >
                  View all pages →
                </Link>
              )}
            </div>
          )}

          {results.articles && results.articles.nodes.length > 0 && (
            <div className={styles.section}>
              <h2>Articles</h2>
              <ul>
                {results.articles.nodes.slice(0, 6).map((article) => (
                  <li key={article.id}>
                    <Link to={`/blogs/news/${article.handle}`}>
                      {article.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {type === 'products' && results.products && (
        <div className={styles.section}>
          <h2>Products</h2>
          <div className={styles.grid}>
            {(filterCriteria
              ? applyFilters(results.products.nodes, filterCriteria)
              : results.products.nodes
            ).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {results.products.pageInfo.hasNextPage && (
            <Link
              to={
                buildPaginationUrl(results.products.pageInfo.endCursor) || '#'
              }
              className={styles.loadMore}
              prefetch="intent"
            >
              Load more →
            </Link>
          )}
        </div>
      )}

      {type === 'collections' && results.collections && (
        <div className={styles.section}>
          <h2>Collections</h2>
          <div className={styles.grid}>
            {results.collections.nodes.map((collection) => (
              <Link
                key={collection.id}
                to={`/collections/${collection.handle}`}
                className={styles.collectionCard}
              >
                {collection.image && (
                  <Image
                    data={collection.image}
                    aspectRatio="1/1"
                    sizes="auto"
                  />
                )}
                <h3>{collection.title}</h3>
              </Link>
            ))}
          </div>
          {results.collections.pageInfo.hasNextPage && (
            <Link
              to={
                buildPaginationUrl(results.collections.pageInfo.endCursor) ||
                '#'
              }
              className={styles.loadMore}
              prefetch="intent"
            >
              Load more →
            </Link>
          )}
        </div>
      )}

      {type === 'pages' && results.pages && (
        <div className={styles.section}>
          <h2>Pages</h2>
          <ul>
            {results.pages.nodes.map((page) => (
              <li key={page.id}>
                <Link to={`/pages/${page.handle}`}>{page.title}</Link>
              </li>
            ))}
          </ul>
          {results.pages.pageInfo.hasNextPage && (
            <Link
              to={buildPaginationUrl(results.pages.pageInfo.endCursor) || '#'}
              className={styles.loadMore}
              prefetch="intent"
            >
              Load more →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

SearchResults.Empty = function SearchResultsEmpty() {
  return (
    <div className={styles.empty}>
      <p>No results found</p>
    </div>
  );
};
