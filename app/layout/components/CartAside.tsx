import {Suspense} from 'react';
import {Await} from 'react-router';

import {CartPanel} from '@components/commerce/CartPanel';
import {Loading} from '@components/primitives/Loading';

import {Aside} from './Aside';

import type {CartApiQueryFragment} from 'storefrontapi.generated';

interface CartAsideProps {
  cart: Promise<CartApiQueryFragment | null>;
}

export function CartAside({cart}: CartAsideProps) {
  return (
    <Aside type="cart" heading="CART">
      <Suspense fallback={<Loading text="Loading cart..." />}>
        <Await resolve={cart}>
          {(cart) => {
            return <CartPanel cart={cart} layout="aside" />;
          }}
        </Await>
      </Suspense>
    </Aside>
  );
}
