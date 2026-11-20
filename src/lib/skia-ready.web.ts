import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { useEffect, useState } from 'react';

// On web Skia runs on CanvasKit (WebAssembly), which has to be loaded before any Skia call.
// The wasm file is copied to public/ by scripts/setup-skia-web.mjs (npm run web does it).
let loading: Promise<void> | null = null;
let ready = false;

export function useSkiaReady(): boolean {
  const [isReady, setReady] = useState(ready);
  useEffect(() => {
    if (ready) return;
    loading ??= LoadSkiaWeb({ locateFile: (file: string) => `/${file}` }).then(() => {
      ready = true;
    });
    let alive = true;
    loading.then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);
  return isReady;
}
