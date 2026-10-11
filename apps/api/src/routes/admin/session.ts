import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { changePasswordSchema } from "@repo/contract";
import { prisma, type AdminUser } from "@repo/db";
import { TsRestHttpError } from "@ts-rest/serverless";
import { env, isProduction } from "../../env";
import { rateLimit } from "../../lib/rate-limit";

const scrypt = promisify(scryptCallback);

/**
 * Admin authentication (CR-3, docs/PLAN.md §3.3).
 *
 * Deviation from the plan, recorded here: the plan named Better Auth, but
 * after §3.4 trimmed the requirements to email + password, one role, no
 * social login and no 2FA, what is left is a password hash and a session
 * table. The Prisma + MongoDB adapter is the awkward combination in that
 * library, so this is ~150 lines of node:crypto instead — nothing bespoke:
 * scrypt hashing, opaque random tokens, and the token stored only as a hash.
 */
export { changePasswordSchema };

export const SESSION_COOKIE = "haarivedon_admin";
const SESSION_DAYS = 30;
const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split(":");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;

  const derived = (await scrypt(
    password,
    Buffer.from(saltHex, "hex"),
    KEY_LENGTH,
  )) as Buffer;
  const expected = Buffer.from(hashHex, "hex");

  return (
    derived.length === expected.length && timingSafeEqual(derived, expected)
  );
}

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export type SessionUser = Pick<AdminUser, "id" | "email" | "name">;

export type LoginResult =
  | { ok: true; token: string; expiresAt: Date; user: SessionUser }
  | { ok: false; status: 401 | 429; error: string };

export async function login(
  email: string,
  password: string,
  meta: { userAgent?: string; ip?: string } = {},
): Promise<LoginResult> {
  const normalised = email.trim().toLowerCase();

  // Lockout is per email and per IP: 10 attempts per 15 minutes (§13).
  const perEmail = rateLimit(`login:email:${normalised}`, {
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  const perIp = rateLimit(`login:ip:${meta.ip ?? "unknown"}`, {
    limit: 30,
    windowMs: 15 * 60 * 1000,
  });
  if (!perEmail.allowed || !perIp.allowed) {
    return {
      ok: false,
      status: 429,
      error: "Too many attempts. Please wait a few minutes and try again.",
    };
  }

  const user = await prisma.adminUser.findUnique({
    where: { email: normalised },
  });

  // Same answer for an unknown email, a wrong password and a disabled
  // account, so the form cannot be used to enumerate accounts.
  const invalid = {
    ok: false as const,
    status: 401 as const,
    error: "Those details did not match. Please try again.",
  };
  if (!user || user.disabledAt) {
    // Spend comparable time on a missing user so timing does not leak either.
    await hashPassword(password);
    return invalid;
  }
  if (!(await verifyPassword(password, user.passwordHash))) return invalid;

  const token = `${randomUUID()}.${randomBytes(32).toString("base64url")}`;
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);

  await prisma.adminSession.create({
    data: {
      tokenHash: hashToken(token),
      userId: user.id,
      expiresAt,
      userAgent: (meta.userAgent ?? "").slice(0, 200),
      ip: meta.ip ?? "",
    },
  });
  await prisma.adminUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    ok: true,
    token,
    expiresAt,
    user: { id: user.id, email: user.email, name: user.name },
  };
}

/** Resolves a cookie token to its user, sweeping the row if it has expired. */
export async function sessionFromToken(
  token: string | undefined,
): Promise<SessionUser | null> {
  if (!token) return null;

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now() || session.user.disabledAt) {
    await prisma.adminSession.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };
}

export async function logout(token: string | undefined): Promise<void> {
  if (!token) return;
  await prisma.adminSession
    .delete({ where: { tokenHash: hashToken(token) } })
    .catch(() => {});
}

/** "Log out everywhere" — used after a password change. */
export async function logoutEverywhere(userId: string): Promise<void> {
  await prisma.adminSession.deleteMany({ where: { userId } });
}

export function readSessionCookie(headers: Headers): string | undefined {
  const cookie = headers.get("cookie");
  if (!cookie) return undefined;

  for (const part of cookie.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

export function sessionCookie(token: string, expiresAt: Date): string {
  const attributes = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Expires=${expiresAt.toUTCString()}`,
  ];
  // The web app and the API are different hosts, so the cookie is set on the
  // shared parent domain (api.haarivedon.com + haarivedon.com) — PLAN.md §3.3.
  if (env.AUTH_COOKIE_DOMAIN) attributes.push(`Domain=${env.AUTH_COOKIE_DOMAIN}`);
  if (isProduction) attributes.push("Secure");

  return attributes.join("; ");
}

export const clearedSessionCookie = () =>
  sessionCookie("", new Date(0)).replace(/Expires=[^;]+/, "Expires=" + new Date(0).toUTCString());

/**
 * Guard for every admin endpoint. Throws rather than returning, so a new
 * admin route cannot ship unauthenticated by forgetting a check.
 */
export async function requireAdmin(headers: Headers): Promise<SessionUser> {
  const user = await sessionFromToken(readSessionCookie(headers));
  if (!user) {
    throw new TsRestHttpError(401, { error: "Please sign in again." });
  }
  return user;
}
