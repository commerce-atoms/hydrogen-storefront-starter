import {useLoaderData} from 'react-router';

import {buildPageMeta} from '@shoppy/seo/meta/buildPageMeta';

import {buildMetaTags} from '@platform/seo/meta';

import {breadcrumb} from '@layout/utils/breadcrumbs';

import {
  SEARCH_PRODUCTS_QUERY,
  SEARCH_PAGES_QUERY,
  SEARCH_ARTICLES_QUERY,
} from './graphql/queries';
import {SearchView} from './search.view';
import {DEFAULT_SEARCH_SORT} from './sort';
import {mapSortToShopify} from './utils/sortMapping';

import type {Route} from './+types/search.route';
import type {
  SearchProductsQuery,
  SearchCollectionsQuery,
  SearchPagesQuery,
  SearchArticlesQuery,
} from 'storefrontapi.generated';

export const meta: Route.MetaFunction = ({...args}) => {
  const request = (args as {request?: Request}).request;
  const url = request ? new URL(request.url) : null;
  const canonicalUrl = url ? `${url.origin}/search` : undefined;
  const seoMeta = buildPageMeta({
    title: 'Search',
    canonicalUrl,
  });
  return buildMetaTags(seoMeta);
};

export const handle = {
  breadcrumb: () => breadcrumb('Search', '/search'),
};

type SearchType = 'all' | 'products' | 'collections' | 'pages';

interface SearchFilters {
  available?: boolean;
  minPrice?: number;
  maxPrice?: number;
  vendor?: string;
  productType?: string;
}

interface SearchLoaderData {
  q: string;
  type: SearchType;
  sort: string;
  filters: SearchFilters;
  results: {
    products?: {
      nodes: SearchProductsQuery['products']['nodes'];
      pageInfo: SearchProductsQuery['products']['pageInfo'];
    };
    collections?: {
      nodes: SearchCollectionsQuery['collections']['nodes'];
      pageInfo: SearchCollectionsQuery['collections']['pageInfo'];
    };
    pages?: {
      nodes: SearchPagesQuery['pages']['nodes'];
      pageInfo: SearchPagesQuery['pages']['pageInfo'];
    };
    articles?: {
      nodes: SearchArticlesQuery['articles']['nodes'];
      pageInfo: SearchArticlesQuery['articles']['pageInfo'];
    };
  };
}

export async function loader({request, context}: Route.LoaderArgs) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  // Parse URL params
  const q = searchParams.get('q') || '';
  const type = (searchParams.get('type') || 'all') as SearchType;
  const sort = searchParams.get('sort') || DEFAULT_SEARCH_SORT;
  const first = parseInt(searchParams.get('first') || '24', 10);
  const after = searchParams.get('after') || undefined;

  // Parse filters
  const filters: SearchFilters = {};
  const availableParam = searchParams.get('available');
  if (availableParam === 'true' || availableParam === 'false') {
    filters.available = availableParam === 'true';
  }
  const minPrice = searchParams.get('minPrice');
  if (minPrice) {
    filters.minPrice = parseFloat(minPrice);
  }
  const maxPrice = searchParams.get('maxPrice');
  if (maxPrice) {
    filters.maxPrice = parseFloat(maxPrice);
  }
  const vendor = searchParams.get('vendor');
  if (vendor) {
    filters.vendor = vendor;
  }
  const productType = searchParams.get('productType');
  if (productType) {
    filters.productType = productType;
  }

  // Validate type
  const validTypes: SearchType[] = ['all', 'products', 'collections', 'pages'];
  const searchType: SearchType = validTypes.includes(type) ? type : 'all';

  // If no query, return empty results
  if (!q.trim()) {
    return {
      q: '',
      type: searchType,
      sort,
      filters,
      results: {},
    } satisfies SearchLoaderData;
  }

  const {storefront} = context;
  const {sortKey, reverse} = mapSortToShopify(sort);

  // Determine what to fetch based on type
  const shouldFetchProducts = searchType === 'all' || searchType === 'products';
  const shouldFetchCollections =
    searchType === 'all' || searchType === 'collections';
  const shouldFetchPages = searchType === 'all' || searchType === 'pages';

  // Fetch results in parallel
  const queries: Promise<unknown>[] = [];

  if (shouldFetchProducts) {
    queries.push(
      storefront.query<SearchProductsQuery>(SEARCH_PRODUCTS_QUERY, {
        variables: {
          query: q,
          first,
          after,
          sortKey,
          reverse,
        },
        cache: storefront.CacheNone(),
      }),
    );
  }

  // Collections are not searchable via search query - skip for now
  // Use predictive search endpoint for collection suggestions instead
  if (shouldFetchCollections) {
    // Return empty collections result - collections search not supported
    queries.push(
      Promise.resolve({
        collections: {
          nodes: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
        },
      }),
    );
  }

  if (shouldFetchPages) {
    queries.push(
      storefront.query<SearchPagesQuery>(SEARCH_PAGES_QUERY, {
        variables: {
          query: q,
          first: Math.min(first, 12), // Smaller page size for pages
          after,
        },
        cache: storefront.CacheNone(),
      }),
    );
  }

  // Also fetch articles when type is 'all'
  if (searchType === 'all') {
    queries.push(
      storefront.query<SearchArticlesQuery>(SEARCH_ARTICLES_QUERY, {
        variables: {
          query: q,
          first: Math.min(first, 12),
          after,
        },
        cache: storefront.CacheNone(),
      }),
    );
  }

  const results = await Promise.all(queries);

  // Extract results
  const searchResults: SearchLoaderData['results'] = {};

  let resultIndex = 0;

  if (shouldFetchProducts) {
    const productsResult = results[resultIndex++] as SearchProductsQuery;
    if (productsResult?.products) {
      searchResults.products = {
        nodes: productsResult.products.nodes,
        pageInfo: productsResult.products.pageInfo,
      };
    }
  }

  if (shouldFetchCollections) {
    const collectionsResult = results[resultIndex++] as SearchCollectionsQuery;
    if (collectionsResult?.collections) {
      searchResults.collections = {
        nodes: collectionsResult.collections.nodes,
        pageInfo: collectionsResult.collections.pageInfo,
      };
    }
  }

  if (shouldFetchPages) {
    const pagesResult = results[resultIndex++] as SearchPagesQuery;
    if (pagesResult?.pages) {
      searchResults.pages = {
        nodes: pagesResult.pages.nodes,
        pageInfo: pagesResult.pages.pageInfo,
      };
    }
  }

  if (searchType === 'all') {
    const articlesResult = results[resultIndex++] as SearchArticlesQuery;
    if (articlesResult?.articles) {
      searchResults.articles = {
        nodes: articlesResult.articles.nodes,
        pageInfo: articlesResult.articles.pageInfo,
      };
    }
  }

  return {
    q,
    type: searchType,
    sort,
    filters,
    results: searchResults,
  } satisfies SearchLoaderData;
}

export default function SearchPage() {
  const data = useLoaderData<typeof loader>();
  return <SearchView data={data} />;
}
