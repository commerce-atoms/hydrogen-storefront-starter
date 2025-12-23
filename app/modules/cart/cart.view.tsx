import {CartPanel} from '@components/commerce/CartPanel';

import styles from './cart.view.module.css';

import type {CartApiQueryFragment} from 'storefrontapi.generated';

interface CartViewProps {
  cart: CartApiQueryFragment | null;
}

export function CartView({cart}: CartViewProps) {
  return (
    <div className={styles.cart}>
      <h1>Cart</h1>
      <CartPanel layout="page" cart={cart} />
    </div>
  );
}
