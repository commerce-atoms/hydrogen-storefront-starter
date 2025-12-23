import {type FetcherWithComponents} from 'react-router';

import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';

import {Button} from '@components/primitives/Button';

export function AddToCartButton({
  analytics,
  children,
  disabled,
  lines,
  onClick,
}: {
  analytics?: unknown;
  children: React.ReactNode;
  disabled?: boolean;
  lines: Array<OptimisticCartLineInput>;
  onClick?: () => void;
}) {
  return (
    <CartForm route="/cart" inputs={{lines}} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher: FetcherWithComponents<unknown>) => (
        <>
          <input
            name="analytics"
            type="hidden"
            value={JSON.stringify(analytics)}
          />
          <Button
            type="submit"
            onClick={onClick}
            disabled={disabled ?? fetcher.state !== 'idle'}
            width="full"
            data-testid="product-add-to-cart"
          >
            {children}
          </Button>
        </>
      )}
    </CartForm>
  );
}
