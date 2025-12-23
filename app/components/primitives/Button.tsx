import {forwardRef} from 'react';

import styles from './button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  width?: 'auto' | 'full';
  children: React.ReactNode;
}

/**
 * Basic button component for consistent button behavior across the app.
 * Unstyled by default - apply your own classes for styling.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      width = 'auto',
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    const baseClasses = styles.button;
    const variantClasses = {
      primary: styles['button-primary'],
      secondary: styles['button-secondary'],
      ghost: styles['button-ghost'],
    };
    const sizeClasses = {
      sm: styles['button-sm'],
      md: styles['button-md'],
      lg: styles['button-lg'],
    };
    const widthClasses = {
      auto: '',
      full: styles['button-full'],
    };

    const classes = [
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      widthClasses[width],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
