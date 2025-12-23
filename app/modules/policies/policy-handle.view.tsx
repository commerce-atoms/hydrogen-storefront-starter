import {Link} from 'react-router';

import styles from './policy-handle.view.module.css';

import type {PolicyQuery} from 'storefrontapi.generated';

interface PolicyHandleViewProps {
  policy: NonNullable<NonNullable<PolicyQuery['shop']>['privacyPolicy' | 'shippingPolicy' | 'termsOfService' | 'refundPolicy']>;
}

export function PolicyHandleView({policy}: PolicyHandleViewProps) {
  if (!policy) return null;
  return (
    <div className={styles.policy}>
      <br />
      <br />
      <div>
        <Link to="/policies">← Back to Policies</Link>
      </div>
      <br />
      <h1>{policy.title}</h1>
      <div dangerouslySetInnerHTML={{__html: policy.body}} />
    </div>
  );
}
