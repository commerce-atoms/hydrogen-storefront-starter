import {redirect, useLoaderData} from 'react-router';

import {getPaginationVariables} from '@shopify/hydrogen';

import {buildCollectionMeta} from '@commerce-atoms/seo/meta/buildCollectionMeta';

import {redirectIfHandleIsLocalized} from '@platform/i18n/redirects';
import {getCollectionUrl, SHOP_PATH} from '@platform/i18n/urls';
import {buildCanonicalUrl, buildMetaTags} from '@platform/seo/meta';

import {parseTheme} from '@platform/theming/parseTheme';

import {breadcrumb} from '@layout/utils/breadcrumbs';

import {CollectionHandleView} from './collection-handle.view';
import {COLLECTION_QUERY, SHOP_NAV_QUERY} from './graphql/queries';
import {DEFAULT_COLLECTION_SORT} from './sort';
import {mapSortToShopify} from './utils/sortMapping';

import type {Route} from './+types/collection-handle.route';

export const meta: Route.MetaFunction = ({data, location, matches}) => {
  if (!data?.collection) {
    return [{title: 'Collection'}];
  }

  const canonicalUrl = buildCanonicalUrl(location, matches);
  const seoMeta = buildCollectionMeta(data.collection, {
    canonicalUrl,
  });

  return buildMetaTags(seoMeta, {location, matches});
};

export const handle = {
  breadcrumb: (data: Awaited<ReturnType<typeof loader>>) => [
    breadcrumb('Shop', SHOP_PATH),
    breadcrumb(data.collection.title, getCollectionUrl(data.collection.handle)),
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
    throw redirect(SHOP_PATH);
  }

  const [{collection}, {collections}] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: {handle, ...paginationVariables, sortKey, reverse},
      cache: storefront.CacheShort(),
    }),
    storefront.query(SHOP_NAV_QUERY),
  ]);

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: collection});

  // Optional per-collection theme derived from the `theme.preset` metafield
  // reference. Returns null if the collection has no palette assigned, in
  // which case the page renders with the global brand tokens from
  // `styles/tokens.css`.
  const theme = parseTheme(collection.themePreset);

  return {
    collection,
    collections: collections.nodes,
    sort: sortParam,
    theme,
  };
}

export default function Collection() {
  const {collection, collections, sort, theme} = useLoaderData<typeof loader>();
  return (
    <CollectionHandleView
      collection={collection}
      collections={collections}
      sort={sort}
      theme={theme}
    />
  );
}
