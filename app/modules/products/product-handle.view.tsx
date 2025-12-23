import {Analytics} from '@shopify/hydrogen';

import {Price} from '@components/primitives/Price';

import {ProductForm} from './components/ProductForm';
import {ProductImage} from './components/ProductImage';
import styles from './product-handle.view.module.css';

import type {
  ProductFragment,
  ProductVariantFragment,
} from 'storefrontapi.generated';

interface ProductViewProps {
  product: ProductFragment;
  selectedVariant: ProductVariantFragment | null;
}

export function ProductView({product, selectedVariant}: ProductViewProps) {
  const {title, descriptionHtml} = product;

  return (
    <div className={styles.product}>
      <ProductImage image={selectedVariant?.image} />
      <div className={styles.productMain}>
        <h1>{title}</h1>
        <Price
          price={selectedVariant?.price}
          compareAtPrice={selectedVariant?.compareAtPrice}
        />
        <br />
        <ProductForm product={product} selectedVariant={selectedVariant} />
        <br />
        <br />
        <p>
          <strong>Description</strong>
        </p>
        <br />
        <div dangerouslySetInnerHTML={{__html: descriptionHtml}} />
        <br />
      </div>
      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </div>
  );
}
