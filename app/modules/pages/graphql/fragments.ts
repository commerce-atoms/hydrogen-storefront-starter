export const PAGE_FRAGMENT = `#graphql
  fragment Page on Page {
    handle
    id
    title
    body
    seo {
      description
      title
    }
  }
` as const;
