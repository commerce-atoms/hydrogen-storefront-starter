import {PAGE_FRAGMENT} from './fragments';

export const PAGE_QUERY = `#graphql
  query Page(
    $language: LanguageCode,
    $country: CountryCode,
    $handle: String!
  )
  @inContext(language: $language, country: $country) {
    page(handle: $handle) {
      ...Page
    }
  }
  ${PAGE_FRAGMENT}
` as const;
