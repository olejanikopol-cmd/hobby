import { describe, expect, it } from 'vitest';
import { buildStyle, buildingsLayer, type StyleSpec } from './map-style';

const base: StyleSpec = {
  version: 8,
  sources: { openmaptiles: { type: 'vector', url: 'x' } },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#fff' } },
    { id: 'water', type: 'fill', source: 'openmaptiles', paint: { 'fill-color': '#00f' } },
    { id: 'park', type: 'fill', source: 'openmaptiles', paint: { 'fill-color': '#0f0' } },
    { id: 'highway_primary', type: 'line', source: 'openmaptiles', paint: { 'line-color': '#999' } },
    { id: 'place_label', type: 'symbol', source: 'openmaptiles', layout: { 'text-field': '{name}' } },
  ],
};

describe('стилі карти', () => {
  it('схема: фірмові кольори і українські підписи', () => {
    const s = buildStyle(base, 'map');
    expect(s.layers[0].paint?.['background-color']).toBe('#F6F8F6');
    expect(s.layers[1].paint?.['fill-color']).toBe('#CBE3E6');
    expect(s.layers[4].layout?.['text-field']).toEqual(['coalesce', ['get', 'name:uk'], ['get', 'name']]);
  });

  it('не змінює вихідний стиль', () => {
    buildStyle(base, 'night');
    expect(base.layers[0].paint?.['background-color']).toBe('#fff');
  });

  it('ніч: темний фон і світлі підписи', () => {
    const s = buildStyle(base, 'night');
    expect(s.layers[0].paint?.['background-color']).toBe('#0F1613');
    expect(s.layers[4].paint?.['text-color']).toBe('#C9D6CE');
  });

  it('супутник: растровий шар знизу, заливок немає', () => {
    const s = buildStyle(base, 'satellite');
    expect(s.layers[0].id).toBe('satellite');
    expect(s.sources.satellite.type).toBe('raster');
    expect(s.layers.some((l) => l.type === 'fill')).toBe(false);
  });

  it('3D-будинки беруть векторне джерело', () => {
    expect(buildingsLayer(base, 'map')?.source).toBe('openmaptiles');
  });
});
