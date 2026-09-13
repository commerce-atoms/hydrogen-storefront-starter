// @ts-check
/*
 * Shared Shopify Admin API helpers for schema provisioning scripts.
 *
 * Purpose
 * -------
 * Every metafield-backed feature module needs an idempotent setup script
 * that ensures its Shopify custom-data definitions exist. This module
 * extracts the common boilerplate so each `scripts/setup-*.mjs` is a thin
 * declaration of its schema, not a re-implementation of admin plumbing.
 *
 * What it provides
 * ----------------
 *   - requireEnv()                            fail-fast env var check
 *   - createAdminClient(env)                  bound Admin API fetcher
 *                                             (async: exchanges Dev
 *                                             Dashboard credentials for
 *                                             a token when needed)
 *   - exchangeClientCredentialsForToken(...)  Dev Dashboard token grant
 *   - ensureMetaobjectDefinition({...})       idempotent metaobject upsert
 *   - ensureMetafieldDefinition({...})        idempotent metafield upsert
 *   - assertNoUserErrors(errs, opName)        Shopify userErrors handler
 *
 * What it does not provide
 * ------------------------
 *   - Domain knowledge. No colours, no compliance, no anything. Callers
 *     pass fully-declared field lists and definition inputs.
 *   - Deletion. Definitions are additive; removals require an admin action.
 *   - Metaobject *entry* provisioning. Only *definitions*.
 *   - Runtime access. Storefront queries use the Storefront API, not this.
 *
 * Auth (two flows supported)
 * --------------------------
 *
 *   PUBLIC_STORE_DOMAIN               your-shop.myshopify.com
 *
 * Flow A: Dev Dashboard app (current, required for stores where legacy
 * custom apps cannot be created, i.e. new stores after 1 January 2026):
 *
 *   SHOPIFY_APP_CLIENT_ID             from Dev Dashboard -> Settings
 *   SHOPIFY_APP_CLIENT_SECRET         from Dev Dashboard -> Settings
 *
 *   The helper exchanges these for a 24-hour Admin API token via
 *   POST /admin/oauth/access_token (client_credentials grant). Same
 *   organisation only. See
 *   https://shopify.dev/docs/apps/build/dev-dashboard/get-api-access-tokens
 *
 * Flow B: Legacy custom app (only works for stores that already have
 * one; cannot be created after 1 January 2026):
 *
 *   PRIVATE_ADMIN_API_ACCESS_TOKEN    static shpat_* token from admin
 *                                     -> Apps -> Develop apps
 *
 * If both are set, the static token wins (least surprising for scripted
 * environments). If neither is set, the helper exits with a clear error.
 *
 * The token / app needs the scopes required by whichever mutations the
 * caller runs (typically write_metaobject_definitions plus
 * write_metafield_definitions, and matching read scopes).
 *
 * The Admin API version is pinned here so setup scripts do not silently
 * drift when Shopify bumps the default. Bumping is a deliberate change.
 */

export const ADMIN_API_VERSION = '2026-04';

/**
 * @typedef {Object} AdminEnv
 * @property {string} shop
 * @property {string} endpoint
 * @property {string} [token]           Direct static token (legacy custom app).
 * @property {string} [clientId]        Dev Dashboard app Client ID.
 * @property {string} [clientSecret]    Dev Dashboard app Client secret.
 */

/**
 * Fail-fast env check. Call at the top of each setup script.
 *
 * @returns {AdminEnv}
 */
export function requireEnv() {
  const shop = process.env.PUBLIC_STORE_DOMAIN?.trim();
  const token = process.env.PRIVATE_ADMIN_API_ACCESS_TOKEN?.trim();
  const clientId = process.env.SHOPIFY_APP_CLIENT_ID?.trim();
  const clientSecret = process.env.SHOPIFY_APP_CLIENT_SECRET?.trim();

  if (!shop) {
    console.error(
      'Missing PUBLIC_STORE_DOMAIN (e.g. your-shop.myshopify.com).',
    );
    process.exit(1);
  }

  // A placeholder value like `shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
  // is treated as unset so a stale .env does not silently short-circuit
  // the newer client-credentials path.
  const looksLikePlaceholder =
    typeof token === 'string' && /^shpat_x{5,}$/.test(token);
  const hasStaticToken = Boolean(token) && !looksLikePlaceholder;
  const hasClientCredentials = Boolean(clientId && clientSecret);

  if (!hasStaticToken && !hasClientCredentials) {
    console.error('Missing Admin API credentials. Set one of:');
    console.error(
      '  1. SHOPIFY_APP_CLIENT_ID + SHOPIFY_APP_CLIENT_SECRET (Dev Dashboard app).',
    );
    console.error(
      '  2. PRIVATE_ADMIN_API_ACCESS_TOKEN (legacy custom app; pre-2026 stores only).',
    );
    console.error(
      'Dev Dashboard: https://shopify.dev/docs/apps/build/dev-dashboard/get-api-access-tokens',
    );
    process.exit(1);
  }

  return {
    shop,
    endpoint: `https://${shop}/admin/api/${ADMIN_API_VERSION}/graphql.json`,
    ...(hasStaticToken ? {token} : {}),
    ...(hasClientCredentials ? {clientId, clientSecret} : {}),
  };
}

/**
 * Exchange Dev Dashboard client credentials for a 24-hour Admin API
 * access token. Same-organisation only.
 *
 * Ref: https://shopify.dev/docs/apps/build/authentication-authorization/client-credentials-grant
 *
 * @param {{shop: string, clientId: string, clientSecret: string}} opts
 * @returns {Promise<string>}
 */
export async function exchangeClientCredentialsForToken({
  shop,
  clientId,
  clientSecret,
}) {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `Token exchange failed: ${res.status} ${res.statusText}\n${text}\n` +
        'Common causes: app and store are not in the same Dev Dashboard organisation; ' +
        'client_id / client_secret mismatch; app version not released; app not installed on the store.',
    );
  }

  const json =
    /** @type {{access_token?: string, error?: string, error_description?: string}} */ (
      await res.json()
    );

  if (!json.access_token) {
    throw new Error(
      `Token exchange returned no access_token: ${JSON.stringify(json)}`,
    );
  }
  return json.access_token;
}

/**
 * Build a bound Admin API fetcher. Resolves an access token from the env
 * (either the static `token` or by exchanging client credentials).
 *
 * The fetcher unwraps HTTP + top-level `errors`; callers still handle
 * Shopify's per-mutation `userErrors` via `assertNoUserErrors` (a
 * userError is a business-rule failure, not an infra failure).
 *
 * @param {AdminEnv} env
 * @returns {Promise<(query: string, variables?: Record<string, unknown>) => Promise<any>>}
 */
export async function createAdminClient(env) {
  const token = await resolveAccessToken(env);

  return async function admin(query, variables) {
    const res = await fetch(env.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({query, variables}),
    });

    if (!res.ok) {
      throw new Error(
        `Admin API request failed: ${res.status} ${res.statusText}`,
      );
    }

    const json = /** @type {{data?: unknown, errors?: unknown}} */ (
      await res.json()
    );

    if (json.errors) {
      throw new Error(
        `Admin API returned errors:\n${JSON.stringify(json.errors, null, 2)}`,
      );
    }

    return json.data;
  };
}

/**
 * @param {AdminEnv} env
 * @returns {Promise<string>}
 */
async function resolveAccessToken(env) {
  if (env.token) {
    return env.token;
  }
  if (env.clientId && env.clientSecret) {
    return exchangeClientCredentialsForToken({
      shop: env.shop,
      clientId: env.clientId,
      clientSecret: env.clientSecret,
    });
  }
  // requireEnv() guarantees one of the two; kept for callers that build
  // an AdminEnv manually.
  throw new Error(
    'AdminEnv is missing both `token` and `clientId`/`clientSecret`.',
  );
}

/**
 * Throw when a Shopify mutation returns userErrors. Idempotent-safe:
 * missing or empty arrays are ignored.
 *
 * @param {unknown} errs
 * @param {string} opName
 */
export function assertNoUserErrors(errs, opName) {
  if (Array.isArray(errs) && errs.length > 0) {
    throw new Error(`${opName} failed:\n${JSON.stringify(errs, null, 2)}`);
  }
}

/**
 * @typedef {Object} MetaobjectFieldSpec
 * @property {string} key                Field key. Snake_case, Shopify convention.
 * @property {string} name               Human label shown in admin.
 * @property {string} type               Shopify metafield type (`color`,
 *                                       `single_line_text_field`,
 *                                       `multi_line_text_field`, `integer`,
 *                                       `boolean`, `rich_text_field`,
 *                                       `date`, `dimension`, `weight`,
 *                                       `json`, `list.*`, etc.).
 * @property {string} [description]      Optional field help text.
 * @property {boolean} [required]        Default `false`.
 * @property {ReadonlyArray<{name: string, value: string}>} [validations]
 *                                       Type-specific validations
 *                                       (e.g. `metaobject_definition_id`
 *                                       for `metaobject_reference`).
 */

/**
 * @typedef {Object} MetaobjectDefinitionSpec
 * @property {(query: string, variables?: Record<string, unknown>) => Promise<any>} admin
 * @property {string} type               Machine name. Prefix with `$app:`
 *                                       (e.g. `$app:store_theme_preset`)
 *                                       for app-owned definitions.
 *                                       Required for Dev Dashboard apps;
 *                                       merchant-owned bare types are
 *                                       rejected with NOT_AUTHORIZED for
 *                                       stores created after 1 Jan 2026.
 * @property {string} name               Human label in admin.
 * @property {string} [description]      Optional help text.
 * @property {ReadonlyArray<MetaobjectFieldSpec>} fields
 */

/**
 * Idempotent: create the metaobject definition if missing; otherwise add
 * any fields the caller has since introduced.
 *
 * Existing fields are never modified. Merchant admin is the source of
 * truth for label / description / validation edits, and touching them
 * here would fight with merchant intent.
 *
 * Returns the definition's Shopify ID (useful for callers that need to
 * reference it from a `metaobject_reference` metafield validation).
 *
 * @param {MetaobjectDefinitionSpec} spec
 * @returns {Promise<string>}
 */
export async function ensureMetaobjectDefinition({
  admin,
  type,
  name,
  description,
  fields,
}) {
  const existing = /** @type {any} */ (
    await admin(
      `query MetaobjectDefinitionByType($type: String!) {
        metaobjectDefinitionByType(type: $type) {
          id
          fieldDefinitions { key }
        }
      }`,
      {type},
    )
  );

  if (existing?.metaobjectDefinitionByType) {
    const {id, fieldDefinitions} = existing.metaobjectDefinitionByType;
    const existingKeys = new Set(
      fieldDefinitions.map((/** @type {{key: string}} */ f) => f.key),
    );
    const missing = fields.filter((f) => !existingKeys.has(f.key));

    if (missing.length === 0) {
      console.log(`  ${type} metaobject definition already present`);
      return id;
    }

    console.log(
      `  extending ${type} with missing fields: ${missing
        .map((f) => f.key)
        .join(', ')}`,
    );

    const updated = /** @type {any} */ (
      await admin(
        `mutation UpdateMetaobjectDefinition($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
          metaobjectDefinitionUpdate(id: $id, definition: $definition) {
            userErrors { field message }
          }
        }`,
        {
          id,
          definition: {
            fieldDefinitions: missing.map((f) => ({
              create: fieldToCreateInput(f),
            })),
          },
        },
      )
    );

    assertNoUserErrors(
      updated?.metaobjectDefinitionUpdate?.userErrors,
      `Could not extend ${type}`,
    );
    return id;
  }

  console.log(`  creating ${type} metaobject definition`);

  // `access.admin` is only permitted on app-owned (`$app:`-prefixed)
  // definitions; supplying it on merchant-owned types is rejected with
  // ADMIN_ACCESS_INPUT_NOT_ALLOWED. `access.storefront: PUBLIC_READ`
  // is safe on either shape and required for Storefront API reads.
  const isAppOwned = type.startsWith('$app:');
  const access = isAppOwned
    ? {admin: 'MERCHANT_READ_WRITE', storefront: 'PUBLIC_READ'}
    : {storefront: 'PUBLIC_READ'};

  const created = /** @type {any} */ (
    await admin(
      `mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
        metaobjectDefinitionCreate(definition: $definition) {
          metaobjectDefinition { id }
          userErrors { field message }
        }
      }`,
      {
        definition: {
          type,
          name,
          ...(description ? {description} : {}),
          access,
          fieldDefinitions: fields.map(fieldToCreateInput),
        },
      },
    )
  );

  assertNoUserErrors(
    created?.metaobjectDefinitionCreate?.userErrors,
    `metaobjectDefinitionCreate(${type})`,
  );

  const id = created?.metaobjectDefinitionCreate?.metaobjectDefinition?.id;
  if (typeof id !== 'string') {
    throw new Error(`metaobjectDefinitionCreate(${type}) returned no id`);
  }
  return id;
}

/**
 * @param {MetaobjectFieldSpec} f
 */
function fieldToCreateInput(f) {
  return {
    key: f.key,
    name: f.name,
    type: f.type,
    ...(f.description ? {description: f.description} : {}),
    ...(f.required ? {required: true} : {}),
    ...(f.validations && f.validations.length > 0
      ? {validations: f.validations}
      : {}),
  };
}

/**
 * @typedef {Object} MetafieldDefinitionSpec
 * @property {(query: string, variables?: Record<string, unknown>) => Promise<any>} admin
 * @property {string} ownerType            `PRODUCT` | `COLLECTION` | `SHOP` |
 *                                          `CUSTOMER` | `ORDER` | ...
 *                                         (Shopify `MetafieldOwnerType` enum).
 * @property {string} namespace            Scoping namespace. Reserve short
 *                                         module-scoped names; the merchant
 *                                         admin shows them.
 * @property {string} key                  Field key within the namespace.
 * @property {string} name                 Human label shown in admin.
 * @property {string} [description]        Optional help text.
 * @property {string} type                 Shopify metafield type.
 * @property {ReadonlyArray<{name: string, value: string}>} [validations]
 * @property {'PUBLIC_READ' | 'NONE'} [storefrontAccess]
 *                                         Defaults to `PUBLIC_READ` so the
 *                                         Storefront API can resolve it. Set
 *                                         `NONE` for admin-only fields (rare
 *                                         in a storefront starter).
 */

/**
 * Idempotent: create the metafield definition if missing.
 *
 * If a definition already exists, this helper does not patch it. It
 * warns loudly when storefront access diverges from the requested value.
 * Repointing an existing definition (owner, type, validations) is
 * destructive; do it in admin with merchant intent, then re-run.
 *
 * @param {MetafieldDefinitionSpec} spec
 */
export async function ensureMetafieldDefinition({
  admin,
  ownerType,
  namespace,
  key,
  name,
  description,
  type,
  validations,
  storefrontAccess = 'PUBLIC_READ',
}) {
  const existing = /** @type {any} */ (
    await admin(
      `query ExistingDef($ownerType: MetafieldOwnerType!, $namespace: String!, $key: String!) {
        metafieldDefinitions(first: 1, ownerType: $ownerType, namespace: $namespace, key: $key) {
          nodes { id access { storefront } }
        }
      }`,
      {ownerType, namespace, key},
    )
  );

  const node = existing?.metafieldDefinitions?.nodes?.[0];
  if (node) {
    if (node.access?.storefront !== storefrontAccess) {
      console.warn(
        `  ${namespace}.${key} metafield exists but storefront access is ${node.access?.storefront ?? 'unset'} (expected ${storefrontAccess}).`,
      );
      console.warn(
        `  Update the definition manually in Settings -> Custom data -> ${ownerType}, or delete it and re-run.`,
      );
    } else {
      console.log(
        `  ${namespace}.${key} metafield definition already present`,
      );
    }
    return;
  }

  console.log(
    `  creating ${namespace}.${key} metafield definition on ${ownerType}`,
  );

  const created = /** @type {any} */ (
    await admin(
      `mutation CreateMetafieldDef($definition: MetafieldDefinitionInput!) {
        metafieldDefinitionCreate(definition: $definition) {
          createdDefinition { id }
          userErrors { field message code }
        }
      }`,
      {
        definition: {
          name,
          namespace,
          key,
          ...(description ? {description} : {}),
          ownerType,
          type,
          ...(validations && validations.length > 0 ? {validations} : {}),
          access: {storefront: storefrontAccess},
        },
      },
    )
  );

  assertNoUserErrors(
    created?.metafieldDefinitionCreate?.userErrors,
    `metafieldDefinitionCreate(${namespace}.${key})`,
  );
}
