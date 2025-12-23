import {Suspense} from 'react';
import {Await, useMatches} from 'react-router';

import {CartPanel} from '@components/commerce/CartPanel';
import {Loading} from '@components/primitives/Loading';

import {useDocumentTitle} from '@hooks/primitives/useDocumentTitle';

import {Aside} from './components/Aside';
import {Breadcrumb} from './components/Breadcrumb';
import {Footer} from './components/Footer';
import {Header, HeaderMenu} from './components/Header';
import {SearchAside} from './components/SearchAside';
import styles from './page-layout.module.css';

import type {LayoutHandle} from './types/handle';
import type {ResolvedLayoutData} from './types/resolvedLayout';
import type {
  CartApiQueryFragment,
  FooterQuery,
  HeaderQuery,
} from 'storefrontapi.generated';

export type {LayoutHandle};

interface PageLayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
  children?: React.ReactNode;
}

export function PageLayout({
  cart,
  children = null,
  footer,
  header,
  isLoggedIn,
  publicStoreDomain,
}: PageLayoutProps) {
  const matches = useMatches();
  const layoutData = getLayoutData(matches);

  // Update document title based on route metadata
  useDocumentTitle(layoutData.pageTitle);

  return (
    <Aside.Provider>
      <CartAside cart={cart} />
      <SearchAside />
      <MobileMenuAside header={header} publicStoreDomain={publicStoreDomain} />
      {header && (
        <Header
          header={header}
          cart={cart}
          isLoggedIn={isLoggedIn}
          publicStoreDomain={publicStoreDomain}
        />
      )}
      <Breadcrumb breadcrumb={layoutData.breadcrumb} />
      <main className={styles.main}>{children}</main>
      <Footer
        footer={footer}
        header={header}
        publicStoreDomain={publicStoreDomain}
      />
    </Aside.Provider>
  );
}

function CartAside({cart}: {cart: PageLayoutProps['cart']}) {
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

function MobileMenuAside({
  header,
  publicStoreDomain,
}: {
  header: PageLayoutProps['header'];
  publicStoreDomain: PageLayoutProps['publicStoreDomain'];
}) {
  return (
    header.menu &&
    header.shop.primaryDomain?.url && (
      <Aside type="mobile" heading="MENU">
        <HeaderMenu
          menu={header.menu}
          viewport="mobile"
          primaryDomainUrl={header.shop.primaryDomain.url}
          publicStoreDomain={publicStoreDomain}
        />
      </Aside>
    )
  );
}

/**
 * Extract and resolve layout metadata from matched routes.
 * Resolves breadcrumb functions and normalizes all metadata.
 */
function getLayoutData(
  matches: ReturnType<typeof useMatches>,
): ResolvedLayoutData {
  const resolved: ResolvedLayoutData = {};
  const breadcrumbTrail: Array<{label: string; href: string}> = [];

  // Process matches from root to leaf (matches are in order from root to leaf)
  for (const match of matches) {
    if (!match.handle || typeof match.handle !== 'object') {
      continue;
    }

    const handle = match.handle as Partial<LayoutHandle>;

    // Deepest route wins for pageTitle
    if (handle.pageTitle && !resolved.pageTitle) {
      resolved.pageTitle = handle.pageTitle;
    }

    // Resolve breadcrumb - can be function, array, or single item
    if (handle.breadcrumb) {
      const breadcrumb =
        typeof handle.breadcrumb === 'function'
          ? handle.breadcrumb(match.data)
          : handle.breadcrumb;

      if (Array.isArray(breadcrumb)) {
        breadcrumbTrail.push(...breadcrumb);
      } else if (breadcrumb && 'label' in breadcrumb && 'href' in breadcrumb) {
        breadcrumbTrail.push(breadcrumb);
      }
    }

    // Deepest route wins for pageHeader
    if (handle.pageHeader && !resolved.pageHeader) {
      resolved.pageHeader = handle.pageHeader;
    }

    // Deepest route wins for seo
    if (handle.seo && !resolved.seo) {
      resolved.seo = handle.seo;
    }
  }

  // Only set breadcrumb if trail has items
  if (breadcrumbTrail.length > 0) {
    resolved.breadcrumb = breadcrumbTrail;
  }

  return resolved;
}
