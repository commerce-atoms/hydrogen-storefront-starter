import {NavLink} from 'react-router';

import {activeLinkStyle} from '../utils/navigation';

import styles from './header.module.css';

import {HeaderCtas} from './HeaderCtas';
import {Menu} from './Menu';

import type {HeaderQuery, CartApiQueryFragment} from 'storefrontapi.generated';

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
}

export function Header({
  header,
  isLoggedIn,
  cart,
  publicStoreDomain,
}: HeaderProps) {
  const {shop, menu} = header;
  return (
    <header className={styles.header} data-testid="layout-header">
      <NavLink prefetch="intent" to="/" style={activeLinkStyle} end>
        <strong>{shop.name}</strong>
      </NavLink>
      <Menu
        menu={menu}
        viewport="desktop"
        primaryDomainUrl={header.shop.primaryDomain.url}
        publicStoreDomain={publicStoreDomain}
        showHomeLink={false}
      />
      <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} />
    </header>
  );
}
