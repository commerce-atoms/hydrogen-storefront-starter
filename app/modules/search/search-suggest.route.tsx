import {json} from 'react-router';

import {PREDICTIVE_SEARCH_QUERY} from './search-suggest.queries';

import type {Route} from './+types/search-suggest.route';
import type {PredictiveSearchQuery} from 'storefrontapi.generated';

/**
 * Predictive search endpoint
 * Returns JSON with product and collection suggestions
 * GET /api/search-suggest?q=query&limit=10
 */
export async function loader({request, context}: Route.LoaderArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);

  if (!q.trim()) {
    return json({
      products: [],
      collections: [],
      pages: [],
      articles: [],
      queries: [],
    });
  }

  const {storefront} = context;

  try {
    const result = await storefront.query<PredictiveSearchQuery>(
      PREDICTIVE_SEARCH_QUERY,
      {
        variables: {
          term: q,
          limit,
          limitScope: 'EACH',
          types: ['PRODUCT', 'COLLECTION', 'PAGE', 'ARTICLE'],
        },
        cache: storefront.CacheNone(),
      },
    );

    if (!result?.predictiveSearch) {
      return json({
        products: [],
        collections: [],
        pages: [],
        articles: [],
        queries: [],
      });
    }

    return json({
      products: result.predictiveSearch.products || [],
      collections: result.predictiveSearch.collections || [],
      pages: result.predictiveSearch.pages || [],
      articles: result.predictiveSearch.articles || [],
      queries: result.predictiveSearch.queries || [],
    });
  } catch (error) {
    console.error('Predictive search error:', error);
    return json(
      {
        error: 'Failed to fetch search suggestions',
        products: [],
        collections: [],
        pages: [],
        articles: [],
        queries: [],
      },
      {status: 500},
    );
  }
}
