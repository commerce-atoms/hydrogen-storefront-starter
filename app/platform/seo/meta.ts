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
 * Converts SEO meta object to React Router MetaDescriptor array.
 * Handles title, description, canonical URL, Open Graph, and Twitter Card tags.
 */
export function buildMetaTags(seoMeta: {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  ogUrl?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
}): MetaDescriptor[] {
  const tags: MetaDescriptor[] = [];

  if (seoMeta.title) {
    tags.push({title: seoMeta.title});
  }

  if (seoMeta.description) {
    tags.push({name: 'description', content: seoMeta.description});
  }

  if (seoMeta.canonicalUrl) {
    tags.push({tagName: 'link', rel: 'canonical', href: seoMeta.canonicalUrl});
  }

  // Open Graph tags
  if (seoMeta.ogTitle) {
    tags.push({property: 'og:title', content: seoMeta.ogTitle});
  }
  if (seoMeta.ogDescription) {
    tags.push({property: 'og:description', content: seoMeta.ogDescription});
  }
  if (seoMeta.ogImage) {
    tags.push({property: 'og:image', content: seoMeta.ogImage});
  }
  if (seoMeta.ogType) {
    tags.push({property: 'og:type', content: seoMeta.ogType});
  }
  if (seoMeta.ogUrl) {
    tags.push({property: 'og:url', content: seoMeta.ogUrl});
  }

  // Twitter Card tags
  if (seoMeta.twitterCard) {
    tags.push({name: 'twitter:card', content: seoMeta.twitterCard});
  }
  if (seoMeta.twitterTitle) {
    tags.push({name: 'twitter:title', content: seoMeta.twitterTitle});
  }
  if (seoMeta.twitterDescription) {
    tags.push({
      name: 'twitter:description',
      content: seoMeta.twitterDescription,
    });
  }
  if (seoMeta.twitterImage) {
    tags.push({name: 'twitter:image', content: seoMeta.twitterImage});
  }

  return tags;
}
