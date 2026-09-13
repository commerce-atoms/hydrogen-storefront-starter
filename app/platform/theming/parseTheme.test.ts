import {describe, expect, it} from 'vitest';

import {parseTheme} from './parseTheme';

function palette(
  fields: Array<{key: string; value: string | null} | null>,
  type: string | null = 'store_theme_preset',
) {
  return {
    reference: {
      type,
      handle: 'test-palette',
      fields,
    },
  };
}

describe('parseTheme', () => {
  it('returns null when the metafield is absent or unresolved', () => {
    expect(parseTheme(null)).toBeNull();
    expect(parseTheme(undefined)).toBeNull();
    expect(parseTheme({reference: null})).toBeNull();
    expect(parseTheme({reference: {fields: []}})).toBeNull();
  });

  it('builds a theme from valid metaobject fields and normalises whitespace', () => {
    const theme = parseTheme(
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
    const theme = parseTheme(
      palette([
        {key: 'background', value: 'red; } body { display:none'},
        {key: 'accent', value: 'url(javascript:alert(1))'},
        {key: 'border', value: '<script>x</script>'},
      ]),
    );

    expect(theme).toBeNull();
  });

  it('drops individual bad values but keeps the good ones', () => {
    const theme = parseTheme(
      palette([
        {key: 'background', value: '#0b0b0d'},
        {key: 'accent', value: 'red; evil'},
      ]),
    );

    expect(theme).toEqual({background: '#0b0b0d'});
  });

  it('ignores fields whose key is not part of the palette schema', () => {
    const theme = parseTheme(
      palette([
        {key: 'notes', value: '#ff0000'},
        {key: 'background', value: '#0b0b0d'},
      ]),
    );

    expect(theme).toEqual({background: '#0b0b0d'});
  });

  it('bails when the referenced metaobject is not a store_theme_preset', () => {
    const theme = parseTheme(
      palette([{key: 'background', value: '#0b0b0d'}], 'seo_settings'),
    );

    expect(theme).toBeNull();
  });

  it('accepts the app-owned expansion Shopify returns for $app: types', () => {
    const theme = parseTheme(
      palette(
        [{key: 'background', value: '#0b0b0d'}],
        'app--422368280577--store_theme_preset',
      ),
    );

    expect(theme).toEqual({background: '#0b0b0d'});
  });
});
