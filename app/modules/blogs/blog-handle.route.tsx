import {useLoaderData} from 'react-router';

import {getPaginationVariables} from '@shopify/hydrogen';

import {buildPageMeta} from '@commerce-atoms/seo/meta/buildPageMeta';

import {redirectIfHandleIsLocalized} from '@platform/i18n/redirects';
import {buildMetaTags} from '@platform/seo/meta';

import {breadcrumb} from '@layout/utils/breadcrumbs';

import {BlogHandleView} from './blog-handle.view';
import {BLOG_QUERY} from './graphql/queries';

import type {Route} from './+types/blog-handle.route';

export const meta: Route.MetaFunction = ({data, ...args}) => {
  const request = (args as {request?: Request}).request;
  if (!data?.blog) {
    return [{title: 'Blog'}];
  }
  const url = request ? new URL(request.url) : null;
  const canonicalUrl = url
    ? `${url.origin}/blogs/${data.blog.handle}`
    : undefined;
  const seoMeta = buildPageMeta({
    title: data.blog.seo?.title || data.blog.title || 'Blog',
    description: data.blog.seo?.description || undefined,
    canonicalUrl,
  });
  return buildMetaTags(seoMeta);
};

export const handle = {
  breadcrumb: (data: Awaited<ReturnType<typeof loader>>) => [
    breadcrumb('Blogs', '/blogs'),
    breadcrumb(data.blog.title, `/blogs/${data.blog.handle}`),
  ],
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
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 4,
  });

  if (!params.blogHandle) {
    throw new Response(`blog not found`, {status: 404});
  }

  const [{blog}] = await Promise.all([
    context.storefront.query(BLOG_QUERY, {
      variables: {
        blogHandle: params.blogHandle,
        ...paginationVariables,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!blog?.articles) {
    throw new Response('Not found', {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle: params.blogHandle, data: blog});

  return {blog};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Blog() {
  const {blog} = useLoaderData<typeof loader>();
  return <BlogHandleView blog={blog} />;
}
