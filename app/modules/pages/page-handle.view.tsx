import styles from './page-handle.view.module.css';

import type {PageQuery} from 'storefrontapi.generated';

interface PageHandleViewProps {
  page: PageQuery['page'];
}

export function PageHandleView({page}: PageHandleViewProps) {
  if (!page) return null;
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1>{page.title}</h1>
      </header>
      <main className={styles.pageContent} dangerouslySetInnerHTML={{__html: page.body}} />
    </div>
  );
}
