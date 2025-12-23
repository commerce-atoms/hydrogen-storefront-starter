import {useLoaderData} from 'react-router';

import {buildPageMeta} from '@shoppy/seo/meta/buildPageMeta';

import {buildMetaTags} from '@platform/seo/meta';

import {
  FEATURED_COLLECTION_QUERY,
  RECOMMENDED_PRODUCTS_QUERY,
} from './graphql/queries';
import {HomeView} from './home.view';

import type {Route} from './+types/home.route';

export const meta: Route.MetaFunction = ({...args}) => {
  const request = (args as {request?: Request}).request;
  const url = request ? new URL(request.url) : null;
  const canonicalUrl = url ? url.origin : undefined;
  const seoMeta = buildPageMeta({
    title: 'Home',
    canonicalUrl,
  });
  return buildMetaTags(seoMeta);
};

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context}: Route.LoaderArgs) {
  const [{collections}] = await Promise.all([
    context.storefront.query(FEATURED_COLLECTION_QUERY),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {
    featuredCollection: collections.nodes[0] || null,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error: Error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  return {
    recommendedProducts,
  };
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  return (
    <HomeView
      featuredCollection={data.featuredCollection}
      recommendedProducts={data.recommendedProducts}
    />
  );
}
