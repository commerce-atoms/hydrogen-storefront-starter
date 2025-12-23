import {forwardRef} from 'react';

import styles from './input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

/**
 * Basic input component with optional label and error display.
 * Unstyled by default - apply your own classes for styling.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({className = '', error, label, id, ...props}, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={styles.inputWrapper}>
        {label && (
          <label htmlFor={inputId} className={styles.inputLabel}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`${styles.input} ${error ? styles['input-error'] : ''} ${className}`}
          {...props}
        />
        {error && (
          <span className={styles.inputErrorMessage} role="alert">
            {error}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
