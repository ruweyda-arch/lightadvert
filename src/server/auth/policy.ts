/**
 * Auth policy constants. Leaf module with no imports — safe to pull into the edge
 * middleware as well as server code.
 */

/** Admin sessions time out after 2 hours idle (docs/prd.md R6). */
export const ADMIN_IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000;

/** 30-day rolling session for everyone (docs/prd.md R6). */
export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 30;

/** docs/prd.md R4. */
export const MIN_PASSWORD_LENGTH = 8;
