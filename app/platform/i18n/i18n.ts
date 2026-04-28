import type {I18nBase} from '@shopify/hydrogen';

export interface I18nLocale extends I18nBase {
  pathPrefix: string;
}

type I18nDefaults = {
  language?: I18nLocale['language'];
  country?: I18nLocale['country'];
};

/**
 * Extracts locale information from request URL path.
 * Supports locale prefixes like `/en-us/` or `/fr-ca/`.
 *
 * Preserves original casing in pathPrefix for URL correctness.
 * Falls back to provided defaults if no locale prefix is found.
 */
export function getLocaleFromRequest(
  request: Request,
  defaults: I18nDefaults = {},
): I18nLocale {
  const url = new URL(request.url);

  // Keep raw for pathPrefix correctness (preserve original casing)
  const firstPathPartRaw = url.pathname.split('/')[1] ?? '';
  const firstPathPart = firstPathPartRaw.toUpperCase();

  type I18nFromUrl = [I18nLocale['language'], I18nLocale['country']];

  let pathPrefix = '';
  let language: I18nLocale['language'] = defaults.language ?? 'EN';
  let country: I18nLocale['country'] = defaults.country ?? 'US';

  if (/^[A-Z]{2}-[A-Z]{2}$/i.test(firstPathPartRaw)) {
    pathPrefix = '/' + firstPathPartRaw; // preserve original casing from URL
    const [lang, ctry] = firstPathPart.split('-') as I18nFromUrl;
    language = lang;
    country = ctry;
  }

  return {language, country, pathPrefix};
}
