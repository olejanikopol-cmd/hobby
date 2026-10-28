/**
 * Стилі карти. Основа — OpenFreeMap «positron» (безкоштовно, без ключа).
 * З одного стилю робимо три шари: схема, ніч, супутник. 3D — нахил і обʼєм будинків поверх будь-якого шару.
 */
export const BASE_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';

/** Sentinel-2 cloudless 2016 від EOX — CC BY 4.0. Перед комерційним запуском перевірити умови або взяти платного постачальника. */
export const SATELLITE_TILES = 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg';
export const SATELLITE_ATTRIBUTION = 'Sentinel-2 cloudless — s2maps.eu, EOX IT Services GmbH (Copernicus Sentinel data 2016)';

export type MapLayer = 'map' | 'night' | 'satellite';

// Мінімальні типи, щоб не тягнути типи maplibre в чисті функції (і в тести).
interface StyleLayer {
  id: string;
  type: string;
  source?: string;
  'source-layer'?: string;
  layout?: Record<string, unknown>;
  paint?: Record<string, unknown>;
  [k: string]: unknown;
}
export interface StyleSpec {
  version: number;
  sources: Record<string, { type: string; [k: string]: unknown }>;
  layers: StyleLayer[];
  [k: string]: unknown;
}

const LIGHT = { bg: '#F6F8F6', water: '#CBE3E6', green: '#DCEBDF' };
const DARK = { bg: '#0F1613', water: '#173238', green: '#15261D', land: '#141D19', road: '#2C3A34', roadMajor: '#3B4C44', text: '#C9D6CE', halo: '#0F1613', building: '#1B2621' };

const isWater = (id: string) => /water|ocean|river|lake/.test(id);
const isGreen = (id: string) => /park|wood|grass|forest|cemetery|landcover|nature|garden/.test(id);
const isLabel = (l: StyleLayer) => l.type === 'symbol' && !!l.layout && JSON.stringify(l.layout['text-field'] ?? '').includes('name');

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/** Перший векторний джерело (у OpenFreeMap — «openmaptiles»). */
export function vectorSourceId(style: StyleSpec): string | null {
  return Object.entries(style.sources).find(([, s]) => s.type === 'vector')?.[0] ?? null;
}

export function buildStyle(base: StyleSpec, layer: MapLayer): StyleSpec {
  const style = clone(base);
  for (const l of style.layers) {
    if (isLabel(l)) {
      l.layout = { ...l.layout, 'text-field': ['coalesce', ['get', 'name:uk'], ['get', 'name']] };
    }
  }

  if (layer === 'map') {
    for (const l of style.layers) {
      if (l.type === 'background') l.paint = { ...l.paint, 'background-color': LIGHT.bg };
      else if (l.type === 'fill' && isWater(l.id)) l.paint = { ...l.paint, 'fill-color': LIGHT.water };
      else if (l.type === 'fill' && isGreen(l.id)) l.paint = { ...l.paint, 'fill-color': LIGHT.green };
    }
    return style;
  }

  if (layer === 'night') {
    for (const l of style.layers) {
      const paint = { ...(l.paint ?? {}) };
      if (l.type === 'background') paint['background-color'] = DARK.bg;
      else if (l.type === 'fill') {
        paint['fill-color'] = isWater(l.id) ? DARK.water : isGreen(l.id) ? DARK.green : /building/.test(l.id) ? DARK.building : DARK.land;
        delete paint['fill-outline-color'];
      } else if (l.type === 'line') {
        paint['line-color'] = isWater(l.id) ? DARK.water : /motorway|trunk|primary|major/.test(l.id) ? DARK.roadMajor : DARK.road;
      } else if (l.type === 'symbol') {
        paint['text-color'] = DARK.text;
        paint['text-halo-color'] = DARK.halo;
      }
      l.paint = paint;
    }
    return style;
  }

  // Супутник: знімок під підписами і дорогами, заливки ховаємо.
  style.sources.satellite = { type: 'raster', tiles: [SATELLITE_TILES], tileSize: 256, maxzoom: 15, attribution: SATELLITE_ATTRIBUTION };
  const kept: StyleLayer[] = [];
  for (const l of style.layers) {
    if (l.type === 'background' || l.type === 'fill' || l.type === 'fill-extrusion') continue;
    if (l.type === 'line') {
      if (isWater(l.id)) continue;
      l.paint = { ...l.paint, 'line-opacity': 0.45 };
    }
    if (l.type === 'symbol') l.paint = { ...l.paint, 'text-color': '#FFFFFF', 'text-halo-color': 'rgba(0,0,0,0.75)', 'text-halo-width': 1.4 };
    kept.push(l);
  }
  style.layers = [{ id: 'satellite', type: 'raster', source: 'satellite' }, ...kept];
  return style;
}

/** Шар обʼємних будинків для 3D. null, якщо у джерелі немає будинків. */
export function buildingsLayer(style: StyleSpec, layer: MapLayer): StyleLayer | null {
  const source = vectorSourceId(style);
  if (!source) return null;
  const color = layer === 'night' ? '#22302A' : layer === 'satellite' ? '#E8EDEA' : '#E3E9E5';
  return {
    id: 'hobbyl-3d-buildings',
    type: 'fill-extrusion',
    source,
    'source-layer': 'building',
    minzoom: 13,
    paint: {
      'fill-extrusion-color': color,
      'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 6],
      'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
      'fill-extrusion-opacity': layer === 'satellite' ? 0.55 : 0.85,
    },
  };
}
