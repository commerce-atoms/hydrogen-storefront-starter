import {type CartViewPayload, useAnalytics} from '@shopify/hydrogen';

import {useAside} from './Aside';

interface CartBadgeProps {
  count: number | null;
}

export function CartBadge({count}: CartBadgeProps) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <a
      href="/cart"
      onClick={(e) => {
        e.preventDefault();
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        } as CartViewPayload);
      }}
      data-testid="cart-open"
    >
      Cart {count === null ? <span>&nbsp;</span> : count}
    </a>
  );
}
