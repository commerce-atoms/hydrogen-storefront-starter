#!/usr/bin/env node
// @ts-check
/*
 * Idempotently provisions the Shopify custom-data definitions required by
 * the optional per-collection theming module in `app/platform/theming/`:
 *
 *   1. A metaobject definition of type `theme_palette` with 10 color fields.
 *   2. A metafield definition on Collection with namespace `theme`, key
 *      `preset`, and type `metaobject_reference` scoped to `theme_palette`.
 *      Storefront access is set to PUBLIC_READ so the Storefront API can
 *      resolve the reference.
 *
 * Re-running the script is safe: existing definitions are detected and left
 * alone.
 *
 * Auth
 * ----
 *   PUBLIC_STORE_DOMAIN               your-shop.myshopify.com (also read by
 *                                     the app at runtime)
 *   PRIVATE_ADMIN_API_ACCESS_TOKEN    Admin API access token with the scope
 *                                     `write_metaobject_definitions` and
 *                                     `write_metaobjects`
 *
 * Both are loaded from the process environment; the script does not shell
 * out to Shopify CLI. Set them however you already manage secrets (`.env`,
 * `direnv`, a secret manager, etc.).
 *
 * The Admin API version this script targets is deliberately pinned so the
 * script does not silently drift when Shopify bumps the default.
 */

const ADMIN_API_VERSION = '2026-04';

const SHOP = process.env.PUBLIC_STORE_DOMAIN?.trim();
const TOKEN = process.env.PRIVATE_ADMIN_API_ACCESS_TOKEN?.trim();

if (!SHOP || !TOKEN) {
  console.error(
    'Missing env vars. Set PUBLIC_STORE_DOMAIN and PRIVATE_ADMIN_API_ACCESS_TOKEN.',
  );
  console.error(
    'The admin token needs write_metaobject_definitions and write_metaobjects scopes.',
  );
  process.exit(1);
}

const ENDPOINT = `https://${SHOP}/admin/api/${ADMIN_API_VERSION}/graphql.json`;

/**
 * `field` on the `CollectionTheme` interface (camelCase) →
 * metaobject field key (snake_case, Shopify convention).
 *
 * Must stay in lockstep with `THEME_PALETTE_FIELD_MAP` in
 * `app/platform/theming/types.ts`.
 */
const PALETTE_FIELDS = [
  {key: 'background', name: 'Background'},
  {key: 'surface', name: 'Surface'},
  {key: 'surface_secondary', name: 'Surface (secondary)'},
  {key: 'text_primary', name: 'Text (primary)'},
  {key: 'text_secondary', name: 'Text (secondary)'},
  {key: 'border', name: 'Border'},
  {key: 'border_light', name: 'Border (light)'},
  {key: 'accent', name: 'Accent'},
  {key: 'accent_hover', name: 'Accent (hover)'},
  {key: 'accent_secondary', name: 'Accent (secondary)'},
];

/**
 * @param {string} query
 * @param {Record<string, unknown>} [variables]
 */
async function admin(query, variables) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': TOKEN,
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
}

async function ensureMetaobjectDefinition() {
  const existing = /** @type {any} */ (
    await admin(`{
      metaobjectDefinitionByType(type: "theme_palette") {
        id
        fieldDefinitions { key }
      }
    }`)
  );

  if (existing?.metaobjectDefinitionByType) {
    const {id, fieldDefinitions} = existing.metaobjectDefinitionByType;
    const existingKeys = new Set(
      fieldDefinitions.map((/** @type {{key: string}} */ f) => f.key),
    );
    const missing = PALETTE_FIELDS.filter((f) => !existingKeys.has(f.key));

    if (missing.length === 0) {
      console.log('  theme_palette metaobject definition already present');
      return id;
    }

    // Add any fields the caller has since introduced to PALETTE_FIELDS.
    console.log(
      `  extending theme_palette with missing fields: ${missing
        .map((f) => f.key)
        .join(', ')}`,
    );
    const updated = /** @type {any} */ (
      await admin(
        `mutation UpdateThemePalette($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
          metaobjectDefinitionUpdate(id: $id, definition: $definition) {
            userErrors { field message }
          }
        }`,
        {
          id,
          definition: {
            fieldDefinitions: missing.map((f) => ({
              create: {key: f.key, name: f.name, type: 'color'},
            })),
          },
        },
      )
    );
    const errs = updated?.metaobjectDefinitionUpdate?.userErrors;
    if (Array.isArray(errs) && errs.length > 0) {
      throw new Error(`Could not extend theme_palette:\n${JSON.stringify(errs, null, 2)}`);
    }
    return id;
  }

  console.log('  creating theme_palette metaobject definition');
  const created = /** @type {any} */ (
    await admin(
      `mutation CreateThemePalette($definition: MetaobjectDefinitionCreateInput!) {
        metaobjectDefinitionCreate(definition: $definition) {
          metaobjectDefinition { id }
          userErrors { field message }
        }
      }`,
      {
        definition: {
          type: 'theme_palette',
          name: 'Theme palette',
          description:
            'A colour palette applied to any collection whose theme.preset metafield points at it.',
          fieldDefinitions: PALETTE_FIELDS.map((f) => ({
            key: f.key,
            name: f.name,
            type: 'color',
          })),
        },
      },
    )
  );

  const errs = created?.metaobjectDefinitionCreate?.userErrors;
  if (Array.isArray(errs) && errs.length > 0) {
    throw new Error(
      `metaobjectDefinitionCreate failed:\n${JSON.stringify(errs, null, 2)}`,
    );
  }

  const id = created?.metaobjectDefinitionCreate?.metaobjectDefinition?.id;
  if (typeof id !== 'string') {
    throw new Error('metaobjectDefinitionCreate returned no id');
  }
  return id;
}

/**
 * @param {string} metaobjectDefinitionId
 */
async function ensureCollectionMetafield(metaobjectDefinitionId) {
  const existing = /** @type {any} */ (
    await admin(`{
      metafieldDefinitions(first: 1, ownerType: COLLECTION, namespace: "theme", key: "preset") {
        nodes { id access { storefront } }
      }
    }`)
  );

  const node = existing?.metafieldDefinitions?.nodes?.[0];
  if (node) {
    if (node.access?.storefront !== 'PUBLIC_READ') {
      console.warn(
        '  theme.preset metafield exists but storefront access is not PUBLIC_READ — the storefront cannot read it.',
      );
      console.warn(
        '  Update the definition manually in Settings → Custom data → Collections, or delete it and re-run this script.',
      );
    } else {
      console.log('  theme.preset metafield definition already present');
    }
    return;
  }

  console.log('  creating theme.preset metafield definition on Collection');
  const created = /** @type {any} */ (
    await admin(
      `mutation CreateThemePreset($definition: MetafieldDefinitionInput!) {
        metafieldDefinitionCreate(definition: $definition) {
          createdDefinition { id }
          userErrors { field message code }
        }
      }`,
      {
        definition: {
          name: 'Theme preset',
          namespace: 'theme',
          key: 'preset',
          description:
            'Optional palette applied to this collection. Assign a Theme palette metaobject.',
          ownerType: 'COLLECTION',
          type: 'metaobject_reference',
          validations: [
            {name: 'metaobject_definition_id', value: metaobjectDefinitionId},
          ],
          access: {storefront: 'PUBLIC_READ'},
        },
      },
    )
  );

  const errs = created?.metafieldDefinitionCreate?.userErrors;
  if (Array.isArray(errs) && errs.length > 0) {
    throw new Error(
      `metafieldDefinitionCreate failed:\n${JSON.stringify(errs, null, 2)}`,
    );
  }
}

async function main() {
  console.log(`Provisioning theming on ${SHOP} (Admin API ${ADMIN_API_VERSION})`);
  const metaobjectDefinitionId = await ensureMetaobjectDefinition();
  await ensureCollectionMetafield(metaobjectDefinitionId);

  console.log('\nDone.');
  console.log('Next steps in Shopify admin:');
  console.log(
    '  1. Content → Metaobjects → Theme palette: create one or more palettes.',
  );
  console.log(
    '  2. Collections → <your collection> → Metafields → Theme preset: pick a palette.',
  );
  console.log(
    '  3. Load the collection page — the palette applies automatically.',
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
