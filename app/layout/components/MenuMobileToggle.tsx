import {useAside} from './Aside';
import styles from './menu-mobile-toggle.module.css';

export function MenuMobileToggle() {
  const {open} = useAside();
  return (
    <button
      className={`${styles.menuMobileToggle} ${styles.reset}`}
      onClick={() => open('mobile')}
      data-testid="nav-mobile-toggle"
    >
      <h3>☰</h3>
    </button>
  );
}
