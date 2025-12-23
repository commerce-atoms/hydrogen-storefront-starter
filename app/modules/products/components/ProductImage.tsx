import {Image} from '@shopify/hydrogen';

import styles from './product-image.module.css';

import type {ProductVariantFragment} from 'storefrontapi.generated';

export function ProductImage({
  image,
}: {
  image: ProductVariantFragment['image'];
}) {
  if (!image) {
    return <div className={styles.productImage} />;
  }
  return (
    <div className={styles.productImage}>
      <Image
        alt={image.altText || 'Product Image'}
        aspectRatio="1/1"
        data={image}
        key={image.id}
        sizes="(min-width: 45em) 50vw, 100vw"
      />
    </div>
  );
}
