import {formatCompare} from '@shoppy/money/compare/formatCompare';
import {formatMoney} from '@shoppy/money/format/formatMoney';

import styles from './price.module.css';

import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';

export function Price({
  price,
  compareAtPrice,
}: {
  price?: MoneyV2;
  compareAtPrice?: MoneyV2 | null;
}) {
  const compare = formatCompare(price || null, compareAtPrice || null);

  return (
    <div className={styles.productPrice}>
      {compare.show ? (
        <div className={styles.productPriceOnSale}>
          {compare.price}
          <s>{compare.compareAt}</s>
          {compare.discountPercent !== undefined && (
            <span className={styles.discountPercent}>
              {' '}
              -{compare.discountPercent}%
            </span>
          )}
        </div>
      ) : price ? (
        formatMoney(price)
      ) : (
        <span>&nbsp;</span>
      )}
    </div>
  );
}
