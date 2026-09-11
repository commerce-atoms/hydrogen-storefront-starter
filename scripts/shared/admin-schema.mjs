// @ts-check
/*
 * Shared Shopify Admin API helpers for schema provisioning scripts.
 *
 * Purpose
 * -------
 * Every metafield-backed feature module in this starter (see
 * `docs/reference/metaobjects.md`) needs an idempotent setup script that
 * ensures its Shopify custom-data definitions exist. This module extracts
 * the common boilerplate so each `scripts/setup-*.mjs` is a thin
 * declaration of its schema, not a re-implementation of admin plumbing.
 *
 * What it provides
 * ----------------
 *   - requireEnv()                            — fail-fast env var check
 *   - createAdminClient({endpoint, token})    — bound Admin API fetcher
 *   - ensureMetaobjectDefinition({...})       — idempotent metaobject upsert
 *   - ensureMetafieldDefinition({...})        — idempotent metafield upsert
 *   - assertNoUserErrors(errs, opName)        — Shopify userErrors handler
 *
 * What it does not provide
 * ------------------------
 *   - Domain knowledge. No colours, no compliance, no anything. Callers
 *     pass fully-declared field lists and definition inputs.
 *   - Deletion. Definitions are additive; removals require an admin action.
 *   - Metaobject *entry* provisioning. Only *definitions*.
 *   - Runtime access. Storefront queries use the Storefront API, not this.
 *
 * Auth
 * ----
 *   PUBLIC_STORE_DOMAIN               your-shop.myshopify.com
 *   PRIVATE_ADMIN_API_ACCESS_TOKEN    Admin API token with the definition
 *                                     scopes required by whichever mutations
 *                                     the caller runs (typically
 *                                     write_metaobject_definitions plus
 *                                     write_metaobjects for metaobject
 *                                     features, plus Custom data admin
 *                                     access for metafield definitions).
 *
 * Loaded from `process.env`; the script never shells out to Shopify CLI.
 *
 * The Admin API version is pinned here so setup scripts do not silently
 * drift when Shopify bumps the default. Bumping is a deliberate change.
 */

export const ADMIN_API_VERSION = '2026-04';

/**
 * Fail-fast env check. Call at the top of each setup script.
 *
 * @returns {{shop: string, token: string, endpoint: string}}
 */
export function requireEnv() {
  const shop = process.env.PUBLIC_STORE_DOMAIN?.trim();
  const token = process.env.PRIVATE_ADMIN_API_ACCESS_TOKEN?.trim();

  if (!shop || !token) {
    console.error(
      'Missing env vars. Set PUBLIC_STORE_DOMAIN and PRIVATE_ADMIN_API_ACCESS_TOKEN.',
    );
    console.error(
      'The admin token needs the write scopes for whichever definitions you are provisioning.',
    );
    process.exit(1);
  }

  return {
    shop,
    token,
    endpoint: `https://${shop}/admin/api/${ADMIN_API_VERSION}/graphql.json`,
  };
}

/**
 * Build a bound Admin API fetcher. Unwraps HTTP + top-level `errors`;
 * caller still handles Shopify's per-mutation `userErrors` via
 * `assertNoUserErrors` (a userError is a business-rule failure, not an
 * infra failure — different semantics).
 *
 * @param {{endpoint: string, token: string}} opts
 * @returns {(query: string, variables?: Record<string, unknown>) => Promise<any>}
 */
export function createAdminClient({endpoint, token}) {
  return async function admin(query, variables) {
    const res = await fetch(endpoint, {
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
 * @property {string} type               Machine name (snake_case).
 * @property {string} name               Human label in admin.
 * @property {string} [description]      Optional help text.
 * @property {ReadonlyArray<MetaobjectFieldSpec>} fields
 */

/**
 * Idempotent: create the metaobject definition if missing; otherwise add
 * any fields the caller has since introduced.
 *
 * Existing fields are never modified — merchant admin is the source of
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
 *                                         module-scoped names — the merchant
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
 * If a definition already exists, this helper does **not** patch it —
 * it warns loudly when storefront access diverges from the requested
 * value. Repointing an existing definition (owner, type, validations)
 * is destructive; do it in admin with merchant intent, then re-run.
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
        `  Update the definition manually in Settings → Custom data → ${ownerType}, or delete it and re-run.`,
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
