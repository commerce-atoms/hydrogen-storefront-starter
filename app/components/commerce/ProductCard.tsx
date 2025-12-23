import {Link} from 'react-router';

import {Image} from '@shopify/hydrogen';

import {formatMoney} from '@shoppy/money/format/formatMoney';
import {formatRange} from '@shoppy/money/format/formatRange';

import {getProductUrl} from '@platform/i18n/urls';

import styles from './product-card.module.css';

import type {
  ProductItemFragment,
  CollectionItemFragment,
  RecommendedProductFragment,
} from 'storefrontapi.generated';

interface ProductCardProps {
  product:
    | ProductItemFragment
    | CollectionItemFragment
    | RecommendedProductFragment;
  loading?: 'eager' | 'lazy';
}

/**
 * Shared product card component
 * Used across: home, collections, search
 *
 * RULES:
 * - Accepts standard product fragments only (no custom props)
 * - No module-specific logic (cart state, wishlist, etc.)
 * - No data fetching
 * - If you need module-specific behavior, create a wrapper in the module
 *
 * ANTI-PATTERN WATCH:
 * - DO NOT add props like: inCart, isWishlisted, onAddToCart, etc.
 * - DO NOT add conditional rendering based on module context
 * - Keep this component focused on displaying product data only
 */
export function ProductCard({product, loading}: ProductCardProps) {
  const productUrl = getProductUrl(product.handle);
  const image = product.featuredImage;

  return (
    <Link
      className={styles.productCard}
      key={product.id}
      prefetch="intent"
      to={productUrl}
    >
      {image && (
        <Image
          alt={image.altText || product.title}
          aspectRatio="1/1"
          data={image}
          loading={loading}
          sizes="(min-width: 45em) 400px, 100vw"
        />
      )}
      <h4>{product.title}</h4>
      <small>
        {'maxVariantPrice' in product.priceRange &&
        product.priceRange.maxVariantPrice
          ? formatRange(
              product.priceRange.minVariantPrice,
              product.priceRange.maxVariantPrice,
            )
          : formatMoney(product.priceRange.minVariantPrice)}
      </small>
    </Link>
  );
}
