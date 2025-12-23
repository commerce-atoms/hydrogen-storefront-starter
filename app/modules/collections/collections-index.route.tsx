import {useLoaderData} from 'react-router';

import {getPaginationVariables} from '@shopify/hydrogen';

import {buildPageMeta} from '@shoppy/seo/meta/buildPageMeta';

import {buildMetaTags} from '@platform/seo/meta';

import {breadcrumb} from '@layout/utils/breadcrumbs';

import {CollectionsIndexView} from './collections-index.view';
import {COLLECTIONS_QUERY} from './graphql/queries';

import type {Route} from './+types/collections-index.route';

export const meta: Route.MetaFunction = ({...args}) => {
  const request = (args as {request?: Request}).request;
  const url = request ? new URL(request.url) : null;
  const canonicalUrl = url ? `${url.origin}/collections` : undefined;
  const seoMeta = buildPageMeta({
    title: 'Collections',
    canonicalUrl,
  });
  return buildMetaTags(seoMeta);
};

export const handle = {
  breadcrumb: () => breadcrumb('Collections', '/collections'),
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
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 4,
  });

  const [{collections}] = await Promise.all([
    context.storefront.query(COLLECTIONS_QUERY, {
      variables: paginationVariables,
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {collections};
}

export default function Collections() {
  const {collections} = useLoaderData<typeof loader>();
  return <CollectionsIndexView collections={collections} />;
}
