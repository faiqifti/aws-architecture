/** Small, dependency-free coercion helpers used to sanitize untrusted JSON. */

export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export const asNumber = (v: unknown, fallback: number, min = -Infinity, max = Infinity): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;

export const asInt = (v: unknown, fallback: number, min = -Infinity, max = Infinity): number =>
  Math.round(asNumber(v, fallback, min, max));

export const asString = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);

export const asBool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);

export const asEnum = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;

export const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

/** Keeps only valid ISO-ish date strings. */
export const asDateString = (v: unknown, fallback = ''): string =>
  typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? v : fallback;

export const asRecordOf = <T>(v: unknown, item: (x: unknown) => T | null): Record<string, T> => {
  const out: Record<string, T> = {};
  if (!isRecord(v)) return out;
  for (const [k, val] of Object.entries(v)) {
    const parsed = item(val);
    if (parsed !== null) out[k] = parsed;
  }
  return out;
};

export const asArrayOf = <T>(v: unknown, item: (x: unknown) => T | null, max = 5000): T[] => {
  if (!Array.isArray(v)) return [];
  const out: T[] = [];
  for (const val of v.slice(-max)) {
    const parsed = item(val);
    if (parsed !== null) out.push(parsed);
  }
  return out;
};
