import {Link} from 'react-router';

import {Image} from '@shopify/hydrogen';

import {PaginatedResourceSection} from '@components/pagination/PaginatedResourceSection';

import styles from './collections-index.view.module.css';

import type {
  CollectionFragment,
  StoreCollectionsQuery,
} from 'storefrontapi.generated';

interface CollectionsIndexViewProps {
  collections: StoreCollectionsQuery['collections'];
}

export function CollectionsIndexView({collections}: CollectionsIndexViewProps) {
  return (
    <div className={styles.collections}>
      <h1>Collections</h1>
      <PaginatedResourceSection<CollectionFragment>
        connection={collections}
        resourcesClassName={styles.collectionsGrid}
      >
        {({node: collection, index}) => (
          <CollectionItem
            key={collection.id}
            collection={collection}
            index={index}
          />
        )}
      </PaginatedResourceSection>
    </div>
  );
}

function CollectionItem({
  collection,
  index,
}: {
  collection: CollectionFragment;
  index: number;
}) {
  return (
    <Link
      className={styles.collectionItem}
      key={collection.id}
      to={`/collections/${collection.handle}`}
      prefetch="intent"
    >
      {collection?.image && (
        <Image
          alt={collection.image.altText || collection.title}
          aspectRatio="1/1"
          data={collection.image}
          loading={index < 3 ? 'eager' : undefined}
          sizes="(min-width: 45em) 400px, 100vw"
        />
      )}
      <h5>{collection.title}</h5>
    </Link>
  );
}
