import {describe, expect, test, vi} from 'vitest';

import {buildMetaTags} from './meta';

vi.mock('~/config/brand', () => ({
  brand: {
    name: 'Test Brand',
    slogan: 'Slogan',
    defaultLocale: 'en-US',
    supportedLocales: ['en-US'],
    ogImage: '/assets/og-default.jpg',
    colours: {primary: '', accent: '', background: '', foreground: ''},
    fonts: {heading: '', body: ''},
    social: {x: 'https://x.com/testbrand'},
  },
}));

const context = {
  location: {pathname: '/about', origin: 'https://shop.example'},
  matches: [
    {data: {env: {PUBLIC_STORE_FRONTEND_DOMAIN: 'www.example.com'}}},
  ],
};

function content(tags: ReturnType<typeof buildMetaTags>, key: string) {
  const tag = tags.find(
    (t) => 'property' in t ? t.property === key : 'name' in t && t.name === key,
  );
  return tag && 'content' in tag ? tag.content : undefined;
}

describe('buildMetaTags', () => {
  test('falls back to the absolute brand OG image', () => {
    const tags = buildMetaTags({title: 'About'}, context);
    expect(content(tags, 'og:image')).toBe(
      'https://www.example.com/assets/og-default.jpg',
    );
    expect(content(tags, 'og:image:alt')).toBe('Test Brand');
    expect(content(tags, 'twitter:card')).toBe('summary_large_image');
    expect(content(tags, 'twitter:image')).toBe(
      'https://www.example.com/assets/og-default.jpg',
    );
  });

  test('prefers the page image over the brand default', () => {
    const tags = buildMetaTags(
      {
        title: 'Product',
        openGraph: {images: [{url: 'https://cdn.shopify.com/p.jpg'}]},
      },
      context,
    );
    expect(content(tags, 'og:image')).toBe('https://cdn.shopify.com/p.jpg');
  });

  test('emits title, OG text and JSON-LD', () => {
    const tags = buildMetaTags(
      {
        title: 'About',
        description: 'Who we are',
        canonicalUrl: 'https://www.example.com/about',
        jsonLd: {'@type': 'Organization'},
      },
      context,
    );
    expect(tags).toContainEqual({title: 'About'});
    expect(content(tags, 'og:title')).toBe('About');
    expect(content(tags, 'og:description')).toBe('Who we are');
    expect(content(tags, 'og:url')).toBe('https://www.example.com/about');
    expect(tags).toContainEqual({'script:ld+json': {'@type': 'Organization'}});
  });

  test('appends brand descriptors with twitter:site from the X URL', () => {
    const tags = buildMetaTags({title: 'About'}, context);
    expect(content(tags, 'og:site_name')).toBe('Test Brand');
    expect(content(tags, 'twitter:site')).toBe('@testbrand');
  });
});
