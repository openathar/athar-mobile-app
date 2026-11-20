// Copies CanvasKit's wasm next to the web build so LoadSkiaWeb() can fetch it (see src/lib/skia-ready.web.ts).
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const wasm = join(dirname(require.resolve('canvaskit-wasm/package.json')), 'bin/full/canvaskit.wasm');
mkdirSync('public', { recursive: true });
copyFileSync(wasm, 'public/canvaskit.wasm');
console.log('public/canvaskit.wasm ready');
