import {ProductCard} from '@components/commerce/ProductCard';
import {PaginatedResourceSection} from '@components/pagination/PaginatedResourceSection';

import styles from './collections-all.view.module.css';

import type {
  CatalogQuery,
  CollectionItemFragment,
} from 'storefrontapi.generated';

interface CollectionsAllViewProps {
  products: CatalogQuery['products'];
}

export function CollectionsAllView({products}: CollectionsAllViewProps) {
  return (
    <div className={styles.collection}>
      <h1>Products</h1>
      <PaginatedResourceSection<CollectionItemFragment>
        connection={products}
        resourcesClassName={styles.productsGrid}
      >
        {({node: product, index}) => (
          <ProductCard
            key={product.id}
            product={product}
            loading={index < 8 ? 'eager' : undefined}
          />
        )}
      </PaginatedResourceSection>
    </div>
  );
}
