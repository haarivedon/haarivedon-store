/**
 * Creates the first admin account (CR-3).
 *
 * Run with ADMIN_EMAIL and ADMIN_PASSWORD set. Re-running resets that
 * account's password, which doubles as the documented recovery path for a
 * two-person practice with no email delivery configured (docs/PLAN.md §13).
 */
import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import { prisma } from "../src/client";

const scrypt = promisify(scryptCallback);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
}

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD, e.g.\n" +
        '  ADMIN_EMAIL=you@example.com ADMIN_PASSWORD="a long passphrase" pnpm db:seed:admin',
    );
    process.exit(1);
  }
  if (password.length < 10) {
    console.error("Use a password of at least 10 characters.");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, disabledAt: null },
    create: { email, passwordHash, name: email.split("@")[0] ?? "" },
  });

  // A password change invalidates existing sessions.
  await prisma.adminSession.deleteMany({ where: { userId: user.id } });

  console.log(`Admin account ready: ${email}`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
