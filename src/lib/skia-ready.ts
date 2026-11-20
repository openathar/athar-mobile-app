/** Native: Skia is linked into the app, nothing to wait for. Web: see skia-ready.web.ts. */
export function useSkiaReady(): boolean {
  return true;
}
