import {useLoaderData} from 'react-router';

import {getPaginationVariables} from '@shopify/hydrogen';

import {buildPageMeta} from '@commerce-atoms/seo/meta/buildPageMeta';

import {buildMetaTags} from '@platform/seo/meta';

import {CollectionsAllView} from './collections-all.view';
import {CATALOG_QUERY} from './graphql/queries';

import type {Route} from './+types/collections-all.route';

export const meta: Route.MetaFunction = ({...args}) => {
  const request = (args as {request?: Request}).request;
  const url = request ? new URL(request.url) : null;
  const canonicalUrl = url ? `${url.origin}/collections/all` : undefined;
  const seoMeta = buildPageMeta({
    title: 'Products',
    canonicalUrl,
  });
  return buildMetaTags(seoMeta);
};

export async function loader(args: Route.LoaderArgs) {
  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);
  return criticalData;
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, request}: Route.LoaderArgs) {
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });

  const [{products}] = await Promise.all([
    storefront.query(CATALOG_QUERY, {
      variables: {...paginationVariables},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);
  return {products};
}

export default function Collection() {
  const {products} = useLoaderData<typeof loader>();
  return <CollectionsAllView products={products} />;
}
