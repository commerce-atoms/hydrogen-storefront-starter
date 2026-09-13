# Setup Scripts

How to provision Shopify custom-data schema (metaobjects, metafields) from code, idempotently, using the shared Admin API helpers in `scripts/shared/admin-schema.mjs`.

**Single Responsibility**: Give every metafield-backed feature a repeatable, version-controlled provisioning path.

**See Also:**

- [metaobjects.md](metaobjects.md) - The metafield-backed feature pattern (setup scripts are step 1 of 5)
- [collection-theming.md](collection-theming.md) - Reference implementation
- [Shopify Admin API. Metafield definitions](https://shopify.dev/docs/api/admin-graphql/latest/mutations/metafieldDefinitionCreate)
- [Shopify Admin API. Metaobject definitions](https://shopify.dev/docs/api/admin-graphql/latest/mutations/metaobjectDefinitionCreate)

---

## Why setup scripts exist

Shopify's own documentation for Hydrogen storefronts recommends creating metafield and metaobject definitions **manually in the admin UI** (Settings → Custom data). That works for a first pass, but it does not survive team growth:

- Definitions are not version-controlled.
- Reproducing a store from scratch requires human clicks.
- Field additions to an existing definition are silent and unauditable.
- New environments (staging, preview stores) drift from production.

Setup scripts fill that gap. They wrap the same Admin API mutations Shopify calls when a merchant clicks "Save" in the admin, but drive them from code that lives beside the module that consumes the schema.

Setup scripts are **not** a replacement for admin UI. Merchants still edit labels, descriptions, and validations in admin. Scripts guarantee the schema exists in a known shape; humans curate everything past that.

---

## When to write a setup script

Write `scripts/setup-<feature>.mjs` when a new module needs Shopify custom-data definitions. Rules of thumb:

- **One script per module.** `setup-theming.mjs` provisions everything the theming module needs.
- **Definitions only, never entries.** Scripts create the schema (the "table"). Merchants populate entries (the "rows") in admin.
- **Idempotent.** Re-running must be safe. The shared helpers handle this. The script author only declares the schema.
- **Named after the module, not the concept.** `setup-<module>.mjs` matches `app/platform/<module>/` (or `app/modules/<module>/`).

Skip a setup script when:

- The module consumes only Shopify's built-in fields (product title, description, images, variants, tags).
- The schema is truly one-off and merchant-authored end-to-end (e.g. a single ad-hoc admin field the merchant maintains).

---

## Anatomy of a setup script

Every script follows the same shape.

```javascript
#!/usr/bin/env node
// @ts-check

import {
  requireEnv,
  createAdminClient,
  ensureMetaobjectDefinition,
  ensureMetafieldDefinition,
  ADMIN_API_VERSION,
} from './shared/admin-schema.mjs';

/**
 * @type {ReadonlyArray<{key: string, name: string, type: string}>}
 */
const FIELDS = [
  {key: 'title', name: 'Title', type: 'single_line_text_field'},
  {key: 'body', name: 'Body', type: 'rich_text_field'},
];

async function main() {
  const env = requireEnv();
  const admin = await createAdminClient(env);

  console.log(`Provisioning my-feature on ${env.shop} (Admin API ${ADMIN_API_VERSION})`);

  const defId = await ensureMetaobjectDefinition({
    admin,
    type: 'my_feature',
    name: 'My feature',
    description: 'What this metaobject represents.',
    fields: FIELDS,
  });

  await ensureMetafieldDefinition({
    admin,
    ownerType: 'PRODUCT',
    namespace: 'my_feature',
    key: 'config',
    name: 'My feature config',
    description: 'Assign a My feature metaobject.',
    type: 'metaobject_reference',
    validations: [{name: 'metaobject_definition_id', value: defId}],
    storefrontAccess: 'PUBLIC_READ',
  });

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
```

Register it in `package.json`:

```json
{
  "scripts": {
    "setup:my-feature": "node scripts/setup-my-feature.mjs"
  }
}
```

Run it:

```bash
npm run setup:my-feature
```

---

## The shared helpers

All helpers live in [`scripts/shared/admin-schema.mjs`](././scripts/shared/admin-schema.mjs). They are domain-agnostic. No colours, no compliance, no anything specific. Callers pass fully-declared schema.

### `requireEnv()`

Fail-fast env check. Reads `PUBLIC_STORE_DOMAIN` plus **one** of:

- `SHOPIFY_APP_CLIENT_ID` + `SHOPIFY_APP_CLIENT_SECRET` (Dev Dashboard app), or
- `PRIVATE_ADMIN_API_ACCESS_TOKEN` (legacy custom app; pre-2026 stores only).

Exits with code 1 and a clear message if credentials are missing. If both are set, the static token wins (least surprising for scripted environments).

Returns an `AdminEnv` object with `shop`, `endpoint`, and either `token` or `clientId` + `clientSecret`.

### `createAdminClient(env)` (async)

Builds a bound Admin API fetcher. If `env` carries client credentials rather than a static token, it exchanges them for a 24-hour access token via `POST /admin/oauth/access_token` (client_credentials grant) before returning.

Returns a `Promise<(query, variables) => Promise<data>>`. Unwraps HTTP and top-level GraphQL `errors`. Per-mutation `userErrors` (business-rule failures) are still handled by the caller via `assertNoUserErrors`.

### `exchangeClientCredentialsForToken({shop, clientId, clientSecret})`

Direct access to the token exchange, exposed for callers that build an `AdminEnv` by hand or need to cache the token. `createAdminClient` calls it internally.

### `ensureMetaobjectDefinition({admin, type, name, description?, fields})`

Idempotent metaobject definition upsert.

- If the definition does not exist, creates it with the given fields.
- If it exists and matches, no-op.
- If it exists but is missing fields the caller has since declared, adds those fields in place.
- Existing fields are never modified. Merchant admin owns label / description / validation edits.

Returns the definition's Shopify ID (useful for `metaobject_reference` validations).

### `ensureMetafieldDefinition({admin, ownerType, namespace, key, name, description?, type, validations?, storefrontAccess?})`

Idempotent metafield definition upsert.

- If the definition does not exist, creates it.
- If it exists and storefront access matches the requested value, no-op.
- If it exists but storefront access diverges, warns loudly and does **not** patch. Repointing an existing definition is destructive; do it in admin with merchant intent, then re-run.

`storefrontAccess` defaults to `PUBLIC_READ` so the Storefront API can resolve the field. Set `NONE` for admin-only fields (rare in a storefront starter).

### `assertNoUserErrors(errs, opName)`

Throws when a Shopify mutation returns `userErrors`. Missing or empty arrays are ignored. Callers rarely need this directly. The ensure-\* helpers use it internally.

### `ADMIN_API_VERSION`

Exported constant. The Admin API version is pinned so scripts do not silently drift when Shopify bumps the default. Bumping is a deliberate change (one commit, one review).

---

## Auth

Setup scripts always read `PUBLIC_STORE_DOMAIN` (`your-shop.myshopify.com`, same variable the app reads at runtime), plus one of two credential flows.

### Flow A. Dev Dashboard app (current)

| Var | Purpose |
|---|---|
| `SHOPIFY_APP_CLIENT_ID` | Client ID from Dev Dashboard → Settings. |
| `SHOPIFY_APP_CLIENT_SECRET` | Client secret from Dev Dashboard → Settings. |

The helper exchanges these for a 24-hour Admin API token via `POST /admin/oauth/access_token` (client_credentials grant). Same-organisation only. See the [Shopify docs](https://shopify.dev/docs/apps/build/dev-dashboard/get-api-access-tokens).

This is the only path Shopify supports for stores where legacy custom apps cannot be created (new stores after 1 January 2026).

Required scopes on the Dev Dashboard app:

- `write_metaobject_definitions`, `read_metaobject_definitions`
- `write_metafield_definitions`, `read_metafield_definitions`

### Flow B. Legacy custom app (deprecated)

| Var | Purpose |
|---|---|
| `PRIVATE_ADMIN_API_ACCESS_TOKEN` | Static `shpat_*` Admin API token from a legacy custom app. |

Only works for stores that already have a legacy custom app. Cannot be created after 1 January 2026. If both flows are configured, the static token wins.

### Common

Scripts read from `process.env`; they do not shell out to Shopify CLI. Set values however secrets are already managed (`.env`, `direnv`, a secret manager). `.env` is git-ignored; tokens must never enter version control.

The Admin API credentials are separate from the Storefront API token. The Storefront token cannot mutate definitions.

---

## Adding a field to an existing feature

Once a definition exists, adding a field is three coordinated edits plus a re-run:

1. Add the field to the domain type in `app/platform/<feature>/types.ts`.
2. Add the mapping (if any). E.g. a `FIELD_MAP` constant.
3. Add the field to the setup script's `FIELDS` array.
4. Re-run the setup script (`npm run setup:<feature>`). The helper extends the definition in place.
5. If the fragment queries specific field keys, add the key there too.
6. `npm run codegen` to refresh generated types.

No admin UI clicks required. The additive contract means feature evolution is a pull request, not a runbook.

---

## Removing a field

Setup scripts are additive. They do not remove fields, because a removed field may still hold merchant-authored data that would be lost.

To remove a field:

1. Delete it in the admin: Settings → Custom data → Metaobjects / \[owner\] → open the definition → delete the field. Merchants confirm they want to lose the data.
2. Remove the field from the domain type, fragment, and setup script in the same PR.

---

## Testing setup scripts

Setup scripts run against a real Shopify store. There is no cheap local mock of the Admin API. The pragmatic strategy:

- **Development / preview stores**. Run the script freely. Idempotency makes iteration safe.
- **Production**. Run once per feature launch. The additive contract means later runs are no-ops unless fields are being added.
- **CI**. Do not run automatically. Definition mutations are the merchant's schema; automated CI runs would fight with merchant intent.

Unit-test the schema declarations (the `FIELDS` array) with the module's parser tests, not with API round-trips. A round-trip smoke test against a preview store is fine for a launch checklist, not fine for every PR.
