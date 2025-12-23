const MONEY_FRAGMENT = `#graphql
  fragment CollectionMoney on MoneyV2 {
    currencyCode
    amount
  }
` as const;

export const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment ProductItem on Product {
    id
    handle
    title
    availableForSale
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...CollectionMoney
      }
      maxVariantPrice {
        ...CollectionMoney
      }
    }
  }
  ${MONEY_FRAGMENT}
` as const;

export const COLLECTION_ITEM_FRAGMENT = `#graphql
  fragment CollectionItem on Product {
    id
    handle
    title
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...CollectionMoney
      }
      maxVariantPrice {
        ...CollectionMoney
      }
    }
  }
  ${MONEY_FRAGMENT}
` as const;

export const COLLECTION_FRAGMENT = `#graphql
  fragment Collection on Collection {
    id
    title
    handle
    image {
      id
      url
      altText
      width
      height
    }
  }
` as const;
