import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import styles from './aside.module.css';

import type {Aside} from '../types/aside';
import type {AsideContextValue} from '../types/asideContext';

/**
 * A side bar component with Overlay
 * @example
 * ```jsx
 * <Aside type="search" heading="SEARCH">
 *  <input type="search" />
 *  ...
 * </Aside>
 * ```
 */
export function Aside({
  children,
  heading,
  type,
}: {
  children?: React.ReactNode;
  type: Aside;
  heading: React.ReactNode;
}) {
  const {type: activeType, close} = useAside();
  const expanded = type === activeType;

  useEffect(() => {
    const abortController = new AbortController();

    if (expanded) {
      document.addEventListener(
        'keydown',
        function handler(event: KeyboardEvent) {
          if (event.key === 'Escape') {
            close();
          }
        },
        {signal: abortController.signal},
      );
    }
    return () => abortController.abort();
  }, [close, expanded]);

  const testIdMap: Record<Aside, string> = {
    cart: 'cart-drawer',
    search: 'search-drawer',
    mobile: 'nav-mobile',
    closed: '',
  };

  return (
    <div
      aria-modal
      className={`${styles.overlay} ${expanded ? styles.expanded : ''}`}
      role="dialog"
      data-testid={expanded && testIdMap[type] ? testIdMap[type] : undefined}
    >
      <button
        className={styles.closeOutside}
        onClick={close}
        data-testid="aside-overlay-close"
      />
      <aside className={styles.aside}>
        <header className={styles.asideHeader}>
          <h3>{heading}</h3>
          <button
            className={styles.close}
            onClick={close}
            aria-label="Close"
            data-testid={`${testIdMap[type]}-close`}
          >
            &times;
          </button>
        </header>
        <main className={styles.asideMain}>{children}</main>
      </aside>
    </div>
  );
}

const AsideContext = createContext<AsideContextValue | null>(null);

Aside.Provider = function AsideProvider({children}: {children: ReactNode}) {
  const [type, setType] = useState<Aside>('closed');

  return (
    <AsideContext.Provider
      value={{
        type,
        open: setType,
        close: () => setType('closed'),
      }}
    >
      {children}
    </AsideContext.Provider>
  );
};

export function useAside() {
  const aside = useContext(AsideContext);
  if (!aside) {
    throw new Error('useAside must be used within an AsideProvider');
  }
  return aside;
}
