import {useNavigate, useSearchParams} from 'react-router';

import {getAvailabilityMap} from '@commerce-atoms/variants/getAvailabilityMap';
import {selectedOptionsToUrlParams} from '@commerce-atoms/variants/selectedOptionsToUrlParams';

import {useAside} from '@layout/components/Aside';

import {Button} from '@components/primitives/Button';

import {AddToCartButton} from './AddToCartButton';
import styles from './product-form.module.css';

import type {
  Maybe,
  ProductOptionValueSwatch,
} from '@shopify/hydrogen/storefront-api-types';
import type {ProductFragment} from 'storefrontapi.generated';

export function ProductForm({
  product,
  selectedVariant,
}: {
  product: ProductFragment;
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get availability map for current selection using @commerce-atoms/variants
  const partialSelection = selectedVariant?.selectedOptions || [];
  const availabilityMap = getAvailabilityMap(product, partialSelection, {
    onlyAvailable: true,
  });
  const {open} = useAside();

  return (
    <div className={styles.productForm} data-testid="product-form">
      {product.options.map((option) => {
        // If there is only a single value, don't display
        if (option.optionValues.length === 1) return null;

        const availableValues = availabilityMap.get(option.name);
        const currentValue = selectedVariant?.selectedOptions.find(
          (opt) => opt.name === option.name,
        )?.value;

        return (
          <div
            className={styles.productOptions}
            key={option.name}
            data-testid="product-variant-selector"
          >
            <h5>{option.name}</h5>
            <div className={styles.productOptionsGrid}>
              {option.optionValues.map((optionValue) => {
                const isSelected = currentValue === optionValue.name;
                const isAvailable =
                  availableValues?.has(optionValue.name) ?? false;

                return (
                  <button
                    type="button"
                    className={`${styles.productOptionsItem}${!isSelected ? ' link' : ''}`}
                    key={option.name + optionValue.name}
                    style={{
                      border: isSelected
                        ? '1px solid black'
                        : '1px solid transparent',
                      opacity: isAvailable ? 1 : 0.3,
                    }}
                    disabled={!isAvailable}
                    data-testid="product-variant-option"
                    data-option-name={option.name}
                    data-option-value={optionValue.name}
                    onClick={() => {
                      if (!isSelected) {
                        // Update this option in current selection
                        const newSelection =
                          selectedVariant?.selectedOptions.map((opt) =>
                            opt.name === option.name
                              ? {name: option.name, value: optionValue.name}
                              : opt,
                          ) || [{name: option.name, value: optionValue.name}];

                        const params = selectedOptionsToUrlParams(
                          newSelection,
                          product.options.map((o) => o.name),
                        );

                        void navigate(`?${params.toString()}`, {
                          replace: true,
                          preventScrollReset: true,
                        });
                      }
                    }}
                  >
                    <ProductOptionSwatch
                      swatch={optionValue.swatch}
                      name={optionValue.name}
                    />
                  </button>
                );
              })}
            </div>
            <br />
          </div>
        );
      })}
      <AddToCartButton
        disabled={!selectedVariant || !selectedVariant.availableForSale}
        onClick={() => {
          open('cart');
        }}
        lines={
          selectedVariant
            ? [
                {
                  merchandiseId: selectedVariant.id,
                  quantity: 1,
                  selectedVariant,
                },
              ]
            : []
        }
      >
        {selectedVariant?.availableForSale ? 'Add to cart' : 'Sold out'}
      </AddToCartButton>
    </div>
  );
}

function ProductOptionSwatch({
  swatch,
  name,
}: {
  swatch?:
    | {
        color?: string | null;
        image?: {previewImage?: {url?: string | null} | null} | null;
      }
    | null
    | undefined;
  name: string;
}) {
  const image = swatch?.image?.previewImage?.url;
  const color = swatch?.color;

  if (!image && !color) return name;

  return (
    <div
      aria-label={name}
      className={styles.productOptionLabelSwatch}
      style={{
        backgroundColor: color || 'transparent',
      }}
    >
      {!!image && <img src={image} alt={name} />}
    </div>
  );
}
