import {useSearchParams} from 'react-router';

import {Analytics} from '@shopify/hydrogen';

import {SortSelect} from '@components/catalog/SortSelect';
import {Button} from '@components/primitives/Button';
import {Input} from '@components/primitives/Input';

import {SearchFilters} from './components/SearchFilters';
import {SearchForm} from './components/SearchForm';
import {SearchResults} from './components/SearchResults';
import {SearchTabs} from './components/SearchTabs';
import styles from './search.view.module.css';
import {DEFAULT_SEARCH_SORT, SEARCH_SORT_OPTIONS} from './sort';

import type {SearchResultsData} from './components/SearchResults';

interface SearchViewProps {
  data: {
    q: string;
    type: 'all' | 'products' | 'collections' | 'pages';
    sort: string;
    filters: {
      available?: boolean;
      minPrice?: number;
      maxPrice?: number;
    };
    results: SearchResultsData;
  };
}

export function SearchView({data}: SearchViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleSortChange = (sortValue: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', sortValue);
    // Clear cursor when sort changes
    newParams.delete('after');
    setSearchParams(newParams);
  };

  const showFilters = data.type === 'all' || data.type === 'products';

  const hasResults =
    (data.results.products?.nodes && data.results.products.nodes.length > 0) ||
    (data.results.collections?.nodes &&
      data.results.collections.nodes.length > 0) ||
    (data.results.pages?.nodes && data.results.pages.nodes.length > 0) ||
    (data.results.articles?.nodes && data.results.articles.nodes.length > 0);

  return (
    <div className={styles.search}>
      <h1>Search</h1>

      {/* Search Form */}
      <SearchForm action="/search">
        {({inputRef}) => (
          <div className={styles.searchFormContent}>
            <Input
              ref={inputRef}
              type="search"
              name="q"
              placeholder="Search…"
              defaultValue={data.q}
              data-testid="search-input"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              data-testid="search-submit"
            >
              Search
            </Button>
          </div>
        )}
      </SearchForm>

      {/* Only show controls if there's a query */}
      {data.q && (
        <>
          {/* Header: Filters and Sort */}
          <div className={styles.header}>
            {/* Filters - only for products/all */}
            {showFilters && hasResults && (
              <SearchFilters filters={data.filters} />
            )}
            {/* Sort Control - only for products */}
            {(data.type === 'all' || data.type === 'products') && (
              <div className={styles.sortWrapper}>
                <SortSelect
                  value={data.sort || DEFAULT_SEARCH_SORT}
                  options={SEARCH_SORT_OPTIONS}
                  onChange={handleSortChange}
                />
              </div>
            )}
          </div>

          {/* Content: Tabs + Results */}
          <div className={styles.content}>
            {/* Tabs */}
            <div className={styles.tabsWrapper}>
              <SearchTabs currentType={data.type} q={data.q} />
            </div>

            {/* Results */}
            <div className={styles.resultsWrapper}>
              {hasResults ? (
                <SearchResults
                  results={data.results}
                  type={data.type}
                  q={data.q}
                  filters={data.filters}
                />
              ) : (
                <SearchResults.Empty />
              )}
            </div>
          </div>
        </>
      )}

      {/* Empty state when no query */}
      {!data.q && (
        <div className={styles.emptyState}>
          <p>Enter a search term to find products, collections, and pages.</p>
        </div>
      )}

      <Analytics.SearchView
        data={{searchTerm: data.q, searchResults: data.results}}
      />
    </div>
  );
}
