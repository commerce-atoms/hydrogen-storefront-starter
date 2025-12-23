import type {MetaOutput} from '@commerce-atoms/seo/types/meta';

export type MetaTag =
  | {title: string}
  | {name: string; content: string}
  | {rel: string; href: string}
  | {property: string; content: string}
  | {'script:ld+json': string};

export function buildMetaTags(meta: MetaOutput): MetaTag[] {
  const metaTags: MetaTag[] = [{title: meta.title}];

  if (meta.description) {
    metaTags.push({name: 'description', content: meta.description});
  }

  if (meta.canonicalUrl) {
    metaTags.push({rel: 'canonical', href: meta.canonicalUrl});
  }

  if (meta.openGraph) {
    if (meta.openGraph.title) {
      metaTags.push({property: 'og:title', content: meta.openGraph.title});
    }
    if (meta.openGraph.description) {
      metaTags.push({
        property: 'og:description',
        content: meta.openGraph.description,
      });
    }
    if (meta.openGraph.url) {
      metaTags.push({property: 'og:url', content: meta.openGraph.url});
    }
    if (meta.openGraph.images) {
      meta.openGraph.images.forEach((image) => {
        metaTags.push({property: 'og:image', content: image.url});
        if (image.alt) {
          metaTags.push({property: 'og:image:alt', content: image.alt});
        }
      });
    }
  }

  if (meta.twitter) {
    if (meta.twitter.card) {
      metaTags.push({name: 'twitter:card', content: meta.twitter.card});
    }
    if (meta.twitter.title) {
      metaTags.push({name: 'twitter:title', content: meta.twitter.title});
    }
    if (meta.twitter.description) {
      metaTags.push({
        name: 'twitter:description',
        content: meta.twitter.description,
      });
    }
    if (meta.twitter.images) {
      meta.twitter.images.forEach((imageUrl) => {
        metaTags.push({name: 'twitter:image', content: imageUrl});
      });
    }
  }

  if (meta.jsonLd) {
    metaTags.push({
      'script:ld+json': JSON.stringify(meta.jsonLd),
    });
  }

  return metaTags;
}
