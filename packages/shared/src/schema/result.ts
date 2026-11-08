export interface ParseOk<T> {
  ok: true;
  value: T;
}

export interface ParseFail {
  ok: false;
  errors: readonly string[];
}

export type ParseResult<T> = ParseOk<T> | ParseFail;

export function ok<T>(value: T): ParseOk<T> {
  return { ok: true, value };
}

export function fail(errors: string | readonly string[]): ParseFail {
  const list = typeof errors === 'string' ? [errors] : errors;
  return { ok: false, errors: list };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const sensitiveKeys = ['secret', 'password', 'cardNumber', 'cvc', 'cvv', 'pan'] as const;

export function rejectSensitive(
  value: unknown,
  errors: string[],
  allowTop: readonly string[] = [],
  top = true,
): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      rejectSensitive(item, errors, [], false);
    }
    return;
  }
  if (!isRecord(value)) {
    return;
  }
  for (const [key, inner] of Object.entries(value)) {
    if ((sensitiveKeys as readonly string[]).includes(key) && !(top && allowTop.includes(key))) {
      errors.push(`${key} is not allowed`);
    }
    rejectSensitive(inner, errors, [], false);
  }
}

export function rejectUnknown(record: Record<string, unknown>, allowed: readonly string[], errors: string[]): void {
  for (const key of Object.keys(record)) {
    if (!allowed.includes(key)) {
      errors.push(`${key} is not a field`);
    }
  }
}

export function requireString(record: Record<string, unknown>, field: string, errors: string[]): string | undefined {
  const value = record[field];
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${field} is required`);
    return undefined;
  }
  return value;
}

export function optionalString(record: Record<string, unknown>, field: string, errors: string[]): string | undefined {
  if (!(field in record) || record[field] === undefined) {
    return undefined;
  }
  if (typeof record[field] !== 'string') {
    errors.push(`${field} must be a string`);
    return undefined;
  }
  return record[field];
}

export function requireBoolean(record: Record<string, unknown>, field: string, errors: string[]): boolean | undefined {
  const value = record[field];
  if (typeof value !== 'boolean') {
    errors.push(`${field} is required`);
    return undefined;
  }
  return value;
}

export function requireFinite(record: Record<string, unknown>, field: string, errors: string[]): number | undefined {
  const value = record[field];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    errors.push(`${field} is required`);
    return undefined;
  }
  return value;
}

export function requireInteger(record: Record<string, unknown>, field: string, errors: string[], min: number): number | undefined {
  const value = requireFinite(record, field, errors);
  if (value === undefined) {
    return undefined;
  }
  if (!Number.isInteger(value) || value < min) {
    errors.push(`${field} is out of range`);
    return undefined;
  }
  return value;
}

export function readRecord(input: unknown): ParseResult<Record<string, unknown>> {
  if (!isRecord(input)) {
    return fail('record must be an object');
  }
  return ok(input);
}

export function finish<T>(errors: string[], value: T): ParseResult<T> {
  if (errors.length > 0) {
    return fail(errors);
  }
  return ok(value);
}

const cardNumberPattern = /^(?:\d[ -]?){13,19}$/;

export function containsCardNumber(value: unknown): boolean {
  if (typeof value === 'string') {
    const compact = value.replace(/[ -]/g, '');
    return /^\d{13,19}$/.test(compact) && cardNumberPattern.test(value.trim());
  }
  if (typeof value === 'number') {
    return /^\d{13,19}$/.test(String(value));
  }
  if (Array.isArray(value)) {
    return value.some((item) => containsCardNumber(item));
  }
  if (!isRecord(value)) {
    return false;
  }
  return Object.values(value).some((item) => containsCardNumber(item));
}
