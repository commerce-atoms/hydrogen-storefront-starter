import styles from './sort-select.module.css';

import type {SortOption} from './types';

interface SortSelectProps {
  value: string;
  options: SortOption[];
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

/**
 * Sort dropdown component for consistent sort UI across modules.
 * Pure UI component - no domain logic.
 */
export function SortSelect({
  value,
  options,
  onChange,
  label = 'Sort by:',
  className = '',
}: SortSelectProps) {
  return (
    <label className={`${styles.sortSelect} ${className}`}>
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles.select}
        data-testid="sort-select"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
