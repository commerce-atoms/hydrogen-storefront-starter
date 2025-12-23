import {Link, useSearchParams} from 'react-router';

import styles from './search-tabs.module.css';

type SearchType = 'all' | 'products' | 'collections' | 'pages';

interface SearchTabsProps {
  currentType: SearchType;
  q: string;
}

export function SearchTabs({currentType, q}: SearchTabsProps) {
  const [searchParams] = useSearchParams();

  const buildUrl = (type: SearchType) => {
    const params = new URLSearchParams(searchParams);
    params.set('type', type);
    if (q) {
      params.set('q', q);
    }
    // Clear cursor when switching types
    params.delete('after');
    return `/search?${params.toString()}`;
  };

  const tabs: Array<{type: SearchType; label: string}> = [
    {type: 'all', label: 'All'},
    {type: 'products', label: 'Products'},
    {type: 'collections', label: 'Collections'},
    {type: 'pages', label: 'Pages'},
  ];

  return (
    <div className={styles.tabs} data-testid="search-tabs">
      {tabs.map((tab) => (
        <Link
          key={tab.type}
          to={buildUrl(tab.type)}
          className={`${styles.tab} ${
            currentType === tab.type ? styles.active : ''
          }`}
          data-testid={`search-tab-${tab.type}`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
