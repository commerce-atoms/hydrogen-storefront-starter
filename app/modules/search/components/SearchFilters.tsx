import {useNavigate, useSearchParams} from 'react-router';

import {CheckboxGroup} from '@components/catalog/CheckboxGroup';
import {RangeInput} from '@components/catalog/RangeInput';
import {Button} from '@components/primitives/Button';

import styles from './search-filters.module.css';

interface SearchFiltersProps {
  filters: {
    available?: boolean;
    minPrice?: number;
    maxPrice?: number;
  };
}

export function SearchFilters({filters}: SearchFiltersProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const hasFilters =
    filters.available !== undefined ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined;

  const updateParams = (updater: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams);
    updater(params);
    params.delete('after');
    navigate(`/search?${params.toString()}`);
  };

  const handleClear = () => {
    updateParams((params) => {
      params.delete('available');
      params.delete('minPrice');
      params.delete('maxPrice');
    });
  };

  return (
    <div className={styles.filters} data-testid="search-filters">
      <h3>Filters</h3>

      <div className={styles.filtersForm}>
        {/* Availability Filter */}
        <div className={styles.filterGroup}>
          <CheckboxGroup
            options={[
              {value: 'true', label: 'In Stock'},
              {value: 'false', label: 'Out of Stock'},
            ]}
            selectedValues={
              filters.available !== undefined
                ? [filters.available.toString()]
                : []
            }
            onToggle={(value) => {
              updateParams((params) => {
                if (value === 'true') {
                  params.set('available', 'true');
                } else {
                  params.delete('available');
                }
              });
            }}
            label="Availability:"
          />
        </div>

        {/* Price Filter */}
        <div className={styles.filterGroup}>
          <RangeInput
            min={filters.minPrice}
            max={filters.maxPrice}
            onChange={(min, max) => {
              updateParams((params) => {
                if (min !== undefined) {
                  params.set('minPrice', min.toString());
                } else {
                  params.delete('minPrice');
                }
                if (max !== undefined) {
                  params.set('maxPrice', max.toString());
                } else {
                  params.delete('maxPrice');
                }
              });
            }}
            label="Price:"
          />
        </div>

        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            data-testid="filters-clear-all"
          >
            Clear All Filters
          </Button>
        )}
      </div>
    </div>
  );
}
