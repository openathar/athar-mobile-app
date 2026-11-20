// Node module hooks for `npm test`: resolve the app's `@/` alias and
// extension-less imports to the TypeScript sources, which Node runs with its
// built-in type stripping. No test framework, no new dependency.
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const SRC = path.resolve(fileURLToPath(new URL('../../src/', import.meta.url)));
const EXTS = ['.ts', '.tsx', '/index.ts'];

function fileFor(base) {
  if (existsSync(base) && !existsSync(base + '.ts') && path.extname(base)) return base;
  for (const ext of EXTS) if (existsSync(base + ext)) return base + ext;
  return null;
}

export async function resolve(specifier, context, next) {
  let base = null;
  if (specifier.startsWith('@/')) base = path.join(SRC, specifier.slice(2));
  else if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file:')) {
    base = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
  }
  if (base) {
    const file = fileFor(base);
    if (file) {
      const attrs = file.endsWith('.json') ? { type: 'json' } : context.importAttributes;
      return next(pathToFileURL(file).href, { ...context, importAttributes: attrs });
    }
  }
  return next(specifier, context);
}
