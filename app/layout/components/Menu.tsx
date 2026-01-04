import {NavLink} from 'react-router';

import {activeLinkStyle, FALLBACK_HEADER_MENU} from '../utils/navigation';

import {useAside} from './Aside';
import styles from './menu.module.css';

import {MenuItem} from './MenuItem';

import type {FooterQuery, HeaderQuery} from 'storefrontapi.generated';

interface MenuProps {
  menu: HeaderQuery['menu'] | FooterQuery['menu'];
  primaryDomainUrl: string;
  publicStoreDomain: string;
  viewport?: 'desktop' | 'mobile';
  className?: string;
  showHomeLink?: boolean;
  fallbackMenu?: HeaderQuery['menu'] | FooterQuery['menu'];
  color?: string;
  testId?: string;
}

export function Menu({
  menu,
  primaryDomainUrl,
  publicStoreDomain,
  viewport,
  className,
  showHomeLink,
  fallbackMenu,
  color,
  testId = 'nav-primary',
}: MenuProps) {
  const defaultClassName =
    viewport === 'desktop' ? styles.menuDesktop : styles.menuMobile;
  const navClassName = className || defaultClassName;
  const {close} = useAside();
  const displayMenu = menu || fallbackMenu || FALLBACK_HEADER_MENU;

  return (
    <nav className={navClassName} role="navigation" data-testid={testId}>
      {showHomeLink && (
        <NavLink
          end
          onClick={close}
          prefetch="intent"
          style={(props) => activeLinkStyle({...props, color})}
          to="/"
        >
          Home
        </NavLink>
      )}
      {displayMenu.items.map((item) => {
        if (!item.url) return null;

        // if the url is internal, we strip the domain
        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;

        return (
          <MenuItem
            key={item.id}
            id={item.id}
            title={item.title}
            url={url}
            color={color}
            testId={testId === 'footer-menu' ? 'footer-link' : undefined}
          />
        );
      })}
    </nav>
  );
}
