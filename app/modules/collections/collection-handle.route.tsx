import {redirect, useLoaderData} from 'react-router';

import {getPaginationVariables} from '@shopify/hydrogen';

import {buildCollectionMeta} from '@shoppy/seo/meta/buildCollectionMeta';

import {redirectIfHandleIsLocalized} from '@platform/i18n/redirects';
import {buildMetaTags} from '@platform/seo/meta';

import {breadcrumb} from '@layout/utils/breadcrumbs';

import {CollectionHandleView} from './collection-handle.view';
import {COLLECTION_QUERY} from './graphql/queries';
import {DEFAULT_COLLECTION_SORT} from './sort';
import {mapSortToShopify} from './utils/sortMapping';

import type {Route} from './+types/collection-handle.route';

export const meta: Route.MetaFunction = ({data, ...args}) => {
  const request = (args as {request?: Request}).request;
  if (!data?.collection) {
    return [{title: 'Collection'}];
  }

  const url = request ? new URL(request.url) : null;
  const canonicalUrl = url
    ? `${url.origin}/collections/${data.collection.handle}`
    : undefined;
  const seoMeta = buildCollectionMeta(data.collection, {
    canonicalUrl,
  });

  return buildMetaTags(seoMeta);
};

export const handle = {
  breadcrumb: (data: Awaited<ReturnType<typeof loader>>) => [
    breadcrumb('Collections', '/collections'),
    breadcrumb(data.collection.title, `/collections/${data.collection.handle}`),
  ],
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
async function loadCriticalData({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);

  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });

  // Parse sort from URL (default to relevance)
  const sortParam = searchParams.get('sort') || DEFAULT_COLLECTION_SORT;
  const {sortKey, reverse} = mapSortToShopify(sortParam);

  if (!handle) {
    throw redirect('/collections');
  }

  const [{collection}] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: {handle, ...paginationVariables, sortKey, reverse},
      cache: storefront.CacheShort(),
    }),
  ]);

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: collection});

  return {
    collection,
    sort: sortParam,
  };
}

export default function Collection() {
  const {collection, sort} = useLoaderData<typeof loader>();
  return <CollectionHandleView collection={collection} sort={sort} />;
}
