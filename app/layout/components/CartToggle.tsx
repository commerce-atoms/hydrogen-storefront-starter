import {Suspense} from 'react';
import {Await} from 'react-router';

import {CartBadge} from './CartBadge';
import {CartBanner} from './CartBanner';

import type {CartApiQueryFragment} from 'storefrontapi.generated';

interface CartToggleProps {
  cart: Promise<CartApiQueryFragment | null>;
}

export function CartToggle({cart}: CartToggleProps) {
  return (
    <Suspense fallback={<CartBadge count={null} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}
