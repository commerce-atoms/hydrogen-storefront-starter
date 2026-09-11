import {describe, expect, it} from 'vitest';

import {parseCollectionTheme} from './parseCollectionTheme';

function palette(
  fields: Array<{key: string; value: string | null} | null | undefined>,
  type: string | null = 'theme_palette',
) {
  return {
    reference: {
      type,
      handle: 'test-palette',
      fields,
    },
  };
}

describe('parseCollectionTheme', () => {
  it('returns null when the metafield is absent or unresolved', () => {
    expect(parseCollectionTheme(null)).toBeNull();
    expect(parseCollectionTheme(undefined)).toBeNull();
    expect(parseCollectionTheme({reference: null})).toBeNull();
    expect(parseCollectionTheme({reference: {fields: []}})).toBeNull();
  });

  it('builds a theme from valid metaobject fields and normalises whitespace', () => {
    const theme = parseCollectionTheme(
      palette([
        {key: 'background', value: '  #0b0b0d  '},
        {key: 'accent', value: '#7a0800'},
        {key: 'text_primary', value: 'rgb(237, 237, 242)'},
      ]),
    );

    expect(theme).toEqual({
      background: '#0b0b0d',
      accent: '#7a0800',
      textPrimary: 'rgb(237, 237, 242)',
    });
  });

  it('rejects CSS-injection payloads and returns null if nothing survives', () => {
    const theme = parseCollectionTheme(
      palette([
        {key: 'background', value: 'red; } body { display:none'},
        {key: 'accent', value: 'url(javascript:alert(1))'},
        {key: 'border', value: '<script>x</script>'},
      ]),
    );

    expect(theme).toBeNull();
  });

  it('drops individual bad values but keeps the good ones', () => {
    const theme = parseCollectionTheme(
      palette([
        {key: 'background', value: '#0b0b0d'},
        {key: 'accent', value: 'red; evil'},
      ]),
    );

    expect(theme).toEqual({background: '#0b0b0d'});
  });

  it('ignores fields whose key is not part of the palette schema', () => {
    const theme = parseCollectionTheme(
      palette([
        {key: 'notes', value: '#ff0000'},
        {key: 'background', value: '#0b0b0d'},
      ]),
    );

    expect(theme).toEqual({background: '#0b0b0d'});
  });

  it('bails when the referenced metaobject is not a theme_palette', () => {
    const theme = parseCollectionTheme(
      palette([{key: 'background', value: '#0b0b0d'}], 'seo_settings'),
    );

    expect(theme).toBeNull();
  });
});
