import {Suspense} from 'react';
import {Await} from 'react-router';

import {brand} from '~/config/brand';

import {FALLBACK_FOOTER_MENU} from '../utils/navigation';

import styles from './footer.module.css';
import {Menu} from './Menu';

import type {FooterQuery, HeaderQuery} from 'storefrontapi.generated';

interface FooterProps {
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  publicStoreDomain: string;
}

export function Footer({
  footer: footerPromise,
  header,
  publicStoreDomain,
}: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <Suspense>
      <Await resolve={footerPromise}>
        {(footer) => (
          <footer className={styles.footer} data-testid="layout-footer">
            {footer?.menu && header.shop.primaryDomain?.url && (
              <Menu
                menu={footer.menu}
                primaryDomainUrl={header.shop.primaryDomain.url}
                publicStoreDomain={publicStoreDomain}
                className={styles.footerMenu}
                fallbackMenu={FALLBACK_FOOTER_MENU}
                color="var(--color-background)"
                testId="footer-menu"
              />
            )}
            <div className={styles.footerMeta} data-testid="layout-footer-meta">
              <span
                className={styles.footerBrand}
                data-testid="layout-footer-brand"
              >
                © {year} {brand.name}
              </span>
            </div>
          </footer>
        )}
      </Await>
    </Suspense>
  );
}
