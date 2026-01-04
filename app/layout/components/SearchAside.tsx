import {useId} from 'react';

import {Button} from '@components/primitives/Button';
import {Input} from '@components/primitives/Input';
import {Loading} from '@components/primitives/Loading';

import {SearchFormPredictive} from '@modules/search/components/SearchFormPredictive';
import {SearchResultsPredictive} from '@modules/search/components/SearchResultsPredictive';

import {Aside} from './Aside';
import styles from './search-aside.module.css';

export function SearchAside() {
  const queriesDatalistId = useId();

  return (
    <Aside type="search" heading="SEARCH">
      <div className={styles.predictiveSearch}>
        <SearchFormPredictive>
          {({fetchResults, goToSearch, inputRef}) => (
            <div className={styles.searchForm}>
              <Input
                name="q"
                onChange={fetchResults}
                placeholder="Search"
                ref={inputRef}
                type="search"
                list={queriesDatalistId}
                data-testid="search-input"
              />
              <Button
                onClick={goToSearch}
                type="button"
                variant="primary"
                size="sm"
                data-testid="search-submit"
              >
                Search
              </Button>
            </div>
          )}
        </SearchFormPredictive>

        <SearchResultsPredictive>
          {({items, total, term, state, closeSearch}) => {
            const {articles, collections, pages, products, queries} = items;

            if (state === 'loading' && term.current) {
              return <Loading size="sm" />;
            }

            if (!total) {
              return <SearchResultsPredictive.Empty term={term} />;
            }

            return (
              <>
                <SearchResultsPredictive.Queries
                  queries={queries}
                  queriesDatalistId={queriesDatalistId}
                />
                <SearchResultsPredictive.Collections
                  collections={collections}
                  term={term}
                  closeSearch={closeSearch}
                />
                <SearchResultsPredictive.Products
                  products={products}
                  term={term}
                  closeSearch={closeSearch}
                />
                <SearchResultsPredictive.Pages
                  pages={pages}
                  term={term}
                  closeSearch={closeSearch}
                />
                <SearchResultsPredictive.Articles
                  articles={articles}
                  term={term}
                  closeSearch={closeSearch}
                />
              </>
            );
          }}
        </SearchResultsPredictive>
      </div>
    </Aside>
  );
}
