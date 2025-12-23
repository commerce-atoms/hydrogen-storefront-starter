import type {Route} from './+types/graphql-api.route';

/**
 * GraphQL API proxy route
 *
 * WARNING: This route is a SECURITY RISK in production
 * It proxies arbitrary GraphQL queries to the Storefront API
 *
 * OPTIONS:
 * 1. Lock to dev-only (recommended)
 * 2. Implement query allowlist
 * 3. Remove entirely if not needed
 */
export async function action({params, context, request}: Route.ActionArgs) {
  // SECURITY: Lock down in production
  // Uncomment to disable in production:
  // if (import.meta.env.PROD) {
  //   throw new Response('Not available in production', {status: 404});
  // }

  const response = await fetch(
    `https://${context.env.PUBLIC_CHECKOUT_DOMAIN}/api/${params.version}/graphql.json`,
    {
      method: 'POST',
      body: request.body,
      headers: request.headers,
    },
  );

  return new Response(response.body, {headers: new Headers(response.headers)});
}
