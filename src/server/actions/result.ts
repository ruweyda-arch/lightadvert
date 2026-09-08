/** Standard return shape for every server action (docs/phase-1-plan.md conventions). */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function ok<T = undefined>(data?: T): ActionResult<T> {
  return { ok: true, data: data as T };
}

export function fail(
  error: string,
  fieldErrors?: Record<string, string>,
): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

/** Turn an unknown thrown value into a `fail` result, preserving known messages. */
export function failFrom(err: unknown, fallback = "Something went wrong."): ActionResult<never> {
  if (err instanceof Error && err.message) return { ok: false, error: err.message };
  return { ok: false, error: fallback };
}
