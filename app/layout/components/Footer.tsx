import {Suspense} from 'react';
import {Await} from 'react-router';

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
          </footer>
        )}
      </Await>
    </Suspense>
  );
}
