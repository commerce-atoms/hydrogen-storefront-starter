import styles from './loading.module.css';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

/**
 * Basic loading spinner component.
 * Unstyled by default - apply your own classes for styling.
 */
export function Loading({
  size = 'md',
  text = 'Loading...',
  className = ''
}: LoadingProps) {
  const sizeClasses = {
    sm: styles['loading-sm'],
    md: styles['loading-md'],
    lg: styles['loading-lg'],
  };

  return (
    <div className={`${styles.loading} ${sizeClasses[size]} ${className}`}>
      <div className={styles.loadingSpinner} aria-hidden="true" />
      {text && <span className={styles.loadingText}>{text}</span>}
    </div>
  );
}
