import {useLoaderData} from 'react-router';

import {buildProductMeta} from '@shoppy/seo/meta/buildProductMeta';
import {getSelectedOptionsFromUrl} from '@shoppy/variants/getSelectedOptionsFromUrl';

import {redirectIfHandleIsLocalized} from '@platform/i18n/redirects';
import {buildMetaTags} from '@platform/seo/meta';

import {breadcrumb} from '@layout/utils/breadcrumbs';

import {PRODUCT_QUERY} from './graphql/queries';
import {useDefaultVariant} from './hooks/useDefaultVariant';
import {useSelectedOptions} from './hooks/useSelectedOptions';
import {useVariantUrlSync} from './hooks/useVariantUrlSync';
import {ProductView} from './product-handle.view';

import type {Route} from './+types/product-handle.route';

export const meta: Route.MetaFunction = ({data, ...args}) => {
  const request = (args as {request?: Request}).request;
  if (!data?.product) {
    return [{title: 'Product'}];
  }

  const url = request ? new URL(request.url) : null;
  const canonicalUrl = url
    ? `${url.origin}/products/${data.product.handle}`
    : undefined;
  const seoMeta = buildProductMeta(data.product, {
    canonicalUrl,
    brandName: data.product.vendor || undefined,
  });

  return buildMetaTags(seoMeta);
};

export const handle = {
  breadcrumb: (data: Awaited<ReturnType<typeof loader>>) =>
    breadcrumb(data.product.title, `/products/${data.product.handle}`),
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
async function loadCriticalData({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  // Parse selected options from URL using @shoppy/variants
  // Note: Passing empty array means we accept all URL params as potential options.
  // The GraphQL query will validate these against the actual product options.
  // This avoids needing to query the product twice (once for option names, once with selected options).
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const selectedOptions = getSelectedOptionsFromUrl(searchParams, []);

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: product});

  return {
    product,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context, params}: Route.LoaderArgs) {
  // Put any API calls that is not critical to be available on first page render
  // For example: product reviews, product recommendations, social feeds.

  return {};
}

export default function Product() {
  const {product} = useLoaderData<typeof loader>();

  // Get selected options from URL
  const optionNames = product.options.map((opt) => opt.name);
  const selectedOptions = useSelectedOptions(optionNames);

  // Find variant based on URL selection or pick default
  const selectedVariant = useDefaultVariant(product, selectedOptions);

  // Sync URL on mount if no params set
  useVariantUrlSync(selectedVariant, optionNames);

  return <ProductView product={product} selectedVariant={selectedVariant} />;
}
