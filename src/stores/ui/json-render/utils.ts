import type { WritableAtom } from 'nanostores';

export function isObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

// Deep merge where arrays are replaced by override
export function deepMerge<T extends Record<string, any>, U extends Record<string, any>>(base: T, override: U): T & U {
  if (!isObject(base)) return override as any;
  if (!isObject(override)) return base as any;
  const out: Record<string, any> = { ...base };
  for (const key of Object.keys(override)) {
    const a = (base as any)[key];
    const b = (override as any)[key];
    if (Array.isArray(a) && Array.isArray(b)) {
      out[key] = b;
    } else if (isObject(a) && isObject(b)) {
      out[key] = deepMerge(a, b);
    } else {
      out[key] = b;
    }
  }
  return out as T & U;
}

export type UpdateAtom<T> = (atom: WritableAtom<T>, partial: Partial<T>) => void;

export function updateAtomDeep<T extends Record<string, any>>(atom: WritableAtom<T>, partial: Partial<T>) {
  const current = atom.get();
  atom.set(deepMerge(current, partial as T));
}

