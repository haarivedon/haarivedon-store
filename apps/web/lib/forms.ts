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
