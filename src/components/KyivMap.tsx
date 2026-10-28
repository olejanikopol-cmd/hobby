'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Map as MLMap, Marker } from 'maplibre-gl';
import { Icon } from './Icon';
import { BASE_STYLE_URL, buildStyle, buildingsLayer, type MapLayer, type StyleSpec } from '@/lib/map-style';

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  label: string;
  title: string;
  tone: 'paid' | 'free' | 'donate';
}

interface Props {
  pins?: MapPin[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** режим вибору точки (створення заняття) */
  pick?: { lat: number; lng: number } | null;
  onPick?: (p: { lat: number; lng: number }) => void;
  className?: string;
  compact?: boolean;
}

const KYIV: [number, number] = [30.523, 50.45];
const BOUNDS: [[number, number], [number, number]] = [[29.95, 50.18], [31.05, 50.72]];
const LAYERS: { id: MapLayer; label: string }[] = [
  { id: 'map', label: 'Схема' },
  { id: 'night', label: 'Ніч' },
  { id: 'satellite', label: 'Супутник' },
];

export const WORKER_URL = '/maplibre-gl-worker.mjs';
let workerSet = false;

let baseStyle: Promise<StyleSpec> | null = null;
function loadBaseStyle(): Promise<StyleSpec> {
  baseStyle ??= fetch(BASE_STYLE_URL).then((r) => {
    if (!r.ok) throw new Error(`style ${r.status}`);
    return r.json() as Promise<StyleSpec>;
  });
  baseStyle.catch(() => {
    baseStyle = null;
  });
  return baseStyle;
}

const TONE: Record<MapPin['tone'], string> = {
  paid: 'background:#FFFFFF;color:#16241D',
  free: 'background:#E4EFE8;color:#1F4D38',
  donate: 'background:#FFF1D6;color:#6B4A0E',
};

function paintPin(el: HTMLButtonElement, pin: MapPin, on: boolean) {
  const label = el.firstElementChild as HTMLSpanElement;
  label.textContent = pin.label;
  label.setAttribute(
    'style',
    `${on ? 'background:#2F6B4F;color:#FFFFFF;border-color:#FFFFFF' : TONE[pin.tone] + ';border-color:rgba(22,36,29,0.08)'};` +
      `display:block;padding:6px 12px;border-radius:999px;border:2px solid;font:800 13px/1.2 Onest,system-ui,sans-serif;white-space:nowrap;` +
      `box-shadow:0 6px 16px rgba(22,36,29,0.22);transform:scale(${on ? 1.12 : 1});transition:transform .3s cubic-bezier(.3,1.4,.5,1),background-color .25s`,
  );
  el.setAttribute('aria-label', `${pin.title}, ${pin.label}`);
  el.setAttribute('aria-pressed', String(on));
  el.style.zIndex = on ? '3' : '1';
}

export default function KyivMap({ pins = [], selectedId = null, onSelect, pick, onPick, className = '', compact = false }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<typeof import('maplibre-gl') | null>(null);
  const markers = useRef(new Map<string, { marker: Marker; el: HTMLButtonElement }>());
  const pickMarker = useRef<Marker | null>(null);
  const youMarker = useRef<Marker | null>(null);
  const baseRef = useRef<StyleSpec | null>(null);
  const appliedLayer = useRef<MapLayer>('map');
  const onSelectRef = useRef(onSelect);
  const onPickRef = useRef(onPick);
  const [layer, setLayer] = useState<MapLayer>('map');
  const [is3d, setIs3d] = useState(false);
  const is3dRef = useRef(false);
  const [bearing, setBearing] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [locError, setLocError] = useState<string | null>(null);

  useEffect(() => {
    onSelectRef.current = onSelect;
    onPickRef.current = onPick;
    is3dRef.current = is3d;
  });

  const applyBuildings = useCallback((map: MLMap, on: boolean, lyr: MapLayer) => {
    const id = 'hobbyl-3d-buildings';
    if (map.getLayer(id)) map.removeLayer(id);
    if (!on || !baseRef.current) return;
    const spec = buildingsLayer(baseRef.current, lyr);
    if (!spec) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.addLayer(spec as any, map.getStyle().layers.find((l) => l.type === 'symbol')?.id);
    } catch {
      /* у стилі немає шару будинків — працюємо без обʼєму */
    }
  }, []);

  // створення карти
  useEffect(() => {
    let cancelled = false;
    const markerStore = markers.current;
    (async () => {
      try {
        const [lib, base] = await Promise.all([import('maplibre-gl'), loadBaseStyle()]);
        if (cancelled || !box.current) return;
        libRef.current = lib;
        baseRef.current = base;
        if (!workerSet) {
          lib.setWorkerUrl(WORKER_URL);
          workerSet = true;
        }
        const map = new lib.Map({
          container: box.current,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          style: buildStyle(base, 'map') as any,
          center: pick ? [pick.lng, pick.lat] : KYIV,
          zoom: pick ? 13 : compact ? 10.6 : 11,
          minZoom: 9,
          maxZoom: 18,
          maxBounds: BOUNDS,
          attributionControl: { compact: true },
          fadeDuration: 150,
        });
        mapRef.current = map;
        appliedLayer.current = 'map';
        map.on('rotate', () => setBearing(map.getBearing()));
        // Збій окремого тайла (наприклад, супутника) не критичний — не засмічуємо консоль.
        map.on('error', () => {});
        // Не чекаємо 'load': він настає лише коли догрузились усі тайли, а один збійний тайл не має блокувати мітки.
        setStatus('ready');
        map.on('click', (e) => {
          if (onPickRef.current) onPickRef.current({ lat: +e.lngLat.lat.toFixed(5), lng: +e.lngLat.lng.toFixed(5) });
        });
        const ro = new ResizeObserver(() => map.resize());
        ro.observe(box.current);
        map.once('remove', () => ro.disconnect());
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
      markerStore.forEach(({ marker }) => marker.remove());
      markerStore.clear();
      pickMarker.current = null;
      youMarker.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // карту створюємо один раз; pick/compact впливають лише на початковий вигляд
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  // мітки занять
  useEffect(() => {
    const map = mapRef.current;
    const lib = libRef.current;
    if (!map || !lib || status !== 'ready') return;
    const store = markers.current;
    const ids = new Set(pins.map((p) => p.id));
    for (const [id, m] of store) {
      if (!ids.has(id)) {
        m.marker.remove();
        store.delete(id);
      }
    }
    for (const pin of pins) {
      let entry = store.get(pin.id);
      if (!entry) {
        const el = document.createElement('button');
        el.type = 'button';
        el.style.cssText = 'padding:0;border:0;background:transparent;cursor:pointer';
        el.appendChild(document.createElement('span'));
        // пін під курсором піднімаємо над сусідами — у центрі міста вони перекриваються
        el.addEventListener('pointerenter', () => (el.style.zIndex = '4'));
        el.addEventListener('pointerleave', () => (el.style.zIndex = el.getAttribute('aria-pressed') === 'true' ? '3' : '1'));
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelectRef.current?.(pin.id);
        });
        const marker = new lib.Marker({ element: el, anchor: 'bottom' }).setLngLat([pin.lng, pin.lat]).addTo(map);
        entry = { marker, el };
        store.set(pin.id, entry);
      }
      entry.marker.setLngLat([pin.lng, pin.lat]);
      paintPin(entry.el, pin, pin.id === selectedId);
    }
  }, [pins, selectedId, status]);

  // плавно показати обране заняття
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'ready' || !selectedId) return;
    const pin = pins.find((p) => p.id === selectedId);
    if (!pin) return;
    const pt = map.project([pin.lng, pin.lat]);
    const { clientWidth: w, clientHeight: h } = map.getContainer();
    if (pt.x < 60 || pt.y < 60 || pt.x > w - 60 || pt.y > h - 60) {
      map.easeTo({ center: [pin.lng, pin.lat], duration: 700 });
    }
    // реагуємо лише на зміну вибору
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, status]);

  // точка для ведучого
  useEffect(() => {
    const map = mapRef.current;
    const lib = libRef.current;
    if (!map || !lib || status !== 'ready') return;
    if (!pick) {
      pickMarker.current?.remove();
      pickMarker.current = null;
      return;
    }
    if (!pickMarker.current) {
      pickMarker.current = new lib.Marker({ color: '#2F6B4F', draggable: true }).setLngLat([pick.lng, pick.lat]).addTo(map);
      pickMarker.current.on('dragend', () => {
        const ll = pickMarker.current!.getLngLat();
        onPickRef.current?.({ lat: +ll.lat.toFixed(5), lng: +ll.lng.toFixed(5) });
      });
    } else {
      pickMarker.current.setLngLat([pick.lng, pick.lat]);
    }
  }, [pick, status]);

  // шар карти
  useEffect(() => {
    const map = mapRef.current;
    const base = baseRef.current;
    if (!map || !base || status !== 'ready' || appliedLayer.current === layer) return;
    appliedLayer.current = layer;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.setStyle(buildStyle(base, layer) as any, { diff: false });
    map.once('style.load', () => applyBuildings(map, is3dRef.current, layer));
    // is3d обробляється окремим ефектом
     
  }, [layer, status, applyBuildings]);

  // 3D
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'ready') return;
    map.easeTo(is3d ? { pitch: 60, bearing: map.getBearing() || -20, zoom: Math.max(map.getZoom(), 13.2), duration: 1100 } : { pitch: 0, bearing: 0, duration: 900 });
    if (map.isStyleLoaded()) applyBuildings(map, is3d, layer);
    else map.once('style.load', () => applyBuildings(map, is3dRef.current, layer));
    // layer обробляється в ефекті шару
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [is3d, status, applyBuildings]);

  const zoom = (d: number) => mapRef.current?.easeTo({ zoom: mapRef.current.getZoom() + d, duration: 300 });
  const rotate = (d: number) => mapRef.current?.easeTo({ bearing: mapRef.current.getBearing() + d, duration: 600 });
  const north = () => mapRef.current?.easeTo({ bearing: 0, duration: 600 });

  const locate = () => {
    setLocError(null);
    if (!('geolocation' in navigator)) {
      setLocError('Браузер не підтримує геолокацію');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const map = mapRef.current;
        const lib = libRef.current;
        if (!map || !lib) return;
        const ll: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        if (!youMarker.current) {
          const el = document.createElement('span');
          el.style.cssText = 'display:block;width:18px;height:18px;border-radius:50%;background:#2F6B4F;border:3px solid #fff;box-shadow:0 0 0 6px rgba(47,107,79,.25)';
          el.setAttribute('aria-label', 'Ви тут');
          youMarker.current = new lib.Marker({ element: el }).setLngLat(ll).addTo(map);
        } else youMarker.current.setLngLat(ll);
        map.flyTo({ center: ll, zoom: 14, duration: 1200 });
      },
      () => setLocError('Не вдалося визначити місце. Дозвольте доступ до геолокації.'),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const layerIdx = LAYERS.findIndex((l) => l.id === layer);
  const ctl = 'flex h-11 w-11 items-center justify-center bg-white text-ink hover:bg-chip';

  return (
    <div className={`overflow-hidden bg-[#EEF2EE] ${/\b(absolute|fixed)\b/.test(className) ? '' : 'relative'} ${className}`}>
      {/* maplibre-gl.css задає .maplibregl-map { position: relative } поза шарами Tailwind і перебиває `absolute`,
          тому контейнер карти розтягуємо через h-full усередині окремої абсолютної обгортки */}
      <div className="absolute inset-0">
        <div ref={box} className="h-full w-full" />
      </div>

      {status === 'loading' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="animate-pulse rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-muted shadow-card">Завантажуємо карту…</span>
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <span className="font-head text-lg font-bold">Карта не завантажилась</span>
          <span className="max-w-xs text-sm text-muted">Перевірте інтернет. Список занять працює і без карти.</span>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setStatus('loading');
              setAttempt((a) => a + 1);
            }}
          >
            Спробувати ще
          </button>
        </div>
      )}

      {status === 'ready' && !compact && (
        <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
          <div role="group" aria-label="Шар карти" className="relative grid grid-cols-3 rounded-2xl bg-white/90 p-1 shadow-card backdrop-blur">
            <span
              aria-hidden="true"
              className="absolute top-1 bottom-1 w-[calc((100%-8px)/3)] rounded-xl bg-ink transition-[left] duration-500 ease-[cubic-bezier(.3,1.3,.5,1)]"
              style={{ left: `calc(4px + ${layerIdx} * (100% - 8px) / 3)` }}
            />
            {LAYERS.map((l) => (
              <button
                key={l.id}
                type="button"
                aria-pressed={layer === l.id}
                onClick={() => setLayer(l.id)}
                className={`relative h-9 px-3 text-sm font-bold ${layer === l.id ? 'text-white' : 'text-ink'}`}
              >
                {l.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              aria-pressed={is3d}
              onClick={() => setIs3d((v) => !v)}
              className={`h-11 rounded-2xl px-4 font-logo text-sm font-extrabold shadow-card ${is3d ? 'bg-brand text-white' : 'bg-white text-ink hover:bg-chip'}`}
            >
              3D
            </button>
            <div className="flex overflow-hidden rounded-2xl shadow-card">
              <button type="button" aria-label="Повернути ліворуч" onClick={() => rotate(-45)} className={ctl}>
                <Icon name="rotate" size={18} style={{ transform: 'scaleX(-1)' }} />
              </button>
              <button type="button" aria-label="Північ угорі" onClick={north} className={ctl}>
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" style={{ transform: `rotate(${-bearing}deg)` }}>
                  <path d="M12 3l4 9h-8z" fill="#E2574C" />
                  <path d="M12 21l-4-9h8z" fill="currentColor" opacity="0.45" />
                </svg>
              </button>
              <button type="button" aria-label="Повернути праворуч" onClick={() => rotate(45)} className={ctl}>
                <Icon name="rotate" size={18} />
              </button>
            </div>
          </div>
          <div className="flex flex-col overflow-hidden rounded-2xl shadow-card">
            <button type="button" aria-label="Наблизити" onClick={() => zoom(1)} className={ctl}>
              <Icon name="plus" size={18} />
            </button>
            <button type="button" aria-label="Віддалити" onClick={() => zoom(-1)} className={`${ctl} border-t border-line`}>
              <Icon name="minus" size={18} />
            </button>
          </div>
          <button type="button" aria-label="Показати, де я" onClick={locate} className={`${ctl} rounded-2xl text-brand shadow-card`}>
            <Icon name="locate" />
          </button>
        </div>
      )}
      {locError && (
        <div role="status" className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm text-white shadow-float">
          {locError}
        </div>
      )}
    </div>
  );
}
