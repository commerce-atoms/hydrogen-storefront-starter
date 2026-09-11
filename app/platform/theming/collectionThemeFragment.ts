/**
 * GraphQL fragment for the collection theme reference.
 *
 * Spread this into any Storefront API `Collection` query to receive a
 * `themePreset` field that resolves the `theme.preset` metafield's
 * `metaobject_reference` to a `theme_palette` metaobject. `parseCollectionTheme()`
 * reads the metaobject's `fields[]` and maps them into a `CollectionTheme`.
 *
 * The palette schema (which fields the metaobject exposes) lives in
 * `THEME_PALETTE_FIELD_MAP` in `./types.ts`. Adding a new theme token means
 * (1) adding the field to `CollectionTheme` / `THEME_TOKEN_MAP` /
 * `THEME_PALETTE_FIELD_MAP` and (2) creating the field on the metaobject
 * definition in Shopify (re-run `npm run setup:theming` — it's idempotent).
 */
export const COLLECTION_THEME_FRAGMENT = `#graphql
  fragment CollectionThemeReference on Collection {
    themePreset: metafield(namespace: "theme", key: "preset") {
      reference {
        ... on Metaobject {
          type
          handle
          fields {
            key
            value
          }
        }
      }
    }
  }
` as const;
