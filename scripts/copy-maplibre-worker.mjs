// MapLibre 6 вантажить парсер тайлів в окремому Web Worker. Next.js не копіює цей файл у збірку,
// тому кладемо його в public/ перед dev/build і вказуємо адресу через maplibregl.setWorkerUrl().
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(dirname(require.resolve('maplibre-gl/package.json')), 'dist', 'maplibre-gl-worker.mjs');
mkdirSync(join(root, 'public'), { recursive: true });
copyFileSync(src, join(root, 'public', 'maplibre-gl-worker.mjs'));
console.log('maplibre-gl-worker.mjs → public/');
