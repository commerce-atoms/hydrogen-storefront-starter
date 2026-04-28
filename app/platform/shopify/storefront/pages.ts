import type {Storefront} from '@shopify/hydrogen';

/**
 * GraphQL query to fetch a Shopify Page by handle.
 * Includes all fields needed for rendering and SEO.
 */
const PAGE_BY_HANDLE_QUERY = `#graphql
  query PageByHandle(
    $language: LanguageCode,
    $country: CountryCode,
    $handle: String!
  )
  @inContext(language: $language, country: $country) {
    page(handle: $handle) {
      id
      handle
      title
      body
      seo {
        title
        description
      }
      updatedAt
    }
  }
` as const;

/**
 * Fetches a Shopify Page by handle.
 *
 * @param storefront - Hydrogen storefront client
 * @param handle - Page handle (e.g., "about", "privacy")
 * @returns Page data if found, null otherwise
 */
export async function getPageByHandle(
  storefront: Storefront,
  handle: string,
): Promise<{
  id: string;
  handle: string;
  title: string;
  body: string;
  seo?: {
    title?: string | null;
    description?: string | null;
  } | null;
  updatedAt: string;
} | null> {
  if (!handle || typeof handle !== 'string' || handle.trim() === '') {
    return null;
  }

  const {page} = await storefront.query(PAGE_BY_HANDLE_QUERY, {
    variables: {
      handle: handle.trim(),
      language: storefront.i18n.language,
      country: storefront.i18n.country,
    },
  });

  return page || null;
}
