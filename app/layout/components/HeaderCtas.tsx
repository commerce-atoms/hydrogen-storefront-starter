import {Suspense} from 'react';
import {Await, NavLink} from 'react-router';

import {activeLinkStyle} from '../utils/navigation';

import {CartToggle} from './CartToggle';
import styles from './header-ctas.module.css';

import {MenuMobileToggle} from './MenuMobileToggle';
import {SearchToggle} from './SearchToggle';

import type {CartApiQueryFragment} from 'storefrontapi.generated';

interface HeaderCtasProps {
  isLoggedIn: Promise<boolean>;
  cart: Promise<CartApiQueryFragment | null>;
}

export function HeaderCtas({isLoggedIn, cart}: HeaderCtasProps) {
  return (
    <nav className={styles.headerCtas} role="navigation">
      <MenuMobileToggle />
      <NavLink prefetch="intent" to="/account" style={activeLinkStyle}>
        <Suspense fallback="Sign in">
          <Await resolve={isLoggedIn} errorElement="Sign in">
            {(isLoggedIn) => (isLoggedIn ? 'Account' : 'Sign in')}
          </Await>
        </Suspense>
      </NavLink>
      <SearchToggle />
      <CartToggle cart={cart} />
    </nav>
  );
}
