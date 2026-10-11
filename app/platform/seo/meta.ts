
import {buildTitle} from '@commerce-atoms/seo/meta/buildTitle';
import {withMetaDefaults} from '@commerce-atoms/seo/meta/withMetaDefaults';

import {brand} from '~/config/brand';

import {buildBrandMeta} from './brandMeta';

import type {MetaOutput} from '@commerce-atoms/seo/types/meta';
import type {MetaDescriptor} from 'react-router';

/**
 * Extracts env from route matches for use in meta functions.
 * Request is not serializable, so we only extract env.
 */
export function getMetaRuntime(
  matches: ReadonlyArray<{data?: unknown} | undefined>,
): {env?: Env} {
  // Try to get env from root loader data
  const rootMatch = matches[0];
  if (!rootMatch) return {};
  const rootData = rootMatch.data as {env?: Env} | undefined;
  return {env: rootData?.env};
}

/**
 * Builds a canonical URL using location.pathname (preserves locale prefixes).
 * - Server-side: Uses PUBLIC_STORE_FRONTEND_DOMAIN or request origin
 * - Client-side: Uses location.origin (window.location.origin)
 */
export function buildCanonicalUrl(
  location: {pathname: string; origin?: string},
  matches: ReadonlyArray<{data?: unknown} | undefined>,
): string | undefined {
  const {env} = getMetaRuntime(matches);
  const pathname = location.pathname;

  // Prefer configured domain (server-side only, but works if env is available)
  if (env?.PUBLIC_STORE_FRONTEND_DOMAIN?.trim()) {
    const configured = env.PUBLIC_STORE_FRONTEND_DOMAIN.trim();
    const withScheme =
      configured.startsWith('http://') || configured.startsWith('https://')
        ? configured
        : `https://${configured}`;
    const origin = withScheme.replace(/\/+$/, '');
    const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
    return new URL(normalized, origin).toString();
  }

  // Fallback: use location.origin (available on both server and client)
  if (location.origin) {
    const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
    return new URL(normalized, location.origin).toString();
  }

  // Last resort: return undefined (shouldn't happen in practice)
  return undefined;
}

/**
 * Resolves a root-relative asset path to an absolute URL. Social crawlers
 * reject relative `og:image` values. Already-absolute URLs (Shopify CDN,
 * Oxygen asset CDN in production builds) pass through untouched.
 */
export function buildAbsoluteUrl(
  pathOrUrl: string,
  location: {pathname: string; origin?: string},
  matches: ReadonlyArray<{data?: unknown} | undefined>,
): string | undefined {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return buildCanonicalUrl({...location, pathname: pathOrUrl}, matches);
}

interface MetaTagsContext {
  location: {pathname: string; origin?: string};
  matches: ReadonlyArray<{data?: unknown; handle?: unknown} | undefined>;
}

/**
 * Breadcrumb labels from the matched routes' `handle.breadcrumb`, root to
 * leaf. Mirrors the trail `getLayoutData` renders.
 */
function getBreadcrumbLabels(matches: MetaTagsContext['matches']): string[] {
  const labels: string[] = [];
  for (const match of matches) {
    const crumb = (match?.handle as {breadcrumb?: unknown} | undefined)
      ?.breadcrumb;
    if (!crumb) continue;

    let resolved: unknown;
    try {
      resolved = typeof crumb === 'function' ? crumb(match?.data) : crumb;
    } catch {
      continue;
    }

    for (const item of Array.isArray(resolved) ? resolved : [resolved]) {
      const label = (item as {label?: unknown} | null)?.label;
      if (typeof label === 'string') labels.push(label);
    }
  }
  return labels;
}

/**
 * `<title>` for the page: its own title, then the breadcrumb parents from
 * nearest to furthest, then the brand. The last breadcrumb is the page
 * itself, so it is replaced by the page title (which may be a custom SEO
 * title). E.g. `Wolf Study 01 | Dark Red | Shop | Brand`.
 */
export function buildDocumentTitle(
  pageTitle: string,
  matches: MetaTagsContext['matches'],
): string {
  const parents = getBreadcrumbLabels(matches).slice(0, -1).reverse();
  return buildTitle([pageTitle, ...parents], {siteName: brand.name});
}

/**
 * Converts a `@commerce-atoms/seo` `MetaOutput` into React Router meta
 * descriptors.
 *
 * React Router renders only the deepest route's meta, so the site-wide
 * brand descriptors are appended here, and pages without an image of their
 * own fall back to `brand.ogImage`. The `<title>` follows the breadcrumb
 * trail (see `buildDocumentTitle`); OG and Twitter titles stay the page's
 * own title because platforms show the site name separately.
 */
export function buildMetaTags(
  seoMeta: MetaOutput,
  {location, matches}: MetaTagsContext,
): MetaDescriptor[] {
  const defaultImageUrl = brand.ogImage
    ? buildAbsoluteUrl(brand.ogImage, location, matches)
    : undefined;
  const {title, description, canonicalUrl, openGraph, twitter, jsonLd} =
    withMetaDefaults(seoMeta, {
      image: defaultImageUrl ? {url: defaultImageUrl, alt: brand.name} : undefined,
    });

  const tags: MetaDescriptor[] = [{title: buildDocumentTitle(title, matches)}];

  if (description) {
    tags.push({name: 'description', content: description});
  }
  if (canonicalUrl) {
    tags.push({tagName: 'link', rel: 'canonical', href: canonicalUrl});
  }

  tags.push({property: 'og:type', content: 'website'});
  if (openGraph?.title) {
    tags.push({property: 'og:title', content: openGraph.title});
  }
  if (openGraph?.description) {
    tags.push({property: 'og:description', content: openGraph.description});
  }
  if (openGraph?.url) {
    tags.push({property: 'og:url', content: openGraph.url});
  }
  const ogImage = openGraph?.images?.[0];
  if (ogImage) {
    tags.push({property: 'og:image', content: ogImage.url});
    tags.push({
      property: 'og:image:alt',
      content: ogImage.alt || openGraph?.title || title,
    });
  }

  if (twitter?.card) {
    tags.push({name: 'twitter:card', content: twitter.card});
  }
  if (twitter?.title) {
    tags.push({name: 'twitter:title', content: twitter.title});
  }
  if (twitter?.description) {
    tags.push({name: 'twitter:description', content: twitter.description});
  }
  const twitterImage = twitter?.images?.[0];
  if (twitterImage) {
    tags.push({name: 'twitter:image', content: twitterImage});
  }

  if (jsonLd) {
    tags.push({'script:ld+json': jsonLd});
  }

  return [...tags, ...buildBrandMeta(brand)];
}
