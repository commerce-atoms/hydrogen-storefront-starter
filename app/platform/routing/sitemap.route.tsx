import {getSitemap} from '@shopify/hydrogen';

import {toAbsoluteUrl} from '../i18n/urls';

import type {Route} from './+types/sitemap.route';

export async function loader({
  request,
  params,
  context,
}: Route.LoaderArgs) {
  const response = await getSitemap({
    storefront: context.storefront,
    request,
    params,
    locales: ['EN-US', 'EN-CA', 'FR-CA'],
    getLink: ({type, baseUrl, handle, locale}) => {
      // Build relative path first
      const relativePath = locale
        ? `/${locale}/${type}/${handle}`
        : `/${type}/${handle}`;

      // Convert to absolute URL using configured frontend domain
      return toAbsoluteUrl(relativePath, request, context.env);
    },
  });

  response.headers.set('Cache-Control', `max-age=${60 * 60 * 24}`);

  return response;
}
