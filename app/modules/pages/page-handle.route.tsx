import {useLoaderData} from 'react-router';

import {buildPageMeta} from '@commerce-atoms/seo/meta/buildPageMeta';

import {redirectIfHandleIsLocalized} from '@platform/i18n/redirects';
import {buildCanonicalUrl, buildMetaTags} from '@platform/seo/meta';
import {getPageByHandle} from '@platform/shopify/storefront/pages';

import {breadcrumb} from '@layout/utils/breadcrumbs';

import {PageHandleView} from './page-handle.view';

import type {Route} from './+types/page-handle.route';

export const meta: Route.MetaFunction = ({data, location, matches}) => {
  if (!data?.page) {
    return [{title: 'Page'}];
  }

  const canonicalUrl = buildCanonicalUrl(location, matches);
  const seoMeta = buildPageMeta({
    title: data.page.seo?.title || data.page.title || 'Page',
    description: data.page.seo?.description || undefined,
    canonicalUrl,
  });

  return buildMetaTags(seoMeta);
};

export const handle = {
  breadcrumb: (data: Awaited<ReturnType<typeof loader>>) =>
    breadcrumb(data.page.title, `/pages/${data.page.handle}`),
};

export async function loader({params, context, request}: Route.LoaderArgs) {
  if (!params.handle || typeof params.handle !== 'string') {
    throw new Response('Not Found', {status: 404});
  }

  // Validate handle is safe (non-empty, no path separators)
  const handle = params.handle.trim();
  if (handle === '' || handle.includes('/')) {
    throw new Response('Not Found', {status: 404});
  }

  const page = await getPageByHandle(context.storefront, handle);

  if (!page) {
    throw new Response('Not Found', {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle, data: page});

  return {page};
}

export default function Page() {
  const {page} = useLoaderData<typeof loader>();
  return <PageHandleView page={page} />;
}
