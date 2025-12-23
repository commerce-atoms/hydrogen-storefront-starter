/**
 * Maps shoppy sort values to Shopify GraphQL sortKey and reverse for collections.
 * Used when querying Collection products in Storefront API.
 */
export function mapSortToShopify(sort: string): {
  sortKey: 'TITLE' | 'PRICE' | 'CREATED' | 'BEST_SELLING' | 'RELEVANCE';
  reverse: boolean;
} {
  if (sort === 'price-asc') {
    return {sortKey: 'PRICE', reverse: false};
  }
  if (sort === 'price-desc') {
    return {sortKey: 'PRICE', reverse: true};
  }
  if (sort === 'newest') {
    return {sortKey: 'CREATED', reverse: true};
  }
  if (sort === 'best-selling') {
    return {sortKey: 'BEST_SELLING', reverse: false};
  }
  // Default to relevance (which for collections is title order)
  return {sortKey: 'RELEVANCE', reverse: false};
}
