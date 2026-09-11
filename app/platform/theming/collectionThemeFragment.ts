/**
 * GraphQL fragment for collection theming metafields.
 *
 * Spread this into any Storefront API `Collection` query to receive the
 * theme metafields as a flat `themeMetafields` array. The array preserves
 * the order of `identifiers` and returns `null` for missing entries — that
 * shape is what `parseCollectionTheme()` expects.
 *
 * Keep the identifier list in lockstep with `THEME_METAFIELD_KEYS` in
 * `./types.ts`. If you add a new theme token, add both the type field and
 * the identifier here.
 */
export const COLLECTION_THEME_FRAGMENT = `#graphql
  fragment CollectionThemeMetafields on Collection {
    themeMetafields: metafields(identifiers: [
      {namespace: "theme", key: "background"},
      {namespace: "theme", key: "surface"},
      {namespace: "theme", key: "surface_secondary"},
      {namespace: "theme", key: "text_primary"},
      {namespace: "theme", key: "text_secondary"},
      {namespace: "theme", key: "border"},
      {namespace: "theme", key: "border_light"},
      {namespace: "theme", key: "accent"},
      {namespace: "theme", key: "accent_hover"},
      {namespace: "theme", key: "accent_secondary"}
    ]) {
      namespace
      key
      value
      type
    }
  }
` as const;
