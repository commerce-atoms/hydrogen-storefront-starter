import {useLoaderData} from 'react-router';

import {getPaginationVariables} from '@shopify/hydrogen';

import {buildPageMeta} from '@commerce-atoms/seo/meta/buildPageMeta';

import {SHOP_PATH} from '@platform/i18n/urls';
import {buildCanonicalUrl, buildMetaTags} from '@platform/seo/meta';

import {breadcrumb} from '@layout/utils/breadcrumbs';

import {CollectionsAllView} from './collections-all.view';
import {CATALOG_QUERY, SHOP_NAV_QUERY} from './graphql/queries';

import type {Route} from './+types/collections-all.route';

export const meta: Route.MetaFunction = ({location, matches}) => {
  const canonicalUrl = buildCanonicalUrl(location, matches);
  const seoMeta = buildPageMeta({
    title: 'Shop',
    canonicalUrl,
  });
  return buildMetaTags(seoMeta, {location, matches});
};

export const handle = {
  breadcrumb: () => breadcrumb('Shop', SHOP_PATH),
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

  const [{products}, {collections}] = await Promise.all([
    storefront.query(CATALOG_QUERY, {
      variables: {...paginationVariables},
    }),
    storefront.query(SHOP_NAV_QUERY),
  ]);
  return {products, collections: collections.nodes};
}

export default function Shop() {
  const {products, collections} = useLoaderData<typeof loader>();
  return <CollectionsAllView products={products} collections={collections} />;
}
