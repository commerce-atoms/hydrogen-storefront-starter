import {NavLink} from 'react-router';

import {activeLinkStyle} from '../utils/navigation';

import {useAside} from './Aside';
import styles from './menu-item.module.css';

interface MenuItemProps {
  id: string;
  title: string;
  url: string;
  color?: string;
  closeOnClick?: boolean;
  testId?: string;
}

export function MenuItem({
  id,
  title,
  url,
  color,
  closeOnClick = true,
  testId,
}: MenuItemProps) {
  const {close} = useAside();
  const isExternal = !url.startsWith('/');

  if (isExternal) {
    return (
      <a
        href={url}
        key={id}
        rel="noopener noreferrer"
        target="_blank"
        data-testid={testId}
      >
        {title}
      </a>
    );
  }

  return (
    <NavLink
      className={styles.menuItem}
      end
      key={id}
      onClick={closeOnClick ? close : undefined}
      prefetch="intent"
      style={(props) => activeLinkStyle({...props, color})}
      to={url}
    >
      {title}
    </NavLink>
  );
}
