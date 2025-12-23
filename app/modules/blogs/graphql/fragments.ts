export const ARTICLE_ITEM_FRAGMENT = `#graphql
  fragment ArticleItem on Article {
    author: authorV2 {
      name
    }
    contentHtml
    handle
    id
    image {
      id
      altText
      url
      width
      height
    }
    publishedAt
    title
    blog {
      handle
    }
  }
` as const;

export const ARTICLE_FRAGMENT = `#graphql
  fragment Article on Article {
    handle
    title
    contentHtml
    publishedAt
    author: authorV2 {
      name
    }
    image {
      id
      altText
      url
      width
      height
    }
    seo {
      description
      title
    }
  }
` as const;
