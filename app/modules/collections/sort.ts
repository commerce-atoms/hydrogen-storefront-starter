import type {SortOption} from '@components/catalog/types';

export const COLLECTION_SORT_OPTIONS: SortOption[] = [
  {value: 'relevance', label: 'Relevance'},
  {value: 'price-asc', label: 'Price: Low to High'},
  {value: 'price-desc', label: 'Price: High to Low'},
  {value: 'newest', label: 'Newest'},
] as const;

export const COLLECTION_SORT_VALUES: string[] = [
  'relevance',
  'price-asc',
  'price-desc',
  'newest',
];

export const DEFAULT_COLLECTION_SORT = 'relevance' as const;
