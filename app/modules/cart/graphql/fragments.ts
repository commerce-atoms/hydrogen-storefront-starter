const MONEY_FRAGMENT = `#graphql
  fragment CartMoney on MoneyV2 {
    currencyCode
    amount
  }
` as const;

export const CART_LINE_FRAGMENT = `#graphql
  fragment CartLine on CartLine {
    id
    quantity
    attributes {
      key
      value
    }
    cost {
      totalAmount {
        ...CartMoney
      }
      amountPerQuantity {
        ...CartMoney
      }
      compareAtAmountPerQuantity {
        ...CartMoney
      }
    }
    merchandise {
      ... on ProductVariant {
        id
        availableForSale
        compareAtPrice {
          ...CartMoney
        }
        price {
          ...CartMoney
        }
        requiresShipping
        title
        image {
          id
          url
          altText
          width
          height
        }
        product {
          handle
          title
          id
          vendor
        }
        selectedOptions {
          name
          value
        }
      }
    }
  }
  ${MONEY_FRAGMENT}
` as const;

export const CART_API_QUERY_FRAGMENT = `#graphql
  fragment CartApiQuery on Cart {
    updatedAt
    id
    checkoutUrl
    totalQuantity
    buyerIdentity {
      countryCode
      customer {
        id
        email
        firstName
        lastName
        displayName
      }
      email
      phone
    }
    lines(first: $numCartLines) {
      nodes {
        ...CartLine
      }
    }
    cost {
      subtotalAmount {
        ...CartMoney
      }
      totalAmount {
        ...CartMoney
      }
      totalDutyAmount {
        ...CartMoney
      }
      totalTaxAmount {
        ...CartMoney
      }
    }
    note
    attributes {
      key
      value
    }
    discountCodes {
      code
      applicable
    }
  }
  ${CART_LINE_FRAGMENT}
` as const;
