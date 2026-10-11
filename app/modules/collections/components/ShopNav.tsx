import {Link} from 'react-router';

import {getCollectionUrl, SHOP_PATH} from '@platform/i18n/urls';

import styles from './shop-nav.module.css';

import type {ShopNavCollectionFragment} from 'storefrontapi.generated';

interface ShopNavProps {
  collections: ShopNavCollectionFragment[];
  /** Handle of the collection being viewed; `null` on the all-products page. */
  activeHandle: string | null;
}

/**
 * Category row shared by `/shop` and `/shop/:handle`. Every collection is
 * one click from the shop root, which keeps the shop hierarchy flat and
 * crawlable without a separate collections index page.
 */
export function ShopNav({collections, activeHandle}: ShopNavProps) {
  if (collections.length === 0) return null;

  const items = [
    {key: 'all', label: 'All', to: SHOP_PATH, active: activeHandle === null},
    ...collections.map((collection) => ({
      key: collection.id,
      label: collection.title,
      to: getCollectionUrl(collection.handle),
      active: collection.handle === activeHandle,
    })),
  ];

  return (
    <nav className={styles.shopNav} aria-label="Shop categories">
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.key}>
            <Link
              to={item.to}
              prefetch="intent"
              className={styles.link}
              aria-current={item.active ? 'page' : undefined}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
