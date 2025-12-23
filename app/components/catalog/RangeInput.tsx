import styles from './range-input.module.css';

interface RangeInputProps {
  min?: number;
  max?: number;
  onChange: (min?: number, max?: number) => void;
  label?: string;
  placeholderMin?: string;
  placeholderMax?: string;
  className?: string;
}

/**
 * Range input component for min/max numeric filters (price, rating, etc.).
 * Pure UI component - no domain logic.
 */
export function RangeInput({
  min,
  max,
  onChange,
  label,
  placeholderMin = 'Min',
  placeholderMax = 'Max',
  className = '',
}: RangeInputProps) {
  const handleMinChange = (value: string) => {
    const minNum = value ? parseFloat(value) : undefined;
    onChange(minNum, max);
  };

  const handleMaxChange = (value: string) => {
    const maxNum = value ? parseFloat(value) : undefined;
    onChange(min, maxNum);
  };

  return (
    <div className={`${styles.rangeInput} ${className}`}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.inputs}>
        <input
          type="number"
          placeholder={placeholderMin}
          value={min ?? ''}
          onChange={(e) => handleMinChange(e.target.value)}
          className={styles.input}
          data-testid="filter-range-min"
        />
        <span className={styles.separator}>—</span>
        <input
          type="number"
          placeholder={placeholderMax}
          value={max ?? ''}
          onChange={(e) => handleMaxChange(e.target.value)}
          className={styles.input}
          data-testid="filter-range-max"
        />
      </div>
    </div>
  );
}
