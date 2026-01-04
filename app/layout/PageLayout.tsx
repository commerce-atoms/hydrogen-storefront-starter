import {useMatches} from 'react-router';

import {useDocumentTitle} from '@hooks/primitives/useDocumentTitle';

import {Aside} from './components/Aside';
import {Breadcrumb} from './components/Breadcrumb';
import {CartAside} from './components/CartAside';
import {Footer} from './components/Footer';
import {Header} from './components/Header';
import {MobileMenuAside} from './components/MobileMenuAside';
import {SearchAside} from './components/SearchAside';
import styles from './page-layout.module.css';

import {getLayoutData} from './utils/layout';

import type {LayoutHandle} from './types/handle';
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
      <Header
        header={header}
        cart={cart}
        isLoggedIn={isLoggedIn}
        publicStoreDomain={publicStoreDomain}
      />
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
