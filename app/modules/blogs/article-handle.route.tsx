import {useLoaderData} from 'react-router';

import {buildPageMeta} from '@shoppy/seo/meta/buildPageMeta';

import {redirectIfHandleIsLocalized} from '@platform/i18n/redirects';
import {buildMetaTags} from '@platform/seo/meta';

import {breadcrumb} from '@layout/utils/breadcrumbs';

import {ArticleHandleView} from './article-handle.view';
import {ARTICLE_QUERY} from './graphql/queries';

import type {Route} from './+types/article-handle.route';

export const meta: Route.MetaFunction = ({data, ...args}) => {
  const request = (args as {request?: Request}).request;
  if (!data?.article) {
    return [{title: 'Article'}];
  }

  const url = request ? new URL(request.url) : null;
  const canonicalUrl = url
    ? `${url.origin}/blogs/${data.blog.handle}/${data.article.handle}`
    : undefined;
  const seoMeta = buildPageMeta({
    title: data.article.title || 'Article',
    description: data.article.seo?.description || undefined,
    canonicalUrl,
    images: data.article.image
      ? [
          {
            url: data.article.image.url,
            alt: data.article.image.altText || undefined,
          },
        ]
      : undefined,
  });

  return buildMetaTags(seoMeta);
};

export const handle = {
  breadcrumb: (data: Awaited<ReturnType<typeof loader>>) => [
    breadcrumb('Blogs', '/blogs'),
    breadcrumb(data.blog.title, `/blogs/${data.blog.handle}`),
    breadcrumb(
      data.article.title,
      `/blogs/${data.blog.handle}/${data.article.handle}`,
    ),
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
  const {blogHandle, articleHandle} = params;

  if (!articleHandle || !blogHandle) {
    throw new Response('Not found', {status: 404});
  }

  const [{blog}] = await Promise.all([
    context.storefront.query(ARTICLE_QUERY, {
      variables: {blogHandle, articleHandle},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!blog?.articleByHandle) {
    throw new Response(null, {status: 404});
  }

  redirectIfHandleIsLocalized(
    request,
    {
      handle: articleHandle,
      data: blog.articleByHandle,
    },
    {
      handle: blogHandle,
      data: blog,
    },
  );

  const article = blog.articleByHandle;

  return {article, blog};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Article() {
  const {article} = useLoaderData<typeof loader>();
  return <ArticleHandleView article={article} />;
}
