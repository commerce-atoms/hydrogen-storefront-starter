import {COLLECTION_THEME_FRAGMENT} from '@platform/theming/collectionThemeFragment';

import {
  PRODUCT_ITEM_FRAGMENT,
  COLLECTION_ITEM_FRAGMENT,
  SHOP_NAV_COLLECTION_FRAGMENT,
} from './fragments';

export const COLLECTION_QUERY = `#graphql
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      ...CollectionThemeReference
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor,
        sortKey: $sortKey,
        reverse: $reverse
      ) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
  ${PRODUCT_ITEM_FRAGMENT}
  ${COLLECTION_THEME_FRAGMENT}
` as const;

export const CATALOG_QUERY = `#graphql
  query Catalog(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    products(first: $first, last: $last, before: $startCursor, after: $endCursor) {
      nodes {
        ...CollectionItem
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
  ${COLLECTION_ITEM_FRAGMENT}
` as const;

export const SHOP_NAV_QUERY = `#graphql
  query ShopNav($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    collections(first: 50, sortKey: TITLE) {
      nodes {
        ...ShopNavCollection
      }
    }
  }
  ${SHOP_NAV_COLLECTION_FRAGMENT}
` as const;
