import styles from './checkbox-group.module.css';

export interface CheckboxOption {
  value: string;
  label: string;
}

interface CheckboxGroupProps {
  options: CheckboxOption[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  label?: string;
  className?: string;
}

/**
 * Checkbox group component for multi-select filters.
 * Pure UI component - no domain logic.
 */
export function CheckboxGroup({
  options,
  selectedValues,
  onToggle,
  label,
  className = '',
}: CheckboxGroupProps) {
  return (
    <div className={`${styles.checkboxGroup} ${className}`}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.checkboxes}>
        {options.map((option) => (
          <label key={option.value} className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={selectedValues.includes(option.value)}
              onChange={() => onToggle(option.value)}
              data-testid={`filter-checkbox-${option.value}`}
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}
