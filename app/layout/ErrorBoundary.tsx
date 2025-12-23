import React, {Component} from 'react';
import {Link} from 'react-router';

import {Button} from '@components/primitives/Button';

import styles from './error-boundary.module.css';

import type {ErrorResponse} from 'react-router';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error, errorInfo?: React.ErrorInfo) => React.ReactNode;
}

/**
 * Standard error boundary for catching React errors
 */
export class AppErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {hasError: false};
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {hasError: true, error};
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({errorInfo});
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.state.errorInfo);
      }

      return <DefaultErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

/**
 * Default error fallback UI
 */
function DefaultErrorFallback({error}: {error?: Error}) {
  return (
    <div className={styles.errorBoundary}>
      <h2>Something went wrong</h2>
      <p>We&apos;re sorry, but something unexpected happened.</p>
      {process.env.NODE_ENV === 'development' && error && (
        <details className={styles.errorDetails}>
          <summary>Error details (development only)</summary>
          <pre>
            {error.message}
            {error.stack}
          </pre>
        </details>
      )}
      <div className={styles.errorButton}>
        <Button
          onClick={() => window.location.reload()}
          variant="primary"
          size="md"
          data-testid="error-reload"
        >
          Reload Page
        </Button>
      </div>
    </div>
  );
}

/**
 * Error boundary for route-level errors (404, 500, etc.)
 */
export function RouteErrorBoundary({error}: {error: ErrorResponse}) {
  let title = 'Something went wrong';
  let message = 'An unexpected error occurred.';

  if (error.status === 404) {
    title = 'Page Not Found';
    message = 'The page you are looking for does not exist.';
  } else if (error.status === 500) {
    title = 'Server Error';
    message = 'There was a problem with the server. Please try again later.';
  }

  return (
    <div className={styles.routeError}>
      <h1>{title}</h1>
      <p>{message}</p>
      <p>
        <Link to="/">← Go back home</Link>
      </p>

      {process.env.NODE_ENV === 'development' && (
        <details className={styles.debugInfo}>
          <summary>Debug information (development only)</summary>
          <dl>
            <dt>Status:</dt>
            <dd>{error.status}</dd>
            <dt>Status Text:</dt>
            <dd>{error.statusText}</dd>
            <dt>Data:</dt>
            <dd>
              <pre>{JSON.stringify(error.data, null, 2)}</pre>
            </dd>
          </dl>
        </details>
      )}
    </div>
  );
}

/**
 * Catchall error boundary for unmatched routes
 */
export function CatchallErrorBoundary() {
  return (
    <div className={styles.catchallError}>
      <h1>Page Not Found</h1>
      <p>The page you are looking for doesn&apos;t exist.</p>
      <p>
        <Link to="/">← Go back home</Link>
      </p>
    </div>
  );
}
