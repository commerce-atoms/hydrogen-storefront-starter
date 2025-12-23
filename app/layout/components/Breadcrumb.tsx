import {Link} from 'react-router';

import styles from './breadcrumb.module.css';

import type {BreadcrumbItem} from '../types/breadcrumb';

export type {BreadcrumbItem};

export function Breadcrumb({breadcrumb}: {breadcrumb?: BreadcrumbItem[]}) {
  if (!breadcrumb || breadcrumb.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
      <ol>
        {breadcrumb.map((item, index) => (
          <li key={item.href}>
            {index > 0 && <span aria-hidden="true"> › </span>}
            {index === breadcrumb.length - 1 ? (
              <span>{item.label}</span>
            ) : (
              <Link to={item.href}>{item.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
