import styles from './page-handle.view.module.css';

import type {getPageByHandle} from '@platform/shopify/storefront/pages';

type Page = NonNullable<Awaited<ReturnType<typeof getPageByHandle>>>;

interface PageHandleViewProps {
  page: Page;
}

export function PageHandleView({page}: PageHandleViewProps) {
  if (!page) return null;
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1>{page.title}</h1>
      </header>
      <main
        className={styles.pageContent}
        dangerouslySetInnerHTML={{__html: page.body}}
      />
    </div>
  );
}
