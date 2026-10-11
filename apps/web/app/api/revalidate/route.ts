import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

/**
 * On-publish revalidation hook.
 *
 * The only Route Handler in this app, and it has to be here: `revalidatePath`
 * runs inside Next, so the API cannot call it directly (AGENTS.md's "no Route
 * Handlers" rule is about business logic, which stays in apps/api). Public
 * pages also carry a 5-minute revalidate floor, so a failure here delays a
 * change rather than losing it (docs/PLAN.md §3.3).
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as
    | { paths?: unknown }
    | null;
  const paths = Array.isArray(body?.paths)
    ? body.paths.filter(
        (path): path is string => typeof path === "string" && path.startsWith("/"),
      )
    : [];

  // De-duplicated: a write often reports the same path twice (old and new).
  for (const path of new Set(paths)) revalidatePath(path);

  return NextResponse.json({ revalidated: [...new Set(paths)] });
}
