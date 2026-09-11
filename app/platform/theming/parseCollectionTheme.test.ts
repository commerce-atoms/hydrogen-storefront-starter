import {describe, expect, it} from 'vitest';

import {parseCollectionTheme} from './parseCollectionTheme';

describe('parseCollectionTheme', () => {
  it('returns null when metafields are absent, empty, or all null', () => {
    expect(parseCollectionTheme(null)).toBeNull();
    expect(parseCollectionTheme(undefined)).toBeNull();
    expect(parseCollectionTheme([])).toBeNull();
    expect(parseCollectionTheme([null, null])).toBeNull();
  });

  it('builds a theme from valid metafields and normalises whitespace', () => {
    const theme = parseCollectionTheme([
      {namespace: 'theme', key: 'background', value: '  #0b0b0d  '},
      {namespace: 'theme', key: 'accent', value: '#7a0800'},
      {namespace: 'theme', key: 'text_primary', value: 'rgb(237, 237, 242)'},
    ]);

    expect(theme).toEqual({
      background: '#0b0b0d',
      accent: '#7a0800',
      textPrimary: 'rgb(237, 237, 242)',
    });
  });

  it('rejects CSS-injection payloads and returns null if nothing survives', () => {
    const theme = parseCollectionTheme([
      {namespace: 'theme', key: 'background', value: 'red; } body { display:none'},
      {namespace: 'theme', key: 'accent', value: 'url(javascript:alert(1))'},
      {namespace: 'theme', key: 'border', value: '<script>x</script>'},
    ]);

    expect(theme).toBeNull();
  });

  it('drops individual bad values but keeps the good ones', () => {
    const theme = parseCollectionTheme([
      {namespace: 'theme', key: 'background', value: '#0b0b0d'},
      {namespace: 'theme', key: 'accent', value: 'red; evil'},
    ]);

    expect(theme).toEqual({background: '#0b0b0d'});
  });

  it('ignores metafields from other namespaces', () => {
    const theme = parseCollectionTheme([
      {namespace: 'other', key: 'background', value: '#ff0000'},
      {namespace: 'theme', key: 'background', value: '#0b0b0d'},
    ]);

    expect(theme).toEqual({background: '#0b0b0d'});
  });
});
