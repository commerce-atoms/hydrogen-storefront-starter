import {describe, expect, test} from 'vitest';

import {getLocaleFromRequest} from './i18n';

describe('getLocaleFromRequest', () => {
  test('returns default locale (EN-US) for root path', () => {
    const request = new Request('http://localhost/');
    const locale = getLocaleFromRequest(request);

    expect(locale).toEqual({
      language: 'EN',
      country: 'US',
      pathPrefix: '',
    });
  });

  test('extracts locale from path prefix', () => {
    const request = new Request('http://localhost/en-ca/products');
    const locale = getLocaleFromRequest(request);

    expect(locale).toEqual({
      language: 'EN',
      country: 'CA',
      pathPrefix: '/EN-CA', // Uppercased by implementation
    });
  });

  test('handles uppercase locale in path', () => {
    const request = new Request('http://localhost/FR-FR/collections');
    const locale = getLocaleFromRequest(request);

    expect(locale).toEqual({
      language: 'FR',
      country: 'FR',
      pathPrefix: '/FR-FR',
    });
  });

  test('handles lowercase locale in path', () => {
    const request = new Request('http://localhost/de-de/cart');
    const locale = getLocaleFromRequest(request);

    expect(locale).toEqual({
      language: 'DE',
      country: 'DE',
      pathPrefix: '/DE-DE', // Uppercased by implementation
    });
  });

  test('ignores invalid locale formats', () => {
    const request = new Request('http://localhost/en/products');
    const locale = getLocaleFromRequest(request);

    // 'en' is not valid format (needs EN-XX), so defaults to EN-US
    expect(locale).toEqual({
      language: 'EN',
      country: 'US',
      pathPrefix: '',
    });
  });

  test('ignores paths that look like locale but are not', () => {
    const request = new Request('http://localhost/products/en-us-flag');
    const locale = getLocaleFromRequest(request);

    // Only first path segment is checked
    expect(locale).toEqual({
      language: 'EN',
      country: 'US',
      pathPrefix: '',
    });
  });

  test('handles paths with query parameters', () => {
    const request = new Request('http://localhost/fr-ca/search?q=test');
    const locale = getLocaleFromRequest(request);

    expect(locale).toEqual({
      language: 'FR',
      country: 'CA',
      pathPrefix: '/FR-CA', // Uppercased by implementation
    });
  });
});
