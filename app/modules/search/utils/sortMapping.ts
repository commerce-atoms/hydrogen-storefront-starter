export function mapSortToShopify(sort: string): {
  sortKey: 'RELEVANCE' | 'PRICE' | 'CREATED_AT';
  reverse: boolean;
} {
  if (sort === 'price-asc') {
    return {sortKey: 'PRICE', reverse: false};
  }
  if (sort === 'price-desc') {
    return {sortKey: 'PRICE', reverse: true};
  }
  if (sort === 'newest') {
    return {sortKey: 'CREATED_AT', reverse: true};
  }
  return {sortKey: 'RELEVANCE', reverse: false};
}
