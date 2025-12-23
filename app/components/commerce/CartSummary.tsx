import {CartForm, type OptimisticCart} from '@shopify/hydrogen';

import {formatMoney} from '@commerce-atoms/money/format/formatMoney';

import {Button} from '@components/primitives/Button';
import {Input} from '@components/primitives/Input';

import styles from './cart-summary.module.css';

import type {CartLayout} from '@components/commerce/CartPanel';
import type {CartApiQueryFragment} from 'storefrontapi.generated';

type CartSummaryProps = {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: CartLayout;
};

export function CartSummary({cart, layout}: CartSummaryProps) {
  const className =
    layout === 'page' ? styles.cartSummaryPage : styles.cartSummaryAside;

  return (
    <div aria-labelledby="cart-summary" className={className}>
      <h4>Totals</h4>
      <dl className={styles.cartSubtotal}>
        <dt>Subtotal</dt>
        <dd>
          {cart?.cost?.subtotalAmount?.amount &&
          cart.cost.subtotalAmount.currencyCode
            ? formatMoney({
                amount: cart.cost.subtotalAmount.amount,
                currencyCode: cart.cost.subtotalAmount.currencyCode,
              })
            : '-'}
        </dd>
      </dl>
      <CartDiscounts discountCodes={cart?.discountCodes} />
      <CartCheckoutActions checkoutUrl={cart?.checkoutUrl} />
    </div>
  );
}

function CartCheckoutActions({checkoutUrl}: {checkoutUrl?: string}) {
  if (!checkoutUrl) return null;

  return (
    <div>
      <a href={checkoutUrl} target="_self" data-testid="cart-checkout">
        <p>Continue to Checkout &rarr;</p>
      </a>
      <br />
    </div>
  );
}

function CartDiscounts({
  discountCodes,
}: {
  discountCodes?: CartApiQueryFragment['discountCodes'];
}) {
  const codes: string[] =
    discountCodes
      ?.filter((discount) => discount.applicable)
      ?.map(({code}) => code) || [];

  return (
    <div>
      {/* Have existing discount, display it with a remove option */}
      <dl hidden={!codes.length}>
        <div>
          <dt>Discount(s)</dt>
          <UpdateDiscountForm>
            <div className={styles.cartDiscount}>
              <code>{codes?.join(', ')}</code>
              &nbsp;
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                data-testid="cart-discount-remove"
              >
                Remove
              </Button>
            </div>
          </UpdateDiscountForm>
        </div>
      </dl>

      {/* Show an input to apply a discount */}
      <UpdateDiscountForm discountCodes={codes}>
        <div>
          <Input
            type="text"
            name="discountCode"
            placeholder="Discount code"
            data-testid="cart-discount-input"
          />
          &nbsp;
          <Button
            type="submit"
            variant="primary"
            size="sm"
            data-testid="cart-discount-apply"
          >
            Apply
          </Button>
        </div>
      </UpdateDiscountForm>
    </div>
  );
}

function UpdateDiscountForm({
  discountCodes,
  children,
}: {
  discountCodes?: string[];
  children: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{
        discountCodes: discountCodes || [],
      }}
    >
      {children}
    </CartForm>
  );
}
