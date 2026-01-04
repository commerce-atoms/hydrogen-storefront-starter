import {useAside} from './Aside';
import styles from './search-toggle.module.css';

export function SearchToggle() {
  const {open} = useAside();
  return (
    <button
      className={styles.reset}
      onClick={() => open('search')}
      data-testid="search-open"
    >
      Search
    </button>
  );
}
