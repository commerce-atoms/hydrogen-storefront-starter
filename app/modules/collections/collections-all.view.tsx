import {ProductCard} from '@components/commerce/ProductCard';
import {PaginatedResourceSection} from '@components/pagination/PaginatedResourceSection';

import styles from './collections-all.view.module.css';
import {ShopNav} from './components/ShopNav';

import type {
  CatalogQuery,
  CollectionItemFragment,
  ShopNavCollectionFragment,
} from 'storefrontapi.generated';

interface CollectionsAllViewProps {
  products: CatalogQuery['products'];
  collections: ShopNavCollectionFragment[];
}

export function CollectionsAllView({
  products,
  collections,
}: CollectionsAllViewProps) {
  return (
    <div className={styles.collection}>
      <h1>Shop</h1>
      <ShopNav collections={collections} activeHandle={null} />
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
