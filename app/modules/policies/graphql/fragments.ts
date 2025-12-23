export const POLICY_ITEM_FRAGMENT = `#graphql
  fragment PolicyItem on ShopPolicy {
    id
    title
    handle
  }
` as const;

export const POLICY_FRAGMENT = `#graphql
  fragment Policy on ShopPolicy {
    body
    handle
    id
    title
    url
  }
` as const;
