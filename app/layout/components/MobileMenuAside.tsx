import {Menu} from './Menu';
import {Aside} from './Aside';

import type {HeaderQuery} from 'storefrontapi.generated';

interface MobileMenuAsideProps {
  header: HeaderQuery;
  publicStoreDomain: string;
}

export function MobileMenuAside({
  header,
  publicStoreDomain,
}: MobileMenuAsideProps) {
  return (
    header.menu &&
    header.shop.primaryDomain?.url && (
      <Aside type="mobile" heading="MENU">
        <Menu
          menu={header.menu}
          viewport="mobile"
          primaryDomainUrl={header.shop.primaryDomain.url}
          publicStoreDomain={publicStoreDomain}
          showHomeLink={true}
        />
      </Aside>
    )
  );
}

