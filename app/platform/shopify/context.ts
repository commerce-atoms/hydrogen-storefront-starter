import {createHydrogenContext} from '@shopify/hydrogen';

import {getLocaleFromRequest, type I18nLocale} from '../i18n/i18n';
import {AppSession} from '../session/session';

// Define the additional context object
const additionalContext = {
  // Additional context for custom properties, CMS clients, 3P SDKs, etc.
  // These will be available as both context.propertyName and context.get(propertyContext)
  // Example of complex objects that could be added:
  // cms: await createCMSClient(env),
  // reviews: await createReviewsClient(env),
} as const;

// Automatically augment HydrogenAdditionalContext with the additional context type
type AdditionalContextType = typeof additionalContext;

declare global {
  interface HydrogenAdditionalContext extends AdditionalContextType {}
}

/**
 * Parses default locale from environment variables.
 * Supports PUBLIC_DEFAULT_LOCALE (format: "en-US") or separate PUBLIC_DEFAULT_COUNTRY.
 */
function parseDefaultLocale(env: Env): {
  language?: I18nLocale['language'];
  country?: I18nLocale['country'];
} {
  const raw = env.PUBLIC_DEFAULT_LOCALE?.trim();
  if (raw && /^[a-z]{2}-[a-z]{2}$/i.test(raw)) {
    const [language, country] = raw.split('-');
    return {
      language: language.toUpperCase() as I18nLocale['language'],
      country: country.toUpperCase() as I18nLocale['country'],
    };
  }
  return {
    language: undefined,
    country: env.PUBLIC_DEFAULT_COUNTRY?.trim()?.toUpperCase() as
      | I18nLocale['country']
      | undefined,
  };
}

/**
 * Creates Hydrogen context for React Router 7.9.x
 * Returns HydrogenRouterContextProvider with hybrid access patterns
 *
 * @param cartQueryFragment - Cart GraphQL fragment (provided by cart module)
 * */
export async function createHydrogenRouterContext(
  request: Request,
  env: Env,
  executionContext: ExecutionContext,
  cartQueryFragment: string,
) {
  /**
   * Open a cache instance in the worker and a custom session instance.
   */
  if (!env?.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is not set');
  }

  const waitUntil = executionContext.waitUntil.bind(executionContext);
  const [cache, session] = await Promise.all([
    caches.open('hydrogen'),
    AppSession.init(request, [env.SESSION_SECRET]),
  ]);

  const defaults = parseDefaultLocale(env);

  const hydrogenContext = createHydrogenContext(
    {
      env,
      request,
      cache,
      waitUntil,
      session,
      // Detect locale from URL path, falling back to env defaults
      i18n: getLocaleFromRequest(request, defaults),
      cart: {
        queryFragment: cartQueryFragment,
      },
    },
    additionalContext,
  );

  return hydrogenContext;
}
