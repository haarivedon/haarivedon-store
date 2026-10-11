import type { z } from "zod";

/**
 * Field-level errors from a zod issue tree, flattened to `{ field: message }`
 * — the shape the form components consume.
 */
export type FieldErrors = Record<string, string>;

export function toFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    errors[key] ??= issue.message;
  }
  return errors;
}

/** Same shape, but from the API's 422 `issues` payload. */
export function issuesToFieldErrors(issues: unknown): FieldErrors {
  if (!Array.isArray(issues)) return {};

  const errors: FieldErrors = {};
  for (const issue of issues) {
    if (!issue || typeof issue !== "object") continue;
    const { path, message } = issue as { path?: unknown[]; message?: string };
    if (!message) continue;
    const key = Array.isArray(path) ? path.join(".") || "_" : "_";
    errors[key] ??= message;
  }
  return errors;
}

/**
 * Which keys of a zod object are required.
 *
 * Derived from the schema rather than repeated in the field config, so the
 * asterisk in the UI and the rule the server enforces can never disagree.
 * A key is optional exactly when the schema accepts `undefined` for it.
 */
export function requiredKeys(schema: unknown): Set<string> {
  const shape = (schema as { shape?: Record<string, { safeParse: (v: unknown) => { success: boolean } }> })
    .shape;
  if (!shape) return new Set();

  const required = new Set<string>();
  for (const [key, field] of Object.entries(shape)) {
    if (!field.safeParse(undefined).success) required.add(key);
  }
  return required;
}
