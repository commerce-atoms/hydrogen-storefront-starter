import {describe, expect, test} from 'vitest';

import {redirectIfHandleIsLocalized} from './redirects';

describe('redirectIfHandleIsLocalized', () => {
  test('does not redirect when handles match', () => {
    const request = new Request('http://localhost/en-us/products/snowboard');

    // Should not throw (no redirect)
    expect(() => {
      redirectIfHandleIsLocalized(request, {
        handle: 'snowboard',
        data: {handle: 'snowboard'},
      });
    }).not.toThrow();
  });

  test('redirects when handle is localized differently', () => {
    const request = new Request(
      'http://localhost/fr-ca/products/planche-neige',
    );

    try {
      redirectIfHandleIsLocalized(request, {
        handle: 'snowboard', // URL has this
        data: {handle: 'planche-neige'}, // Shopify returns this
      });

      // Should have thrown a redirect
      expect.fail('Should have thrown a redirect Response');
    } catch (error) {
      // Verify it's a redirect Response
      expect(error).toBeInstanceOf(Response);
      const response = error as Response;
      expect(response.status).toBe(302);

      // Verify redirected to correct localized handle
      const location = response.headers.get('Location');
      expect(location).toBe('http://localhost/fr-ca/products/planche-neige');
    }
  });

  test('redirects multiple resources if handles differ', () => {
    const request = new Request(
      'http://localhost/blogs/news-en/article-title-en',
    );

    try {
      redirectIfHandleIsLocalized(
        request,
        {
          handle: 'news-en',
          data: {handle: 'actualites'},
        },
        {
          handle: 'article-title-en',
          data: {handle: 'titre-article'},
        },
      );

      expect.fail('Should have thrown a redirect');
    } catch (error) {
      expect(error).toBeInstanceOf(Response);
      const response = error as Response;

      const location = response.headers.get('Location');
      expect(location).toBe('http://localhost/blogs/actualites/titre-article');
    }
  });

  test('preserves query parameters during redirect', () => {
    const request = new Request(
      'http://localhost/products/snowboard?Color=Blue',
    );

    try {
      redirectIfHandleIsLocalized(request, {
        handle: 'snowboard',
        data: {handle: 'planche-neige'},
      });

      expect.fail('Should have thrown a redirect');
    } catch (error) {
      const response = error as Response;
      const location = response.headers.get('Location');

      // Query params should be preserved
      expect(location).toBe(
        'http://localhost/products/planche-neige?Color=Blue',
      );
    }
  });

  test('handles empty resources array', () => {
    const request = new Request('http://localhost/products/snowboard');

    // Should not throw when no resources provided
    expect(() => {
      redirectIfHandleIsLocalized(request);
    }).not.toThrow();
  });

  test('only redirects once even with multiple handle differences', () => {
    const request = new Request('http://localhost/blogs/blog-en/article-en');

    let redirectCount = 0;

    try {
      redirectIfHandleIsLocalized(
        request,
        {handle: 'blog-en', data: {handle: 'blog-fr'}},
        {handle: 'article-en', data: {handle: 'article-fr'}},
      );
    } catch (error) {
      redirectCount++;
      expect(error).toBeInstanceOf(Response);
    }

    // Only one redirect should be thrown
    expect(redirectCount).toBe(1);
  });
});
