import {useAsyncValue} from 'react-router';

import {useOptimisticCart} from '@shopify/hydrogen';

import {CartBadge} from './CartBadge';

import type {CartApiQueryFragment} from 'storefrontapi.generated';

export function CartBanner() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}
