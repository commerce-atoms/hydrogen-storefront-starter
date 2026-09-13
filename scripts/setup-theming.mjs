#!/usr/bin/env node
// @ts-check
/*
 * Idempotently provisions the Shopify custom-data definitions required by
 * the optional per-collection theming module in `app/platform/theming/`:
 *
 *   1. A metaobject definition of type `store_theme_preset` with N color fields.
 *   2. A metafield definition on Collection with namespace `theme`, key
 *      `preset`, and type `metaobject_reference` scoped to `store_theme_preset`.
 *      Storefront access is set to PUBLIC_READ so the Storefront API can
 *      resolve the reference.
 *
 * Re-running the script is safe: existing definitions are detected and
 * left alone; missing fields are added in place.
 *
 * See `docs/reference/setup-scripts.md` for the pattern this script
 * follows and `docs/reference/metaobjects.md` for the wider architecture.
 */

import {
  requireEnv,
  createAdminClient,
  ensureMetaobjectDefinition,
  ensureMetafieldDefinition,
  ADMIN_API_VERSION,
} from './shared/admin-schema.mjs';

/**
 * `field` on the `Theme` interface (camelCase) to metaobject field key
 * (snake_case, Shopify convention).
 *
 * Must stay in lockstep with `THEME_PALETTE_FIELD_MAP` in
 * `app/platform/theming/types.ts`.
 *
 * @type {ReadonlyArray<{key: string, name: string, type: string}>}
 */
const PALETTE_FIELDS = [
  {key: 'background', name: 'Background', type: 'color'},
  {key: 'surface', name: 'Surface', type: 'color'},
  {key: 'surface_secondary', name: 'Surface (secondary)', type: 'color'},
  {key: 'text_primary', name: 'Text (primary)', type: 'color'},
  {key: 'text_secondary', name: 'Text (secondary)', type: 'color'},
  {key: 'border', name: 'Border', type: 'color'},
  {key: 'border_light', name: 'Border (light)', type: 'color'},
  {key: 'accent', name: 'Accent', type: 'color'},
  {key: 'accent_hover', name: 'Accent (hover)', type: 'color'},
  {key: 'accent_secondary', name: 'Accent (secondary)', type: 'color'},
];

async function main() {
  const env = requireEnv();
  const admin = await createAdminClient(env);

  console.log(`Provisioning theming on ${env.shop} (Admin API ${ADMIN_API_VERSION})`);

  const metaobjectDefinitionId = await ensureMetaobjectDefinition({
    admin,
    type: '$app:store_theme_preset',
    name: 'Theme palette',
    description:
      'A colour palette applied to any collection whose theme.preset metafield points at it.',
    fields: PALETTE_FIELDS,
  });

  await ensureMetafieldDefinition({
    admin,
    ownerType: 'COLLECTION',
    namespace: 'theme',
    key: 'preset',
    name: 'Theme preset',
    description:
      'Optional palette applied to this collection. Assign a Theme palette metaobject.',
    type: 'metaobject_reference',
    validations: [
      {name: 'metaobject_definition_id', value: metaobjectDefinitionId},
    ],
    storefrontAccess: 'PUBLIC_READ',
  });

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
