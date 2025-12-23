import {useLoaderData} from 'react-router';

import {buildPageMeta} from '@shoppy/seo/meta/buildPageMeta';

import {redirectIfHandleIsLocalized} from '@platform/i18n/redirects';
import {buildMetaTags} from '@platform/seo/meta';

import {breadcrumb} from '@layout/utils/breadcrumbs';

import {PAGE_QUERY} from './graphql/queries';
import {PageHandleView} from './page-handle.view';

import type {Route} from './+types/page-handle.route';

export const meta: Route.MetaFunction = ({data, ...args}) => {
  const request = (args as {request?: Request}).request;
  if (!data?.page) {
    return [{title: 'Page'}];
  }

  const url = request ? new URL(request.url) : null;
  const canonicalUrl = url
    ? `${url.origin}/pages/${data.page.handle}`
    : undefined;
  const seoMeta = buildPageMeta({
    title: data.page.title || 'Page',
    description: data.page.seo?.description || undefined,
    canonicalUrl,
  });

  return buildMetaTags(seoMeta);
};

export const handle = {
  breadcrumb: (data: Awaited<ReturnType<typeof loader>>) =>
    breadcrumb(data.page.title, `/pages/${data.page.handle}`),
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
async function loadCriticalData({context, request, params}: Route.LoaderArgs) {
  if (!params.handle) {
    throw new Error('Missing page handle');
  }

  const [{page}] = await Promise.all([
    context.storefront.query(PAGE_QUERY, {
      variables: {
        handle: params.handle,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!page) {
    throw new Response('Not Found', {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle: params.handle, data: page});

  return {
    page,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Page() {
  const {page} = useLoaderData<typeof loader>();
  return <PageHandleView page={page} />;
}
