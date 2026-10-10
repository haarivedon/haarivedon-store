import { TsRestHttpError } from "@ts-rest/serverless";
import { env } from "../env";

/**
 * Guard for admin-only endpoints.
 *
 * Placeholder auth: a shared secret in `x-api-key`. Swap for real sessions
 * (JWT, Better Auth, Clerk, ...) without touching the contract.
 */
export const assertAdmin = (headers: Headers) => {
  if (!env.ADMIN_API_KEY) {
    throw new TsRestHttpError(401, {
      error: "Admin endpoints are disabled — set ADMIN_API_KEY.",
    });
  }

  if (headers.get("x-api-key") !== env.ADMIN_API_KEY) {
    throw new TsRestHttpError(401, { error: "Unauthorized." });
  }
};
