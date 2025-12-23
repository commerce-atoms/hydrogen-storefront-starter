import {Link} from 'react-router';

import styles from './policies-index.view.module.css';

import type {PolicyItemFragment} from 'storefrontapi.generated';

interface PoliciesIndexViewProps {
  policies: PolicyItemFragment[];
}

export function PoliciesIndexView({policies}: PoliciesIndexViewProps) {
  return (
    <div className={styles.policies}>
      <h1>Policies</h1>
      <div>
        {policies.map((policy) => (
          <fieldset key={policy.id}>
            <Link to={`/policies/${policy.handle}`}>{policy.title}</Link>
          </fieldset>
        ))}
      </div>
    </div>
  );
}
