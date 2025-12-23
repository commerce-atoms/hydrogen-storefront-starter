import {Suspense} from 'react';
import {Await, Link} from 'react-router';

import {Image} from '@shopify/hydrogen';

import {ProductCard} from '@components/commerce/ProductCard';
import {Loading} from '@components/primitives/Loading';

import styles from './home.view.module.css';

import type {
  FeaturedCollectionFragment,
  RecommendedProductsQuery,
} from 'storefrontapi.generated';

interface HomeViewProps {
  featuredCollection: FeaturedCollectionFragment | null;
  recommendedProducts: Promise<RecommendedProductsQuery | null>;
}

export function HomeView({
  featuredCollection,
  recommendedProducts,
}: HomeViewProps) {
  return (
    <div className={styles.home}>
      <FeaturedCollection collection={featuredCollection} />
      <RecommendedProducts products={recommendedProducts} />
    </div>
  );
}

function FeaturedCollection({
  collection,
}: {
  collection: FeaturedCollectionFragment | null;
}) {
  if (!collection) return null;
  const image = collection?.image;
  return (
    <Link
      className={styles.featuredCollection}
      to={`/collections/${collection.handle}`}
    >
      {image && (
        <div className={styles.featuredCollectionImage}>
          <Image data={image} sizes="100vw" />
        </div>
      )}
      <h1>{collection.title}</h1>
    </Link>
  );
}

function RecommendedProducts({
  products,
}: {
  products: Promise<RecommendedProductsQuery | null>;
}) {
  return (
    <div className={styles.recommendedProducts}>
      <h2>Recommended Products</h2>
      <Suspense fallback={<Loading />}>
        <Await resolve={products}>
          {(response) => (
            <div className={styles.recommendedProductsGrid}>
              {response
                ? response.products.nodes.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))
                : null}
            </div>
          )}
        </Await>
      </Suspense>
      <br />
    </div>
  );
}
