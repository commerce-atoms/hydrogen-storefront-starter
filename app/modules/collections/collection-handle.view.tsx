import {Link, useSearchParams} from 'react-router';

import {Analytics} from '@shopify/hydrogen';

import {SortSelect} from '@components/catalog/SortSelect';
import {ProductCard} from '@components/commerce/ProductCard';
import {PaginatedResourceSection} from '@components/pagination/PaginatedResourceSection';

import styles from './collection-handle.view.module.css';
import {DEFAULT_COLLECTION_SORT, COLLECTION_SORT_OPTIONS} from './sort';

import type {
  CollectionQuery,
  ProductItemFragment,
} from 'storefrontapi.generated';

interface CollectionHandleViewProps {
  collection: CollectionQuery['collection'];
  sort: string;
}

export function CollectionHandleView({
  collection,
  sort,
}: CollectionHandleViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleSortChange = (sortValue: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', sortValue);
    // Clear cursor when sort changes
    newParams.delete('cursor');
    setSearchParams(newParams);
  };

  if (!collection) return null;

  return (
    <div className={styles.collection}>
      <h1>{collection.title}</h1>
      {collection.description && (
        <p className={styles.collectionDescription}>{collection.description}</p>
      )}

      {/* Sort Control */}
      <div className={styles.controls}>
        <SortSelect
          value={sort || DEFAULT_COLLECTION_SORT}
          options={COLLECTION_SORT_OPTIONS}
          onChange={handleSortChange}
        />
      </div>

      <PaginatedResourceSection<ProductItemFragment>
        connection={collection.products}
        resourcesClassName={styles.productsGrid}
      >
        {({node: product, index}) => {
          return (
            <ProductCard
              key={product.id}
              product={product}
              loading={index < 8 ? 'eager' : undefined}
            />
          );
        }}
      </PaginatedResourceSection>
      <Analytics.CollectionView
        data={{
          collection: {
            id: collection.id,
            handle: collection.handle,
          },
        }}
      />
    </div>
  );
}
