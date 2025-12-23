import {describe, expect, test} from 'vitest';

import {buildProductUrl, getProductUrl} from './urls';

describe('buildProductUrl', () => {
  test('builds basic product URL without locale', () => {
    const url = buildProductUrl({
      handle: 'snowboard',
      pathname: '/products',
      selectedOptions: undefined,
    });

    expect(url).toBe('/products/snowboard');
  });

  test('builds product URL with locale prefix', () => {
    const url = buildProductUrl({
      handle: 'snowboard',
      pathname: '/en-us/products',
      selectedOptions: undefined,
    });

    expect(url).toBe('/en-us/products/snowboard');
  });

  test('detects locale from any pathname', () => {
    const url = buildProductUrl({
      handle: 'snowboard',
      pathname: '/fr-ca/collections/winter',
      selectedOptions: undefined,
    });

    expect(url).toBe('/fr-ca/products/snowboard');
  });

  test('handles pathname without locale', () => {
    const url = buildProductUrl({
      handle: 'hoodie',
      pathname: '/cart',
      selectedOptions: undefined,
    });

    expect(url).toBe('/products/hoodie');
  });

  test('includes variant options as query params', () => {
    const url = buildProductUrl({
      handle: 'snowboard',
      pathname: '/',
      selectedOptions: [
        {name: 'Color', value: 'Blue'},
        {name: 'Size', value: 'Large'},
      ],
    });

    expect(url).toBe('/products/snowboard?Color=Blue&Size=Large');
  });

  test('combines locale prefix with variant options', () => {
    const url = buildProductUrl({
      handle: 'snowboard',
      pathname: '/en-ca/products',
      selectedOptions: [{name: 'Color', value: 'Red'}],
    });

    expect(url).toBe('/en-ca/products/snowboard?Color=Red');
  });

  test('handles empty selectedOptions array', () => {
    const url = buildProductUrl({
      handle: 'snowboard',
      pathname: '/',
      selectedOptions: [],
    });

    expect(url).toBe('/products/snowboard');
  });

  test('handles handle with special characters', () => {
    const url = buildProductUrl({
      handle: 'product-with-dashes',
      pathname: '/',
      selectedOptions: undefined,
    });

    expect(url).toBe('/products/product-with-dashes');
  });
});

describe('getProductUrl', () => {
  test('builds simple URL without locale or options', () => {
    const url = getProductUrl('snowboard');

    expect(url).toBe('/products/snowboard');
  });

  test('detects locale from pathname', () => {
    const url = getProductUrl('snowboard', '/en-us/cart');

    expect(url).toBe('/en-us/products/snowboard');
  });

  test('handles empty pathname', () => {
    const url = getProductUrl('hoodie', '');

    expect(url).toBe('/products/hoodie');
  });
});
