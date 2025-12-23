import {
  SEARCH_PRODUCT_FRAGMENT,
  SEARCH_PAGE_FRAGMENT,
  SEARCH_ARTICLE_FRAGMENT,
  SEARCH_COLLECTION_FRAGMENT,
  PAGE_INFO_FRAGMENT,
  PREDICTIVE_SEARCH_ARTICLE_FRAGMENT,
  PREDICTIVE_SEARCH_COLLECTION_FRAGMENT,
  PREDICTIVE_SEARCH_PAGE_FRAGMENT,
  PREDICTIVE_SEARCH_PRODUCT_FRAGMENT,
  PREDICTIVE_SEARCH_QUERY_FRAGMENT,
} from './fragments';

export const SEARCH_PRODUCTS_QUERY = `#graphql
  query SearchProducts(
    $country: CountryCode
    $language: LanguageCode
    $query: String!
    $first: Int
    $after: String
    $sortKey: SearchSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    products: search(
      query: $query,
      types: [PRODUCT],
      first: $first,
      after: $after,
      sortKey: $sortKey,
      reverse: $reverse,
      unavailableProducts: SHOW,
    ) {
      nodes {
        ...on Product {
          ...SearchProduct
        }
      }
      pageInfo {
        ...PageInfoFragment
      }
    }
  }
  ${SEARCH_PRODUCT_FRAGMENT}
  ${PAGE_INFO_FRAGMENT}
` as const;

export const SEARCH_PAGES_QUERY = `#graphql
  query SearchPages(
    $country: CountryCode
    $language: LanguageCode
    $query: String!
    $first: Int
    $after: String
  ) @inContext(country: $country, language: $language) {
    pages: search(
      query: $query,
      types: [PAGE],
      first: $first,
      after: $after,
    ) {
      nodes {
        ...on Page {
          ...SearchPage
        }
      }
      pageInfo {
        ...PageInfoFragment
      }
    }
  }
  ${SEARCH_PAGE_FRAGMENT}
  ${PAGE_INFO_FRAGMENT}
` as const;

export const SEARCH_ARTICLES_QUERY = `#graphql
  query SearchArticles(
    $country: CountryCode
    $language: LanguageCode
    $query: String!
    $first: Int
    $after: String
  ) @inContext(country: $country, language: $language) {
    articles: search(
      query: $query,
      types: [ARTICLE],
      first: $first,
      after: $after,
    ) {
      nodes {
        ...on Article {
          ...SearchArticle
        }
      }
      pageInfo {
        ...PageInfoFragment
      }
    }
  }
  ${SEARCH_ARTICLE_FRAGMENT}
  ${PAGE_INFO_FRAGMENT}
` as const;

export const PREDICTIVE_SEARCH_QUERY = `#graphql
  query PredictiveSearch(
    $country: CountryCode
    $language: LanguageCode
    $limit: Int!
    $limitScope: PredictiveSearchLimitScope!
    $term: String!
    $types: [PredictiveSearchType!]
  ) @inContext(country: $country, language: $language) {
    predictiveSearch(
      limit: $limit,
      limitScope: $limitScope,
      query: $term,
      types: $types,
    ) {
      articles {
        ...PredictiveArticle
      }
      collections {
        ...PredictiveCollection
      }
      pages {
        ...PredictivePage
      }
      products {
        ...PredictiveProduct
      }
      queries {
        ...PredictiveQuery
      }
    }
  }
  ${PREDICTIVE_SEARCH_ARTICLE_FRAGMENT}
  ${PREDICTIVE_SEARCH_COLLECTION_FRAGMENT}
  ${PREDICTIVE_SEARCH_PAGE_FRAGMENT}
  ${PREDICTIVE_SEARCH_PRODUCT_FRAGMENT}
  ${PREDICTIVE_SEARCH_QUERY_FRAGMENT}
` as const;
